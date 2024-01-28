import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, EANString, EAVString } from "../dynamodb-types";
import { IndexFromValue } from "../lib";
import { DeepPartial } from "../type-helpers/record";
import { ProjectNonIndexScan, ProjectScan } from "../type-helpers/scan/common";
import { IsNever } from "../type-helpers/utils";
import { _LogParams } from "./defs-helpers";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";

export type ScanInput<
  TN extends string,
  TypeOfItem extends Record<string, any>,
  IndexName extends string,
  FE extends string,
  PE extends string,
  EAN extends Record<string, string>,
  FEEAs extends { ean: string; eav: string } = ExtractEAsFromString<FE>,
  PEEAs extends { ean: string; eav: string } = ExtractEAsFromString<PE>,
  EANs extends Record<string, string> = Record<FEEAs['ean'] | PEEAs['ean'], GetAllKeys<TypeOfItem>>
> = Omit<DocumentClient.ScanInput, 'TableName' | 'IndexName' | 'ProjectionExpression' | 'FilterExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'AttributesToGet' | 'ConditionalOperator' | 'ScanFilter' | 'Select'> & {
  TableName: TN;
  IndexName?: IndexName;
  FilterExpression?: FE;
  ProjectionExpression?: PE;
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
} & (
    `${FE}${PE}` extends EANString
    ? {
      ExpressionAttributeNames: EANs;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    `${FE}${PE}` extends EAVString
    ? {
      ExpressionAttributeValues: Record<FEEAs['eav'] | PEEAs['eav'], any>;
    } : {
      ExpressionAttributeValues?: never;
    }
  );

export type ScanPEInput<
  TN extends string,
  TypeOfItem extends Record<string, any>,
  IndexName extends string,
  FE extends string,
  EAN extends Record<string, string>,
  FEEAs extends { ean: string; eav: string } = ExtractEAsFromString<FE>,
  EANs extends Record<string, string> = Record<FEEAs['ean'], GetAllKeys<TypeOfItem>>
> = Omit<DocumentClient.ScanInput, 'TableName' | 'IndexName' | 'ProjectionExpression' | 'FilterExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'AttributesToGet' | 'ConditionalOperator' | 'ScanFilter' | 'Select'> & {
  TableName: TN;
  IndexName?: IndexName;
  FilterExpression?: FE;
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `scanPE` creates the parameters for you, you may wish to log exactly what was going into your DB.
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

export type ScanOutput<
  TableItem extends object,
  PartitionKeyField extends string,
  SortKeyField extends string,
  EAN extends AnyExpressionAttributeNames,
  TableIndex extends IndexFromValue,
  PE extends string
> = (
  Omit<DocumentClient.ScanOutput, 'Items'> & {
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
  }
) extends infer Res2 ? Res2 : never;
export type ScanPEOutput<
  TableItem extends object,
  PartitionKeyField extends string,
  SortKeyField extends string,
  EAN extends AnyExpressionAttributeNames,
  TableIndex extends IndexFromValue,
  PE extends string | undefined
> = (
  Omit<DocumentClient.ScanOutput, 'Items'> & {
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
  }
) extends infer Res2 ? Res2 : never;