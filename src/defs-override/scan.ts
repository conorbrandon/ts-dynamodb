import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames } from "../dynamodb-types";
import { IndexFromValue } from "../lib";
import { DeepPartial, NotEmptyWithMessage } from "../type-helpers/record";
import { ProjectNonIndexScan, ProjectScan } from "../type-helpers/scan/common";
import { FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../type-helpers/string";
import { IsNever, OnlyStrings } from "../type-helpers/utils";
import { _LogParams } from "./defs-helpers";

export type ScanInput<
  TN extends string,
  IndexName extends string,
  FE extends string,
  PE extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAV extends Record<EAVs, any>,
> = Omit<DocumentClient.ScanInput, 'TableName' | 'IndexName' | 'ProjectionExpression' | 'FilterExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'> & {
  TableName: TN;
  IndexName?: IndexName;
  FilterExpression?: `${FE}${PE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? FE : `Error ❌ unused EAs in FE and/or PE: ${FilterUnusedEANOrVs<`${FE}${PE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  ProjectionExpression?: `${FE}${PE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? PE : `Error ❌ unused EAs in FE and/or PE: ${FilterUnusedEANOrVs<`${FE}${PE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
};
export type ScanPEInput<
  TN extends string,
  IndexName extends string,
  FE extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, string>, // we can't do GAK here because that required the type of the item, which is the whole point of what we're trying to find with query
  EAV extends Record<EAVs, any>,
> = Omit<DocumentClient.ScanInput, 'TableName' | 'IndexName' | 'ProjectionExpression' | 'FilterExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'> & {
  TableName: TN;
  IndexName?: IndexName;
  FilterExpression?: `${FE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? FE : `Error ❌ unused EAs in FE and/or PE: ${FilterUnusedEANOrVs<`${FE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `scanPE` creates the parameters for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
};

export type ScanOutput<
  TableItem extends object,
  PartitionKeyField extends string,
  SortKeyField extends string,
  EAN extends AnyExpressionAttributeNames,
  TableIndex extends IndexFromValue,
  PE extends string
> = (Omit<DocumentClient.ScanOutput, 'Items'> & {
  Items?: (IsNever<TableIndex> extends true
    ? ProjectNonIndexScan<
      TableItem,
      EAN,
      PE
    >[]
    : ProjectScan<
      TableItem,
      TableIndex,
      PartitionKeyField,
      SortKeyField,
      EAN,
      PE
    >[]) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;
export type ScanPEOutput<
  TableItem extends object,
  PartitionKeyField extends string,
  SortKeyField extends string,
  EAN extends AnyExpressionAttributeNames,
  TableIndex extends IndexFromValue,
  PE extends string | undefined
> = (Omit<DocumentClient.ScanOutput, 'Items'> & {
  Items?: (
    undefined extends PE
    ? (
      IsNever<TableIndex> extends true
      ? ProjectNonIndexScan<
        TableItem,
        EAN,
        string
      >[]
      : ProjectScan<
        TableItem,
        TableIndex,
        PartitionKeyField,
        SortKeyField,
        EAN,
        string
      >[]
    )
    : string extends PE
    ? (
      DeepPartial<
        IsNever<TableIndex> extends true
        ? ProjectNonIndexScan<
          TableItem,
          EAN,
          string
        >[]
        : ProjectScan<
          TableItem,
          TableIndex,
          PartitionKeyField,
          SortKeyField,
          EAN,
          string
        >[]
      >
    )
    : PE extends string
    ? (
      IsNever<TableIndex> extends true
      ? ProjectNonIndexScan<
        TableItem,
        EAN,
        PE
      >[]
      : ProjectScan<
        TableItem,
        TableIndex,
        PartitionKeyField,
        SortKeyField,
        EAN,
        PE
      >[]
    )
    : never
  ) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;