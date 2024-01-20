import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyGenericTable, ExtractTableItemForKey, ReturnValuesOnConditionCheckFailureValues, TableItem, TableName } from "../../lib";
import { ExtractEAsFromString } from "../../type-helpers/extract-EAs";
import { OnlyStrings } from "../../type-helpers/utils";
import { EANString, EAVString } from "../../dynamodb-types";
import { GetAllKeys } from "../../type-helpers/get-all-keys";

export type PutVariadicTwiBase<TS extends AnyGenericTable> = Omit<DocumentClient.Put, 'TableName' | 'ReturnValuesOnConditionCheckFailure'> & {
  TableName: TableName<TS>;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
};
export type ValidatePutVariadicTwiInput<
  TS extends AnyGenericTable,
  TN extends string,
  Item extends Record<string, any>,
  CE extends string | undefined,
  _TableItem extends Record<string, any> = TableItem<TS, TN>,
  EAs extends { ean: string; eav: string } = ExtractEAsFromString<OnlyStrings<CE>>
> = {
  TableName: TN;
  Item: _TableItem;
  ConditionExpression?: CE;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: Record<EAs['ean'], GetAllKeys<ExtractTableItemForKey<_TableItem, Item>>>;
    }
    : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: Record<EAs['eav'], any>;
    }
    : {
      ExpressionAttributeValues?: never;
    }
  );
