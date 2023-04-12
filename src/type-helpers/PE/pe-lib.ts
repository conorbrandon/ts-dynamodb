import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames } from "../../dynamodb-types";
import { Flatten } from "../flatten";
import { Tail, UnionToIntersection } from "../record";
import { Split, Trim, UnionArraySplitter } from "../string";
import { DeepSimplifyObject, IsAnyOrUnknown, IsNoUncheckedIndexAccessEnabled, IsNumberRecord, IsStringRecord, OnlyObjects } from "../utils";
import { AddUndefinedToObjectsWithOnlyUndefinedPropertiesAndUnknownToSparseArrays, MergeRestElementType, PickFromIndexInDdbArrayForPE, PickFromIndexInDdbArrayForPEType, ResolveRestElementUnionsInPickedMergedType } from "./non-accumulator-pick-helpers";
import { TSDdbSet } from "../sets/utils";

type ConstructSparseArray<Length extends `${number}`, Acc extends unknown[] = []> =
  Length extends keyof Acc
  ? Tail<Acc>
  : ConstructSparseArray<Length, [...Acc, unknown]>;
type ConstructSparseArrayForRestArray<RestArrayType extends any[], Index extends `${number}`, ValueAtIndex, IsRestElement extends boolean, Acc extends any[] = []> =
  keyof RestArrayType & `${number}` extends never // if we have finally reached the rest element of the array
  ? (
    IsRestElement extends true // first check if the ValueAtIndex we want to create is a rest element
    ? (
      keyof Acc & Index extends never // if so, make sure the index doesn't already exist in the Acc, if it does, then it shouldn't have really been a rest element
      ? ( // yay, we can create the rest element at the last index, HOWEVER!!!,
        [...Acc, { _isRestElement: true; _val: ValueAtIndex }] // we don't want to actually create it as a rest element. This is because when we use ResolveRestElementUnionsInPickedMergedType<...<...>, ...>,
      )//                          the rest element of KeysOfTuple automatically recreates the last element as a rest element!
      : never // the IsRestElement and index parameter is lying!
    )
    : (
      IsRestElement extends false
      ? keyof Acc & Index extends never // if it is not a rest element, the index _should_ exist in Acc at this point
      ? never
      : [...Acc, { _isRestElement: true; _val: never }] // all is good, fill in never as the last element
      : never
    )
  )
  : (
    IsRestElement extends false // if the ValueAtIndex is not a rest element
    ? (
      Index extends `${Acc['length']}` // if the next index we add is going to be the Index for ValueAtIndex
      ? ConstructSparseArrayForRestArray<Tail<RestArrayType>, Index, ValueAtIndex, IsRestElement, [...Acc, ValueAtIndex]> // instead of creating the newAcc with unknown, create it with the ValueAtIndex
      : ConstructSparseArrayForRestArray<Tail<RestArrayType>, Index, ValueAtIndex, IsRestElement, [...Acc, unknown]> // if not, continue
    )
    : ConstructSparseArrayForRestArray<Tail<RestArrayType>, Index, ValueAtIndex, IsRestElement, [...Acc, unknown]>
  );
type CreateNewArrayForAccWithPickedIndex<T extends any[], Index extends `${number}`, PickedIndex extends PickFromIndexInDdbArrayForPEType, NextKeys extends string[]> =
  keyof T & `${number}` extends never // check if we're dealing with a pure array - not tuples or rest arrays
  // Remember, we are eliminating the case in our system where a rest element comes before a non-rest element.
  ? (
    NextKeys extends []
    ? T | undefined // a ddb array will not even be returned if the index of pick does not exist, even if the array itself exists
    : (
      NestedPickWithAccumulator<T[number], NextKeys>[] | undefined
    )
  )
  : (
    (
      NextKeys extends []
      ? PickedIndex['_val']
      : NestedPickWithAccumulator<PickedIndex['_val'], NextKeys>
    ) extends infer PickedIndexVal
    ? (
      PickedIndex['_isRest'] extends true
      ? ConstructSparseArrayForRestArray<T, Index, PickedIndexVal, PickedIndex['_isRestElement']>
      : (
        ConstructSparseArray<`${T['length']}`> extends (infer sparseArray extends unknown[])
        ? AssignElementTypeToSparseArrayIndex<sparseArray, PickedIndexVal, Index>
        : never
      )
    )
    : never
  );


