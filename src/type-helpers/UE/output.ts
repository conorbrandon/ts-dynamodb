import { Join } from "../string";
import { DeepSimplifyObject, IsNever, NoUndefined, Primitive } from "../utils";
import { ExtractAddTuplesFromUE } from "./ADD";
import { ExtractPropsToRemoveFromUE } from "./REMOVE";
import { ExtractSetterPartOfUE, ExtractSetterTuplesLookAhead } from "./SET";
import { CreatePropPickArrayFromDocPath, ProjectProjectionExpression } from "../PE/pe-lib";
import { AnyExpressionAttributeNames } from "../../dynamodb-types";
import { UppercaseUEClauses } from "./ue-lib";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Tail } from "../record";
import { ExtractDeleteTuplesFromUE } from "./DELETE";

// TODO: look into making this type a little better, because by doing distributive conditional on the DdbSet I've realized that NoUndefined might be overkill... undefined is disappearing from DdbSets by virtue of calling NoUndefined creating `never`. (Essentially, if a DdbSet is union'ed with undefined, undefined gets carried into the next branch, becomes never by the time we infer noUndef, and the DdbSet is union'ed with never)
type RemoveUndefinedFromUEType<T extends object> = {
  [K in keyof T]-?:
  T[K] extends infer tk
  ? (
    tk extends DocumentClient.DynamoDbSet
    ? tk
    : NoUndefined<tk> extends infer noUndef
    ? noUndef extends Primitive // as always, filter out cheeky branded types
    ? noUndef
    : noUndef extends object
    ? RemoveUndefinedFromUEType<noUndef>
    : noUndef
    : never
  )
  : never
};

type _DrillIntoTypeToAddUndefinedToArray<PropPickArray extends string[], T extends object> =
  PropPickArray extends []
  ? T | undefined
  : {
    [K in keyof T]: (
      T[K] extends infer tk
      ? K extends PropPickArray[0]
      ? (
        tk extends object ? _DrillIntoTypeToAddUndefinedToArray<Tail<PropPickArray>, tk> : tk
      )
      : tk
      : never
    )
  };
type DrillIntoTypeToAddUndefinedToArray<PropPickArray extends string[][], T extends object> =
  PropPickArray extends []
  ? T
  : (
    _DrillIntoTypeToAddUndefinedToArray<PropPickArray[0], T> extends infer firstDrilled extends object
    ? DrillIntoTypeToAddUndefinedToArray<Tail<PropPickArray>, firstDrilled>
    : never
  );
type AddUndefinedToOnlyIndexRemoveProps<UE extends string, T extends object, EAN extends AnyExpressionAttributeNames> =
  ExtractPropsToRemoveFromUE<UE, true> extends infer removeProps extends string[]
  ? RemoveNonIndexRemovesFromRemoveProps<removeProps> extends infer onlyIndexRemoves extends string[]
  ? {
    [K in keyof onlyIndexRemoves]: onlyIndexRemoves[K] extends `${infer Start}[${number}]` ? CreatePropPickArrayFromDocPath<Start, EAN> : never
  } extends infer pathsToAddUndefinedTo extends string[][]
  ? ExtractDeleterDocPathsFromUE<UE> extends infer deleterDocPaths extends string[]
  ? {
    [K in keyof deleterDocPaths]: CreatePropPickArrayFromDocPath<deleterDocPaths[K], EAN>
  } extends infer deleterPathsToAddUndefinedTo extends string[][]
  ? DrillIntoTypeToAddUndefinedToArray<[...(IsNever<pathsToAddUndefinedTo> extends true ? [] : pathsToAddUndefinedTo), ...(IsNever<deleterPathsToAddUndefinedTo> extends true ? [] : deleterPathsToAddUndefinedTo)], T>
  : never
  : never
  : never
  : never
  : never;

type RemoveNonIndexRemovesFromRemoveProps<RemoveProps extends string[]> =
  RemoveProps extends [infer S extends string, ...infer Rest extends string[]]
  ? (
    S extends `${string}[${number}]`
    ? [S, ...RemoveNonIndexRemovesFromRemoveProps<Rest>]
    : RemoveNonIndexRemovesFromRemoveProps<Rest>
  )
  : [];

