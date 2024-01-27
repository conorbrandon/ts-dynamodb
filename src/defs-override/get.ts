import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, EANString } from "../dynamodb-types";
import { ProjectProjectionExpressionStruct } from "../type-helpers/PE2/pe-lib";
import { DeepPartial } from "../type-helpers/record";
import { TSDdbSet } from "../type-helpers/sets/utils";
import { _LogParams } from "./defs-helpers";
import { AnyGenericTable, ExtractTableItemForKey, TableItem, TableKey, TableName } from "../lib";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";

export type GetInputBase<TS extends AnyGenericTable> = {
  TableName: TableName<TS>;
  Key: Record<string, any>;
  ConsistentRead?: boolean;
  ReturnConsumedCapacity?: "INDEXES" | "TOTAL" | "NONE";
  ProjectionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
};

type GetInput<
  TS extends AnyGenericTable,
  TN extends string,
  Key extends Record<string, any>,
  PE extends string | undefined
> = {
  TableName: TN;
  Key: TableKey<TS, TN>;
  ProjectionExpression?: PE;
} & (
    PE extends EANString
    ? {
      ExpressionAttributeNames: Record<ExtractEAsFromString<PE>['ean'], GetAllKeys<ExtractTableItemForKey<TableItem<TS, TN>, Key>>>;
    }
    : {
      ExpressionAttributeNames?: never;
    }
  );
export type ValidateGetInput<TS extends AnyGenericTable, Params extends GetInputBase<TS>> =
  [Params] extends [unknown]
  ? GetInput<TS, Params['TableName'], Params['Key'], Params['ProjectionExpression']>
  : Params;

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

export type GetOutput<TS extends AnyGenericTable, Params extends GetInputBase<TS>, TypeOfItem extends Record<string, any> = ExtractTableItemForKey<TableItem<TS, Params['TableName']>, Params['Key']>> = (
  Omit<DocumentClient.GetItemOutput, 'Item'> & {
    Item?: (
      unknown extends Params['ProjectionExpression']
      ? TSDdbSet<TypeOfItem>
      : ProjectProjectionExpressionStruct<TypeOfItem, Extract<Params['ProjectionExpression'], string>, Extract<Params['ExpressionAttributeNames'], Record<string, string>>>
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