type AssignElementTypeToSparseArrayIndex<SparseArray extends any[], ElementType, Index extends `${number}`> = {
  [K in keyof SparseArray]: K extends Index ? ElementType : SparseArray[K]
};
type UnionRestElementInExistingArray<Acc extends any[], RestElementType extends MergeRestElementType> = {
  [K in keyof Acc]: Acc[K] extends MergeRestElementType ? Acc[K] | RestElementType : Acc[K]
};
type AssignPickedIndexToExistingAccArray<Acc extends any[], Index extends `${number}`, PickedIndex extends PickFromIndexInDdbArrayForPEType, NextKeys extends string[]> =
  keyof Acc & `${number}` extends never
  ? (
    NextKeys extends []
    ? (Acc[number] | PickedIndex['_val'])[] | undefined
    : (Acc[number] | NestedPickWithAccumulator<PickedIndex['_val'], NextKeys>)[] | undefined
  )
  : (
    (
      NextKeys extends []
      ? PickedIndex['_val']
      : NestedPickWithAccumulator<PickedIndex['_val'], NextKeys, (
        PickedIndex['_isRestElement'] extends true ? {} : Acc[Index & keyof Acc]
      )>
    ) extends infer PickedIndexVal
    ? (
      PickedIndex['_isRestElement'] extends true
      ? UnionRestElementInExistingArray<Acc, { _val: PickedIndexVal; _isRestElement: true }>
      : AssignElementTypeToSparseArrayIndex<Acc, PickedIndexVal, Index>
    )
    : never
  );

type NestedPickWithAccumulator<T extends Record<any, any>, K extends string[], Acc extends Record<any, any> = {}> =
  K extends []
  ? T
  : IsAnyOrUnknown<T> extends true // SHORT CIRCUIT for any or unknown
  ? T
  : (
    T extends DocumentClient.DynamoDbSet
    ? (
      K extends []
      ? T // NOTE: it is easier to add the { wrapperName: 'Set' } in the type that gets fed to this helper, because dealing with arrays is a pain
      : undefined // You cannot index into a DynamoDBSet whatsoever, the value just becomes undefined (unfortunately, to add +?, that has to be done one level up, and I don't feel like coordinating that one level up from this)
    )
    : T extends object
    ? (
      IsStringRecord<T> extends true
      ? {
        [k in K[0]]: NestedPickWithAccumulator<T[k], Tail<K>> | (IsNoUncheckedIndexAccessEnabled extends true ? undefined : never)
      } & Acc
      : (
        IsNumberRecord<T> extends true
        ? {
          [k in K[0] & `${number}`]: NestedPickWithAccumulator<T[k], Tail<K>> | (IsNoUncheckedIndexAccessEnabled extends true ? undefined : never)
        } & Acc
        : (
          K[0] extends `[${infer index extends `${number}`}]`
          ? (
            T extends any[]
            ? (
              PickFromIndexInDdbArrayForPE<T, index> extends (infer pickedIndex extends PickFromIndexInDdbArrayForPEType)
              ? (
                {} extends Acc
                ? CreateNewArrayForAccWithPickedIndex<T, index, pickedIndex, Tail<K>>
                : (
                  Acc extends any[]
                  ? AssignPickedIndexToExistingAccArray<Acc, index, pickedIndex, Tail<K>>
                  : never // I'm thinking it's actually impossible to hit this, because an at this point an Acc kinda has to be an array
                )
              )
              : never
            )
            : {
              [k in K[0]]?: undefined
            } & Acc // TODO: if it blows up again, look to this intersection as the culprit
          )
          : (
            K[0] extends keyof Acc
            ? (
              {
                [k in keyof Acc]: K[0] extends k ? (k extends keyof T ? NestedPickWithAccumulator<T[k], Tail<K>, OnlyObjects<Acc[k]>> : undefined) : Acc[k]
              }
            )
            : (
              K[0] extends keyof T
              ? (
                {
                  [k in Extract<keyof T, K[0]>]: NestedPickWithAccumulator<T[k], Tail<K>>
                } & Acc
              )
              : (
                {
                  [k in K[0]]?: undefined
                } & Acc // TODO: if it blows up again, look to this intersection as the culprit
              )
            )
          )
        )
      )
    )
    : (
      K extends [] ? T : undefined
    )
  );

type OrchestrateNestedPickAccumulation<T extends Record<any, any>, K extends string[][], Acc extends Record<any, any> = {}> =
  K extends []
  ? Acc
  : (
    NestedPickWithAccumulator<T, K[0], Acc> extends infer newAcc
    ? newAcc extends Record<any, any>
    ? OrchestrateNestedPickAccumulation<T, Tail<K>, newAcc>
    : never
    : never
  );

type TopLevelPick<T extends object, Keys extends string> = Keys extends keyof T ? Pick<T, Keys> : { [K in Keys]?: undefined };
type OnlyTopLevelDocPaths<Paths extends string[]> = Paths extends [string] ? Paths[number] : never;
type OnlyNonTopLevelDocPaths<Paths extends string[][], Acc extends string[][] = []> =
  Paths extends [infer Start extends string[], ...infer Rest extends string[][]]
  ? (
    Start extends [string]
    ? OnlyNonTopLevelDocPaths<Rest, Acc>
    : OnlyNonTopLevelDocPaths<Rest, [...Acc, Start]>
  )
  : Acc;

