import { NestedPickForUE } from "./nested-pick";
import { DrillIntoTypeUsingStrArray, Split, Trim, UnionSplitter } from "../string";
import { CreatePropPickArrayFromDocPath } from "../PE/pe-lib";
import { AnyExpressionAttributeNames } from "../../dynamodb-types";
import { IsNever } from "../utils";

// REMOVE
type DoesRemoveDocPathExtendUndefined<T extends Record<string, any>, Removers extends string, EAN extends Record<string, string>> =
  Removers extends string
  ? CreatePropPickArrayFromDocPath<Removers, EAN> extends infer PropPickArray
  ? PropPickArray extends string[]
  ? (
    // we want index signature keys to be able to be removed, hence harcoded undefined is passed
    DrillIntoTypeUsingStrArray<NestedPickForUE<T, PropPickArray, undefined>, PropPickArray> extends infer drilled
    ? (
      undefined extends drilled ? true : false
    )
    : never
  )
  : never
  : never
  : never;

export type ExtractPropsToRemoveFromUE<UE extends string, NoUnion extends boolean = false> =
  SplitUEForREMOVE<UE> extends infer Strs
  ? Strs extends `${string}REMOVE${infer PropsPart}`
  ? Split<Trim<PropsPart, " ">, ","> extends (infer RemoveDocPaths extends string[])
  ? true extends NoUnion ? RemoveDocPaths : RemoveDocPaths[number]
  : never
  : never
  : never;
// Remember, we are guaranteeing (hopefully) that each clause is separated by a space on both sides. It looks like DynamoDB makes you do it before a clause, but not after if the next character is an #ean. But, the cleanup type we use in IsUEValid will replace any clauses that have this #ean condition.
type SplitUEForREMOVE<UE extends string> = UnionSplitter<UnionSplitter<Split<UE, " ADD ">[number], " SET ">[number], " DELETE ">[number];

export type IsUEValidForREMOVE<
  UE extends string,
  T extends Record<string, any>,
  EAN extends AnyExpressionAttributeNames
> = ExtractPropsToRemoveFromUE<UE> extends infer PropsToRemove
  ? IsNever<PropsToRemove> extends true ? 1 : PropsToRemove extends string
  ? DoesRemoveDocPathExtendUndefined<T, PropsToRemove, EAN> extends true
  ? 1
  : 0
  : never
  : never;