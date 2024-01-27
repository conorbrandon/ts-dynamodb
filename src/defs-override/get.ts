import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, EANString } from "../dynamodb-types";
import { ProjectProjectionExpressionStruct } from "../type-helpers/PE2/pe-lib";
import { DeepPartial } from "../type-helpers/record";
import { TSDdbSet } from "../type-helpers/sets/utils";
import { _LogParams } from "./defs-helpers";
import { AnyGenericTable, ExtractTableItemForKey, TableItem } from "../lib";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";

export type GetInputBase<TN extends string> = {
  TableName: TN;
  Key: Record<string, any>;
  ConsistentRead?: boolean;
  ReturnConsumedCapacity?: "INDEXES" | "TOTAL" | "NONE";
  ProjectionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
};

export type GetInput<
  TS extends AnyGenericTable,
  TN extends string,
  Key extends Record<string, any>,
  PE extends string,
  EAN extends Record<string, string>
> = {
  TableName: TN;
  Key: Key;
  ProjectionExpression?: PE;
  ExpressionAttributeNames?: EAN;
} & (
    PE extends EANString
    ? {
      ExpressionAttributeNames: Record<ExtractEAsFromString<PE>['ean'], GetAllKeys<ExtractTableItemForKey<TableItem<TS, TN>, Key>>>;
    }
    : {
      ExpressionAttributeNames?: never;
    }
  );

export type GetPEInput<
  TN extends string,
  Key extends object
> = Omit<DocumentClient.GetItemInput, 'TableName' | 'Key' | 'ProjectionExpression' | 'ExpressionAttributeNames'> & {
  TableName: TN;
  Key: Key;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `getPE` creates the parameters for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
};

export type GetOutput<
  PE extends string,
  EAN extends Record<string, string>,
  TypeOfItem extends Record<string, any>
> = (
  Omit<DocumentClient.GetItemOutput, 'Item'> & {
    Item?: (
      string extends PE
      ? TSDdbSet<TypeOfItem>
      : ProjectProjectionExpressionStruct<TypeOfItem, PE, EAN>
    ) extends infer Res ? Res : never;
  }
) extends infer Res2 ? Res2 : never;

export type GetPEOutput<
  PE extends string | undefined,
  TypeOfItem extends object,
  EAN extends AnyExpressionAttributeNames
> = (Omit<DocumentClient.GetItemOutput, 'Item'> & {
  Item?: (
    undefined extends PE
    ? TSDdbSet<TypeOfItem>
    : string extends PE
    ? DeepPartial<TSDdbSet<TypeOfItem>>
    : PE extends string
    ? ProjectProjectionExpressionStruct<TypeOfItem, PE, EAN>
    : never
  ) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;