/** Takes an array that represents a document path in a UE and replace any EANs with their mapped value */
type MapDocPathPropsToEAN<Props, EAN extends Record<string, string>> =
  Props extends string[]
  ? {
    [K in keyof Props]:
    Props[K] extends `#${infer prop}[${infer index}]`
    ? index extends `${number}` ? `${EAN[`#${prop}` & keyof EAN]}[${index}]` : never
    : Props[K] extends `#${string}`
    ? EAN[Props[K] & keyof EAN]
    : Props[K]
  }
  : never;
export type MapArrayOfDocPathPropsToEAN<Props extends string[][], EAN extends AnyExpressionAttributeNames> =
  Props extends []
  ? []
  : (
    Tail<Props> extends infer tail
    ? tail extends string[][]
    ? MapArrayOfDocPathPropsToEAN<tail, EAN> extends infer mapped
    ? mapped extends string[][]
    ? [MapDocPathPropsToEAN<Props[0], EAN>, ...mapped]
    : never
    : never
    : never
    : never
  );
type ExtractIndexAccessFromPE<Parts extends string[][]> =
  Parts extends []
  ? []
  : Parts[0] extends (infer firstParts extends string[])
  ? (
    {
      [K in keyof firstParts]: Split<firstParts[K], "[">
    } extends (infer firstPartSplit extends string[][])
    ? Flatten<firstPartSplit> extends (infer flattened extends string[])
    ? ExtractIndexAccessFromPE<Tail<Parts>> extends (infer tailIndices extends any[])
    ? (
      {
        [L in keyof flattened]: flattened[L] extends `${string}]` ? `[${flattened[L]}` : flattened[L]
      } extends (infer joined extends string[])
      ? [joined, ...tailIndices]
      : never
    )
    : never
    : never
    : never
  ) :
  never;

/** Take a full projection expression and parse out all the doc paths to get */
type ParsePEToPropPickNestedArray<PE extends string, EAN extends AnyExpressionAttributeNames> =
  MapArrayOfDocPathPropsToEAN<
    ExtractIndexAccessFromPE<
      UnionArraySplitter<
        Split<PE, ",">
        , ".">
    >
    , EAN>;

/** Takes a SINGLE doc path, may have EANs in it, and create an array out of the doc path using the EANs. Parses only ONE DocPath!!!
 * General purpose function to be used anywhere, i.e. for UEs, etc...
 */
export type CreatePropPickArrayFromDocPath<DocPath extends string, EAN extends AnyExpressionAttributeNames> = ParsePEToPropPickNestedArray<DocPath, EAN> extends (infer singleDocPath extends [string[]]) ? singleDocPath[0] : never;

/** Takes a DynamoDB projection expression and creates the return type of the Item from the PE
 * Can pass an optional flag to _not_ transform the final response into undefineds and unknown arrays
 */
export type ProjectProjectionExpression<T extends Record<any, any>, PE extends string, EAN extends AnyExpressionAttributeNames, NoFinalAddUndefined extends boolean = false> =
  ParsePEToPropPickNestedArray<Trim<Trim<PE, "\t" | "\n">, " ">, EAN> extends (infer nestedPropPickArray extends string[][])
  ? (
    T extends object // ProjectProjectionExpression is the only type helper we want to be able to do distributive conditional types, because for query, there may be multiple types that we need to project over. We don't want to do this for DeepValidateShapeForPutItem, because we do want the key types to be disjoint, but we can't do that for query because they may be querying only the partitionKey of a composite key, for example.
    ? (
      TSDdbSet<T> extends infer tWithSetWrapperName extends object
      ? DeepSimplifyObject<
        (
          OrchestrateNestedPickAccumulation<tWithSetWrapperName, OnlyNonTopLevelDocPaths<nestedPropPickArray>> extends (infer orchestratedPick extends Record<any, any>)
          ? (
            ResolveRestElementUnionsInPickedMergedType<orchestratedPick, tWithSetWrapperName> extends (infer resolvedRest extends Record<PropertyKey, any>)
            ? (
              true extends NoFinalAddUndefined
              ? resolvedRest
              : AddUndefinedToObjectsWithOnlyUndefinedPropertiesAndUnknownToSparseArrays<resolvedRest>
            )
            : never
          )
          : never
        ) & UnionToIntersection<TopLevelPick<tWithSetWrapperName, OnlyTopLevelDocPaths<nestedPropPickArray[number]>>>
      >
      : never
    )
    : never
  )
  : never;