type ExtractSetterPEFromUE<
  UE extends string
> =
  ExtractSetterPartOfUE<UE> extends infer setterPart
  ? IsNever<setterPart> extends true ? ""
  : setterPart extends string // setterPart could be never here
  ? ExtractSetterTuplesLookAhead<setterPart> extends (infer setterTuples extends string[][])
  ? {
    [K in keyof setterTuples]: setterTuples[K][0]
  } extends (infer setterDocPaths extends string[])
  ? Join<setterDocPaths, ", "> extends (infer setterPE extends string)
  ? (IsNever<setterPE> extends true ? "" : setterPE)
  : never
  : never
  : never
  : never
  : never;

type ExtractAddPEFromUE<
  UE extends string
> = ExtractAddTuplesFromUE<UE, true> extends (infer adderTuples extends string[][])
  ? {
    [K in keyof adderTuples]: adderTuples[K][0]
  } extends (infer adderDocPaths extends string[])
  ? Join<adderDocPaths, ", "> extends (infer addPE extends string)
  ? (IsNever<addPE> extends true ? "" : addPE)
  : never
  : never
  : never;

type ExtractRemovePEFromUE<
  UE extends string,
  RemoveNonIndexRemovedForUPDATED_NEW extends boolean
> = ExtractPropsToRemoveFromUE<UE, true> extends infer removeProps
  ? IsNever<removeProps> extends true ? ""
  : (
    removeProps extends string[]
    ? (
      RemoveNonIndexRemovedForUPDATED_NEW extends true ? RemoveNonIndexRemovesFromRemoveProps<removeProps> : removeProps
    ) extends (infer removesToJoin extends string[])
    ? Join<removesToJoin, ", "> extends (infer removePE extends string)
    ? (IsNever<removePE> extends true ? "" : removePE)
    : never
    : never
    : never
  )
  : never;

type ExtractDeleterDocPathsFromUE<UE extends string> =
  ExtractDeleteTuplesFromUE<UE, true> extends (infer deleterTuples extends string[][])
  ? {
    [K in keyof deleterTuples]: deleterTuples[K][0]
  } extends (infer deleterDocPaths extends string[])
  ? deleterDocPaths
  : never
  : never;
type ExtractDeletePEFromUE<
  UE extends string,
> =
  ExtractDeleterDocPathsFromUE<UE> extends infer deleterDocPaths extends string[]
  ? Join<deleterDocPaths, ","> extends (infer deleterPE extends string)
  ? (IsNever<deleterPE> extends true ? "" : deleterPE)
  : never
  : never;

export type ProjectUpdateExpression<
  UE extends string,
  T extends Record<string, any>,
  EAN extends AnyExpressionAttributeNames,
  ReturnValues extends 'UPDATED_OLD' | 'UPDATED_NEW'
> = UppercaseUEClauses<UE> extends (infer trimmedUE extends string)
  ? (
    ExtractSetterPEFromUE<trimmedUE> extends (infer setterPE extends string)
    ? ExtractAddPEFromUE<trimmedUE> extends (infer addPE extends string)
    ? ExtractRemovePEFromUE<trimmedUE, (ReturnValues extends 'UPDATED_OLD' ? false : true)> extends (infer removePE extends string)
    ? ExtractDeletePEFromUE<trimmedUE> extends (infer deletePE extends string)
    ? Join<[setterPE, addPE, removePE, deletePE], ", "> extends (infer fullPE extends string)
    ? (
      ReturnValues extends 'UPDATED_OLD'
      ? ProjectProjectionExpression<T, fullPE, EAN, false>
      : DeepSimplifyObject<
        AddUndefinedToOnlyIndexRemoveProps<
          trimmedUE,
          RemoveUndefinedFromUEType< // because this is UPDATED_NEW, we know we haven't set anything to undefined
            ProjectProjectionExpression<T, fullPE, EAN, true>
          >,
          EAN
        >
      >
    )
    : never
    : never
    : never
    : never
    : never
  )
  : never;