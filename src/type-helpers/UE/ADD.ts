import { NestedPickForUE } from "./nested-pick";
import { DrillIntoTypeUsingStrArray, Split, Trim, UnionSplitter } from "../string";
import { CreatePropPickArrayFromDocPath } from "../PE/pe-lib";
import { IsNever, NoUndefined } from "../utils";
import { AnyExpressionAttributeNames, ExpressionAttributeValues } from "../../dynamodb-types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

// Nobody would be insane enough to create a branded constant number, would they? Aye yai yai...
// If D is a branded number, fine, I give up, see above.
// If it isn't though, see if any number extends D. It must for the update to be valid.
type IsDrilledNumberOrBrandedNumber<D extends number> = D extends object ? true : number extends D ? true : false;

type IsAdderTupleNumberType<Drilled, EAV> =
  IsNever<Drilled & EAV> extends true // intersect so that if two `const` numbers becomes never, it is invalid
  ? false
  : Drilled extends number ? EAV extends number ? IsDrilledNumberOrBrandedNumber<Drilled> : false : false;

type IsAdderTupleMatchingDynamoDBSet<Drilled, EAV> =
  Drilled extends DocumentClient.DynamoDbSet
  ? (
    Drilled extends EAV ? EAV extends Drilled ? true : false : false
  )
  : false;

// ADD
export type ValidateAdderTuples<AdderTuple, T extends Record<string, any>, EAN extends Record<string, string>, EAV extends Record<string, any>> =
  AdderTuple extends [infer names extends string, infer value extends string]
  ? CreatePropPickArrayFromDocPath<names, EAN> extends (infer PropPickArray extends string[])
  // the behavior of ADD is very interesting. If the property doesn't exist, it can create it. So we can actually accept `undefined` for the drilled type, but we filter it out here so it doesn't cause issues in the checks below.
  ? NoUndefined<DrillIntoTypeUsingStrArray<NestedPickForUE<T, PropPickArray>, PropPickArray>> extends infer drilled
  ? (
    value extends `:${string}`
    ? EAV[keyof EAV & value]
    : never
  ) extends infer eav
  ? (
    drilled extends number
    ? IsAdderTupleNumberType<drilled, eav>
    : drilled extends DocumentClient.DynamoDbSet
    ? IsAdderTupleMatchingDynamoDBSet<drilled, eav>
    : false
  )
  : false
  : false
  : never
  : never;

export type ExtractAddTuplesFromUE<UE extends string, NoUnion extends boolean = false> =
  SplitUEForAdd<UE> extends infer Strs
  ? Strs extends `${string}ADD${infer PropsPart}`
  ? Split<Trim<PropsPart>, ","> extends infer adderTuple extends string[]
  ? (
    {
      [K in keyof adderTuple]: Split<adderTuple[K], ":"> extends infer splitAdder extends [string, string] ? [splitAdder[0], `:${splitAdder[1]}`] : "ERROR"
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
type SplitUEForAdd<UE extends string> = UnionSplitter<UnionSplitter<Split<UE, " SET ">[number], " REMOVE ">[number], " DELETE ">[number];


export type IsUEValidForADD<
  UE extends string,
  T extends Record<string, any>,
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues
> = ExtractAddTuplesFromUE<UE> extends infer AddTuple
  ? (
    IsNever<AddTuple> extends true
    ? 1
    : (
      AddTuple extends "ERROR" // this happens in the case there was an ADD clause to parse, but it wasn't well formatted
      ? 0
      : ValidateAdderTuples<AddTuple, T, EAN, EAV> extends true
      ? 1
      : 0
    )
  )
  : never;