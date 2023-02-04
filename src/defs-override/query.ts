import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, ExpressionAttributeValues } from "../dynamodb-types";
import { IndexFromValue } from "../lib";
import { ProjectNonIndexQuery, ProjectQuery } from "../type-helpers/query/common";
import { NotEmptyWithMessage } from "../type-helpers/record";
import { FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../type-helpers/string";
import { IsNever, OnlyStrings } from "../type-helpers/utils";

export type QueryInput<
  TN extends string,
  IndexName extends string,
  KCE extends string,
  PE extends string,
  FE extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAV extends Record<EAVs, any>,
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression'> & {
  TableName: TN;
  IndexName?: IndexName;
  KeyConditionExpression?: `${KCE}${PE}${FE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? KCE : `Error ❌ unused EANs or EAVs in the KCE and/or PE: ${FilterUnusedEANOrVs<`${KCE}${PE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  ProjectionExpression?: PE; // from what it seems, putting the Error condition on the KCE is sufficient. This is because the either the KCE or KCs are required (DDB will yell at you if you don't include either, and I can't be bothered with legacy parameters, the current ones are hard enough lol)
  FilterExpression?: FE;
};

/** 
 * Note: we do not have to cover the case where KeyConditionExpression is omitted. 
 * They should really have a discriminated union for that, but either KeyConditions or KeyConditionExpression is required. 
 */
export type QueryOutput<
  TableItem extends object,
  PartitionKeyField extends string, // used to validate the LSI key
  SortKeyField extends string, // used to pick from TypesUnion when the LSI projection type is keys-only or attributes
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues,
  TableIndex extends IndexFromValue, // this is to determine the type of item to give to ProjectProjectionExpression
  KCE extends string,
  PE extends string
> = Omit<DocumentClient.QueryOutput, 'Items'> & {
  Items?: IsNever<TableIndex> extends true
  ? ProjectNonIndexQuery<
    KCE,
    EAN,
    EAV,
    PartitionKeyField,
    SortKeyField,
    TableItem,
    PE
  >[]
  : ProjectQuery<
    KCE,
    EAN,
    EAV,
    TableIndex,
    TableItem,
    PartitionKeyField,
    SortKeyField,
    PE
  >[];
};