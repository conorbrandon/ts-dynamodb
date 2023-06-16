import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, ExpressionAttributeValues } from "../../dynamodb-types";
import { CreatePropPickArrayFromDocPath } from "../PE2/parse-pe-to-object-lib";
import { DrillIntoTypeUsingStrArray, Split, Trim, UnionSplitter } from "../string";
import { IsNever, NoUndefined } from "../utils";
import { NestedPickForUE } from "./nested-pick";

type IsDeleterTupleMatchingDynamoDBSet<Drilled, EAV> =
  Drilled extends DocumentClient.DynamoDbSet
  ? (
    Drilled extends EAV ? EAV extends Drilled ? true : false : false
  )
  : false;

export type ValidateDeleterTuples<DeleterTuple, T extends Record<string, any>, EAN extends Record<string, string>, EAV extends Record<string, any>> =
  DeleterTuple extends [infer names extends string, infer value extends string]
  ? CreatePropPickArrayFromDocPath<names, EAN> extends (infer PropPickArray extends string[])
  // no need to add AddUndefinedToIndexAccess because we use NoUndefined below anyway
  ? NoUndefined<DrillIntoTypeUsingStrArray<NestedPickForUE<T, PropPickArray, never>, PropPickArray>> extends infer drilled
  ? (
    value extends `:${string}`
    ? EAV[keyof EAV & value]
    : never
  ) extends infer eav
  ? (
    IsDeleterTupleMatchingDynamoDBSet<drilled, eav>
  )
  : false
  : false
  : never
  : never;

export type ExtractDeleteTuplesFromUE<UE extends string, NoUnion extends boolean = false> =
  SplitUEForDelete<UE> extends infer Strs
  ? Strs extends `${string}DELETE${infer PropsPart}`
  ? Split<Trim<PropsPart>, ","> extends infer deleterTuple extends string[]
  ? (
    {
      [K in keyof deleterTuple]: Split<deleterTuple[K], ":"> extends infer splitDeleter extends [string, string] ? [splitDeleter[0], `:${splitDeleter[1]}`] : "ERROR"
    } extends infer final extends [string, string][]
    ? (
      NoUnion extends true
      ? final
      : final[number]
    )
    : "ERROR"
  )
  : never
  : never
  : never;
// Remember, we are guaranteeing (hopefully) that each clause is separated by a space on both sides. It looks like DynamoDB makes you do it before a clause, but not after if the next character is an #ean. But, the cleanup type we use in IsUEValid will replace any clauses that have this #ean condition.
type SplitUEForDelete<UE extends string> = UnionSplitter<UnionSplitter<Split<UE, " SET ">[number], " REMOVE ">[number], " ADD ">[number];

export type IsUEValidForDELETE<
  UE extends string,
  T extends Record<string, any>,
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues
> = ExtractDeleteTuplesFromUE<UE> extends infer DeleteTuple
  ? (
    IsNever<DeleteTuple> extends true
    ? 1
    : (
      DeleteTuple extends "ERROR" // this happens in the case there was an DELETE clause to parse, but it wasn't well formatted
      ? 0
      : ValidateDeleterTuples<DeleteTuple, T, EAN, EAV> extends true
      ? 1
      : 0
    )
  )
  : never;