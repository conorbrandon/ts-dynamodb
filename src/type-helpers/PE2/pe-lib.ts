import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, NativeJSBinaryTypes } from "../../dynamodb-types";
import { ArrayHasNoDefinedIndices, Branded, DeepSimplifyObject, IsAnyOrUnknown, IsNever, IsNoUncheckedIndexAccessEnabled, NoUndefined, OnlyNumbers, Primitive, UnbrandRecord } from "../utils";
import { CheckIfUndefinedInTuple, CheckKeysOfObjectForUndefined } from "../PE/non-accumulator-pick-helpers";
import { GetAllNonIndexKeys } from "../record";
import { TSDdbSet } from "../sets/utils";
import { ParsePEToPEStruct } from "./parse-pe-to-object-lib";

/**
 * We need the `PropertyKey` key type because `ArrayIndicesStruct`s have number and symbol keys
 */
export type PEStruct = { [key: PropertyKey]: true | PEStruct };
export type ArrayIndicesStruct = Branded<"ARRAY_INDICES", {}>;
type UnsetTupleIndex = Branded<"UNSET_TUPLE_INDEX", symbol>;

type RemapNumberKeysToNumStrings<Struct extends ArrayIndicesStruct> = {
  [K in keyof Struct as K extends number ? `${K}` : K]: Struct[K];
}
type ProjectRestPart<UBStructOfRestIndices extends {}, RestPart extends any[], MakeRequired extends boolean> = (
  [
    Extract<UBStructOfRestIndices[keyof UBStructOfRestIndices], true>, // determine if there are index access that don't drill any deeper
    Exclude<UBStructOfRestIndices[keyof UBStructOfRestIndices], true> // find index access that does drill deeper. This may be a union. This is why ProjectPEStruct must distribute Struct
  ] extends infer whichProjections extends [true, PEStruct]
  ? (
    | (
      IsNever<whichProjections[0]> extends true ? never : RestPart[number] // if there is top level index access, add that to the union
    )
    | ( // if there is drilling, project that and add it to the union
      IsNever<whichProjections[1]> extends true
      ? never
      : (
        whichProjections[1] extends infer w1 extends PEStruct
        ? w1 extends ArrayIndicesStruct
        ? ProjectArrayIndicesStruct<
          RemapNumberKeysToNumStrings<w1>, // TODO: why is this necessary?
          RestPart[number],
          MakeRequired
        >
        : ProjectPEStruct<w1, RestPart[number], MakeRequired>
        : never
      )
    )
  )
  : never
)[];
type ProjectDefinedPart<UBStructOfDefinedIndices extends {}, DefinedPart extends any[], MakeRequired extends boolean> = {
  [K in keyof DefinedPart]:
  K extends keyof UBStructOfDefinedIndices
  ? (
    UBStructOfDefinedIndices[K] extends ArrayIndicesStruct
    ? ProjectArrayIndicesStruct<UBStructOfDefinedIndices[K], DefinedPart[K], MakeRequired>
    : UBStructOfDefinedIndices[K] extends PEStruct
    ? ProjectPEStruct<UBStructOfDefinedIndices[K], DefinedPart[K], MakeRequired>
    : DefinedPart[K]
  )
  : UnsetTupleIndex
};

type Untuplify<T extends any[], DefinedAcc extends any[] = []> =
  T extends [infer Start, ...infer Rest]
  ? Untuplify<Rest, [...DefinedAcc, Start]>
  : [DefinedAcc, T];
type GetDefinedAndRestIndices<DefinedPart extends any[], UBStruct extends {}> =
  DefinedPart extends []
  ? [definedIndices: {}, restIndices: UBStruct]
  : Pick<UBStruct, Extract<keyof UBStruct, keyof DefinedPart>> extends infer definedIndices
  ? [definedIndices: definedIndices, restIndices: Omit<UBStruct, keyof definedIndices>]
  : never;
type __ProjectArrayIndicesStruct<Struct extends ArrayIndicesStruct, T, MakeRequired extends boolean> =
  UnbrandRecord<Struct> extends infer ubStruct extends {}
  ? T extends any[]
  ? (
    Untuplify<T> extends infer parts extends [any[], any[]]
    ? parts[0] extends infer definedPart extends any[]
    ? parts[1] extends infer restPart extends any[]
    ? GetDefinedAndRestIndices<definedPart, ubStruct> extends infer defAndRest extends [{}, {}]
    ? defAndRest[0] extends infer definedIndices extends {}
    ? defAndRest[1] extends infer restIndices extends {}
    ? [
      ...ProjectDefinedPart<definedIndices, definedPart, MakeRequired>,
      ...(
        {} extends restIndices // this check is not sufficient since you could be indexing on out of bounds tuple indices
        ? []
        : restPart extends [] // this catches indexing on out of bounds tuple indices
        ? []
        : ProjectRestPart<restIndices, restPart, MakeRequired>
      )
    ] extends infer final extends any[]
    ? (
      IsNever<keyof final & `${number}`> extends true
      ? final | undefined
      : final
    )
    : never // final inference
    : never // restIndices inference
    : never // definedIndices inference
    : never // defAndRest inference
    : never // restPart inference
    : never // definedPart inference
    : never // parts inference
  )
  : undefined // fallback for distributive conditional on T extends any[]
  : never;

