import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DynamoDBKeyValue, EANString, EAVString } from "../dynamodb-types";
import { GSIIndexFromValue, IndexFromValue, LSIIndexFromValue } from "../lib";
import { ProjectNonIndexQuery, ProjectQuery } from "../type-helpers/query/common";
import { DeepPartial } from "../type-helpers/record";
import { IsNever } from "../type-helpers/utils";
import { _LogParams } from "./defs-helpers";
import { GetGSIIndexKeyTypes } from "../type-helpers/query/gsi-lib";
import { GetLSIIndexKeyTypes } from "../type-helpers/query/lsi-lib";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";

export type QueryInput<
  TN extends string,
  IndexName extends string,
  KCE extends string,
  PE extends string,
  FE extends string,
  EAN extends Record<string, string>,
  EAV extends Record<string, any>,
  KCEEAs extends { ean: string; eav: string } = ExtractEAsFromString<KCE>,
  FEEAs extends { ean: string; eav: string } = ExtractEAsFromString<FE>,
  PEEAs extends { ean: string; eav: string } = ExtractEAsFromString<PE>,
  EANs extends Record<string, string> = Record<KCEEAs['ean'] | FEEAs['ean'] | PEEAs['ean'], string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAVs extends Record<string, any> = Record<KCEEAs['eav'] | FEEAs['eav'] | PEEAs['eav'], unknown> // NOTE: this MUST be unknown for `const` inference to work (not `any`).
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression' | 'AttributesToGet' | 'ConditionalOperator' | 'KeyConditions' | 'QueryFilter'> & {
  TableName: TN;
  IndexName?: IndexName;
  KeyConditionExpression: KCE;
  ProjectionExpression?: PE;
  FilterExpression?: FE;
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  ExpressionAttributeValues?: EAVs extends EAV ? EAV : EAVs;
} & (
    `${KCE}${FE}${PE}` extends EANString
    ? {
      ExpressionAttributeNames: EANs;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    `${KCE}${FE}${PE}` extends EAVString
    ? {
      ExpressionAttributeValues: EAVs;
    } : {
      ExpressionAttributeValues?: never;
    }
  );

export type QueryPEInput<
  TN extends string,
  IndexName extends string,
  KCE extends string,
  FE extends string,
  EAN extends Record<string, string>,
  EAV extends Record<string, any>,
  KCEEAs extends { ean: string; eav: string } = ExtractEAsFromString<KCE>,
  FEEAs extends { ean: string; eav: string } = ExtractEAsFromString<FE>,
  EANs extends Record<string, string> = Record<KCEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAVs extends Record<string, any> = Record<KCEEAs['eav'] | FEEAs['eav'], unknown> // NOTE: this MUST be unknown for `const` inference to work (not `any`).
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression' | 'AttributesToGet' | 'ConditionalOperator' | 'KeyConditions' | 'QueryFilter'> & {
  TableName: TN;
  IndexName?: IndexName;
  KeyConditionExpression: KCE;
  FilterExpression?: FE;
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  ExpressionAttributeValues?: EAVs extends EAV ? EAV : EAVs;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `queryPE` creates the parameters for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
} & (
    `${KCE}${FE}` extends EANString
    ? {
      ExpressionAttributeNames: EANs;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    `${KCE}${FE}` extends EAVString
    ? {
      ExpressionAttributeValues: EAVs;
    } : {
      ExpressionAttributeValues?: never;
    }
  );

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
  EAN extends Record<string, string>,
  FEEAs extends { ean: string; eav: string } = ExtractEAsFromString<FE>,
  PEEAs extends { ean: string; eav: string } = ExtractEAsFromString<PE>,
  EANs extends Record<string, string> = Record<FEEAs['ean'] | PEEAs['ean'], string> // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression' | 'AttributesToGet' | 'ConditionalOperator' | 'KeyConditions' | 'QueryFilter'> & {
  TableName: TN;
  IndexName?: IndexName;
  Key: Key;
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  ProjectionExpression?: PE;
  FilterExpression?: FE;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `queryKey` creates the KeyConditionExpression for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
} & (
    `${PE}${FE}` extends EANString
    ? {
      ExpressionAttributeNames: EANs;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    `${PE}${FE}` extends EAVString
    ? {
      ExpressionAttributeValues: Record<FEEAs['eav'] | PEEAs['eav'], any>;
    } : {
      ExpressionAttributeValues?: never;
    }
  );

export type QueryKeyPEInput<
  TN extends string,
  Key extends Record<string, unknown>,
  IndexName extends string,
  FE extends string,
  EAN extends Record<string, string>,
  FEEAs extends { ean: string; eav: string } = ExtractEAsFromString<FE>,
  EANs extends Record<string, string> = Record<FEEAs['ean'], string> // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
> = Omit<DocumentClient.QueryInput, 'TableName' | 'IndexName' | 'KeyConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ProjectionExpression' | 'FilterExpression' | 'AttributesToGet' | 'ConditionalOperator' | 'KeyConditions' | 'QueryFilter'> & {
  TableName: TN;
  IndexName?: IndexName;
  Key: Key;
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  FilterExpression?: FE;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `queryKey` creates the KeyConditionExpression for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
} & (
    FE extends EANString
    ? {
      ExpressionAttributeNames: EANs;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    FE extends EAVString
    ? {
      ExpressionAttributeValues: Record<FEEAs['eav'], any>;
    } : {
      ExpressionAttributeValues?: never;
    }
  );

/** 
 * Note: we do not have to cover the case where KeyConditionExpression is omitted. 
 * They should really have a discriminated union for that, but either KeyConditions or KeyConditionExpression is required. 
 */
export type QueryOutput<
  TableItem extends object,
  PartitionKeyField extends string, // used to validate the LSI key
  SortKeyField extends string, // used to pick from TypesUnion when the LSI projection type is keys-only or attributes
  EAN extends Record<string, string>,
  EAV extends Record<string, unknown>,
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
  EAN extends Record<string, string>,
  EAV extends Record<string, unknown>,
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
  EAN extends Record<string, string>,
  EAV extends Record<string, unknown>,
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
  EAN extends Record<string, string>,
  EAV extends Record<string, unknown>,
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
  EAN extends Record<string, string>,
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