import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, DynamoDBKeyValue, ExpressionAttributeValues } from "../dynamodb-types";
import { GSIIndexFromValue, IndexFromValue, LSIIndexFromValue } from "../lib";
import { ProjectNonIndexQuery, ProjectQuery } from "../type-helpers/query/common";
import { DeepPartial, NotEmptyWithMessage } from "../type-helpers/record";
import { FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../type-helpers/string";
import { IsNever, OnlyStrings } from "../type-helpers/utils";
import { _LogParams } from "./defs-helpers";
import { GetGSIIndexKeyTypes } from "../type-helpers/query/gsi-lib";
import { GetLSIIndexKeyTypes } from "../type-helpers/query/lsi-lib";

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
  KeyConditionExpression?: `${KCE}${PE}${FE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? KCE : `Error ❌ unused EANs or EAVs in the KCE, PE, and/or FE: ${FilterUnusedEANOrVs<`${KCE}${PE}${FE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  ProjectionExpression?: PE; // from what it seems, putting the Error condition on the KCE is sufficient. This is because the either the KCE or KCs are required (DDB will yell at you if you don't include either, and I can't be bothered with legacy parameters, the current ones are hard enough lol)
  FilterExpression?: FE;
};
export type QueryPEInput<
  TN extends string,
  IndexName extends string,
  KCE extends string,
  FE extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAV extends Record<EAVs, any>,
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression'> & {
  TableName: TN;
  IndexName?: IndexName;
  KeyConditionExpression?: `${KCE}${FE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? KCE : `Error ❌ unused EANs or EAVs in the KCE and/or FE: ${FilterUnusedEANOrVs<`${KCE}${FE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  FilterExpression?: FE;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `queryPE` creates the parameters for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
};

export type QueryKeyKey<TableItem extends object, IndexName extends string, Index extends IndexFromValue, tableKey extends Record<string, any>, PartitionKeyField extends string> =
  IsNever<IndexName> extends true
  ? (
    tableKey extends any
    ? Pick<tableKey, PartitionKeyField> & Partial<Omit<tableKey, PartitionKeyField>>
    : never
  )
  : Index extends GSIIndexFromValue
  ? GetGSIIndexKeyTypes<Index, TableItem>
  : Index extends LSIIndexFromValue
  ? GetLSIIndexKeyTypes<Index, PartitionKeyField, TableItem>
  : never;
export type QueryKeyInput<
  TN extends string,
  Key extends Record<string, unknown>,
  IndexName extends string,
  PE extends string,
  FE extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAV extends Record<EAVs, any>,
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression'> & {
  TableName: TN;
  IndexName?: IndexName;
  Key: Key;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  ProjectionExpression?: PE;
  FilterExpression?: `${FE}${PE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? FE : `Error ❌ unused EANs or EAVs in the FE and/or PE: ${FilterUnusedEANOrVs<`${FE}${PE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `queryKey` creates the KeyConditionExpression for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
};
export type QueryKeyPEInput<
  TN extends string,
  Key extends Record<string, unknown>,
  IndexName extends string,
  FE extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAV extends Record<EAVs, any>,
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression'> & {
  TableName: TN;
  IndexName?: IndexName;
  Key: Key;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  FilterExpression?: FE extends UseAllExpressionAttributesInString<EAN, EAV> ? FE : `Error ❌ unused EANs or EAVs in the FE: ${FilterUnusedEANOrVs<FE, OnlyStrings<keyof EAN | keyof EAV>>}`;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `queryKey` creates the KeyConditionExpression for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
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
> = (Omit<DocumentClient.QueryOutput, 'Items'> & {
  Items?: (IsNever<TableIndex> extends true
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
    >[]) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;
export type QueryPEOutput<
  TableItem extends object,
  PartitionKeyField extends string, // used to validate the LSI key
  SortKeyField extends string, // used to pick from TypesUnion when the LSI projection type is keys-only or attributes
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues,
  TableIndex extends IndexFromValue, // this is to determine the type of item to give to ProjectProjectionExpression
  KCE extends string,
  PE extends string | undefined
> = (Omit<DocumentClient.QueryOutput, 'Items'> & {
  Items?: (
    undefined extends PE
    ? (
      IsNever<TableIndex> extends true
      ? ProjectNonIndexQuery<
        KCE,
        EAN,
        EAV,
        PartitionKeyField,
        SortKeyField,
        TableItem,
        string
      >[]
      : ProjectQuery<
        KCE,
        EAN,
        EAV,
        TableIndex,
        TableItem,
        PartitionKeyField,
        SortKeyField,
        string
      >[]
    )
    : string extends PE
    ? (
      DeepPartial<
        IsNever<TableIndex> extends true
        ? ProjectNonIndexQuery<
          KCE,
          EAN,
          EAV,
          PartitionKeyField,
          SortKeyField,
          TableItem,
          string
        >[]
        : ProjectQuery<
          KCE,
          EAN,
          EAV,
          TableIndex,
          TableItem,
          PartitionKeyField,
          SortKeyField,
          string
        >[]
      >
    )
    : PE extends string
    ? (
      IsNever<TableIndex> extends true
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
      >[]
    )
    : never
  ) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;

export type QueryItemOutput<
  TableItem extends object,
  PartitionKeyField extends string, // used to validate the LSI key
  SortKeyField extends string, // used to pick from TypesUnion when the LSI projection type is keys-only or attributes
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues,
  TableIndex extends IndexFromValue, // this is to determine the type of item to give to ProjectProjectionExpression
  KCE extends string,
  PE extends string
> = (
  IsNever<TableIndex> extends true
  ? ProjectNonIndexQuery<
    KCE,
    EAN,
    EAV,
    PartitionKeyField,
    SortKeyField,
    TableItem,
    PE
  >
  : ProjectQuery<
    KCE,
    EAN,
    EAV,
    TableIndex,
    TableItem,
    PartitionKeyField,
    SortKeyField,
    PE
  >
) extends infer Res ? Res : never;
export type QueryItemPEOutput<
  TableItem extends object,
  PartitionKeyField extends string, // used to validate the LSI key
  SortKeyField extends string, // used to pick from TypesUnion when the LSI projection type is keys-only or attributes
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues,
  TableIndex extends IndexFromValue, // this is to determine the type of item to give to ProjectProjectionExpression
  KCE extends string,
  PE extends string | undefined
> = (
  undefined extends PE
  ? (
    IsNever<TableIndex> extends true
    ? ProjectNonIndexQuery<
      KCE,
      EAN,
      EAV,
      PartitionKeyField,
      SortKeyField,
      TableItem,
      string
    >
    : ProjectQuery<
      KCE,
      EAN,
      EAV,
      TableIndex,
      TableItem,
      PartitionKeyField,
      SortKeyField,
      string
    >
  )
  : string extends PE
  ? (
    DeepPartial<
      IsNever<TableIndex> extends true
      ? ProjectNonIndexQuery<
        KCE,
        EAN,
        EAV,
        PartitionKeyField,
        SortKeyField,
        TableItem,
        string
      >
      : ProjectQuery<
        KCE,
        EAN,
        EAV,
        TableIndex,
        TableItem,
        PartitionKeyField,
        SortKeyField,
        string
      >
    >
  )
  : PE extends string
  ? (
    IsNever<TableIndex> extends true
    ? ProjectNonIndexQuery<
      KCE,
      EAN,
      EAV,
      PartitionKeyField,
      SortKeyField,
      TableItem,
      PE
    >
    : ProjectQuery<
      KCE,
      EAN,
      EAV,
      TableIndex,
      TableItem,
      PartitionKeyField,
      SortKeyField,
      PE
    >
  )
  : never
) extends infer Res ? Res : never;

export type QueryKeyOutput<
  Key extends Record<string, unknown>,
  TableItem extends object,
  PartitionKeyField extends string, // used to validate the LSI key
  SortKeyField extends string, // used to pick from TypesUnion when the LSI projection type is keys-only or attributes
  EAN extends AnyExpressionAttributeNames,
  TableIndex extends IndexFromValue, // this is to determine the type of item to give to ProjectProjectionExpression
  PE extends string
> = (Omit<DocumentClient.QueryOutput, 'Items'> & {
  Items?: (
    IsNever<TableIndex> extends true
    ? ProjectNonIndexQuery<
      never,
      EAN,
      {},
      PartitionKeyField,
      SortKeyField,
      TableItem,
      PE,
      Key extends Record<string, DynamoDBKeyValue> ? Key : never
    >[]
    : ProjectQuery<
      never,
      EAN,
      {},
      TableIndex,
      TableItem,
      PartitionKeyField,
      SortKeyField,
      PE,
      Key extends Record<string, DynamoDBKeyValue> ? Key : never
    >[]
  ) extends infer Res extends any[] ? Res : never;
}) extends infer Res2 ? Res2 : never;

export type QueryKeyPEOutput<
  Key extends Record<string, unknown>,
  TableItem extends object,
  PartitionKeyField extends string, // used to validate the LSI key
  SortKeyField extends string, // used to pick from TypesUnion when the LSI projection type is keys-only or attributes
  TableIndex extends IndexFromValue, // this is to determine the type of item to give to ProjectProjectionExpression
  PE extends string | undefined
> = (Omit<DocumentClient.QueryOutput, 'Items'> & {
  Items?: (
    undefined extends PE
    ? (
      IsNever<TableIndex> extends true
      ? ProjectNonIndexQuery<
        never,
        {},
        {},
        PartitionKeyField,
        SortKeyField,
        TableItem,
        string,
        Key extends Record<string, DynamoDBKeyValue> ? Key : never
      >[]
      : ProjectQuery<
        never,
        {},
        {},
        TableIndex,
        TableItem,
        PartitionKeyField,
        SortKeyField,
        string,
        Key extends Record<string, DynamoDBKeyValue> ? Key : never
      >[]
    )
    : string extends PE
    ? DeepPartial<(
      IsNever<TableIndex> extends true
      ? ProjectNonIndexQuery<
        never,
        {},
        {},
        PartitionKeyField,
        SortKeyField,
        TableItem,
        string,
        Key extends Record<string, DynamoDBKeyValue> ? Key : never
      >[]
      : ProjectQuery<
        never,
        {},
        {},
        TableIndex,
        TableItem,
        PartitionKeyField,
        SortKeyField,
        string,
        Key extends Record<string, DynamoDBKeyValue> ? Key : never
      >[]
    )>
    : PE extends string
    ? (
      IsNever<TableIndex> extends true
      ? ProjectNonIndexQuery<
        never,
        {},
        {},
        PartitionKeyField,
        SortKeyField,
        TableItem,
        PE,
        Key extends Record<string, DynamoDBKeyValue> ? Key : never
      >[]
      : ProjectQuery<
        never,
        {},
        {},
        TableIndex,
        TableItem,
        PartitionKeyField,
        SortKeyField,
        PE,
        Key extends Record<string, DynamoDBKeyValue> ? Key : never
      >[]
    )
    : never
  ) extends infer Res extends any[] ? Res : never;
}) extends infer Res2 ? Res2 : never;