type ProjectArrayIndicesStruct<Struct extends ArrayIndicesStruct, T, MakeRequired extends boolean> = __ProjectArrayIndicesStruct<Struct, T, MakeRequired> extends infer p ? p extends any[] ? p extends UnsetTupleIndex[] ? undefined : AddUndefinedOrUnknownToArray<FilterUnsetTupleIndex<p>> : p : never;

type AddWrapperNameToDdbSet<T> = T extends DocumentClient.DynamoDbSet ? (T & { wrapperName: "Set" }) | undefined : T;
type TerminateOnNonIndexableTypes<Struct, T> = Struct extends true ? AddWrapperNameToDdbSet<T> : undefined;
type Numberify<S> = S extends `${infer N extends number}` ? N : S;
type _GetKeysForNextLevel<T, Keys> = Keys extends `${OnlyNumbers<keyof T>}` ? Numberify<Keys> : Keys;
type GetKeysForNextLevel<Struct extends PEStruct, T> = _GetKeysForNextLevel<T, keyof Struct>;
export type ProjectPEStruct<Struct extends PEStruct, T, MakeRequired extends boolean> =
  Struct extends any
  ? T extends any
  ? (
    IsAnyOrUnknown<T> extends true
    ? T
    : T extends Primitive | DocumentClient.DynamoDbSet | NativeJSBinaryTypes
    ? TerminateOnNonIndexableTypes<Struct, T>
    : (
      {
        [K in Extract<GetKeysForNextLevel<Struct, T>, keyof T>]:
        (
          Struct[K] extends true
          ? AddWrapperNameToDdbSet<T[K]>
          : (
            Struct[K] extends ArrayIndicesStruct
            ? ProjectArrayIndicesStruct<Struct[K], T[K], MakeRequired>
            : (
              Struct[K] extends PEStruct
              ? ProjectPEStruct<Struct[K], T[K], MakeRequired>
              : never
            )
          )
        ) | (K extends GetAllNonIndexKeys<T> ? never : IsNoUncheckedIndexAccessEnabled extends true ? undefined : never)
      } & {
        [K in Exclude<GetKeysForNextLevel<Struct, T>, keyof T>]: undefined;
      } extends infer projected extends object
      ? MakeRequired extends true
      ? RemoveUndefinedOneLevel<projected>
      : AddUndefinedToObject<projected>
      : never
    )
  )
  : never
  : never;


type FilterUnsetTupleIndex<T extends any[], Acc extends any[] = []> =
  T extends [infer First, ...infer Rest]
  ? (
    [First] extends [UnsetTupleIndex] // do not distribute this, causes something like [string | number] to becomes [string] | [number]
    ? FilterUnsetTupleIndex<Rest, Acc>
    : FilterUnsetTupleIndex<Rest, [...Acc, First]>
  )
  : [...Acc, ...T];

type AddUndefinedToObject<T extends Record<PropertyKey, any>> = 1 extends CheckKeysOfObjectForUndefined<T> ? T : T | undefined;

type AddUndefinedOrUnknownToArray<T extends any[]> = ArrayHasNoDefinedIndices<T> extends true ? T : 1 extends CheckIfUndefinedInTuple<T> ? unknown[] | undefined : T;

type RemoveUndefinedOneLevel<T extends object> = {
  [K in keyof T]-?: Exclude<T[K], undefined>;
};

type TLPKeys<T extends Record<string, any>, Props extends string> = _GetKeysForNextLevel<T, Props>;
type TopLevelPick<T extends Record<string, any>, Props extends string, MakeRequired extends boolean> =
  T extends any
  ? (
    {
      [K in Extract<TLPKeys<T, Props>, keyof T>]: T[K] | (K extends GetAllNonIndexKeys<T> ? never : IsNoUncheckedIndexAccessEnabled extends true ? undefined : never);
    } & {
      [K in Exclude<TLPKeys<T, Props>, keyof T>]: undefined;
    }
  ) extends infer projected extends object
  ? MakeRequired extends true
  ? RemoveUndefinedOneLevel<projected>
  : projected
  : never
  : never;

export type ProjectProjectionExpressionStruct<T extends Record<string, any>, PE extends string, EAN extends AnyExpressionAttributeNames, MakeRequired extends boolean = false> =
  ParsePEToPEStruct<PE, EAN> extends infer peStruct extends PEStruct
  ? peStruct extends Record<string, true>
  ? DeepSimplifyObject<TopLevelPick<TSDdbSet<T, MakeRequired>, keyof peStruct & string, MakeRequired>>
  : DeepSimplifyObject<NoUndefined<ProjectPEStruct<peStruct, T, MakeRequired>>>
  : never; // peStruct inference