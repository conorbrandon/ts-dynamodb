import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyGenericTable, ExtractTableItemForItem, ReturnValuesOnConditionCheckFailureValues, TableItem, TableName } from "../../lib";
import { ExtractEAsFromString } from "../../type-helpers/extract-EAs";
import { OnlyStrings } from "../../type-helpers/utils";
import { EANString, EAVString } from "../../dynamodb-types";
import { GetAllKeys } from "../../type-helpers/get-all-keys";
import { DeepValidateShapev2WithBinaryResult } from "../../type-helpers/deep-validate";

declare const ERROR: unique symbol;
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
  _TypeOfItem extends Record<string, any> = ExtractTableItemForItem<_TableItem, Item>,
  EAs extends { ean: string; eav: string } = ExtractEAsFromString<OnlyStrings<CE>>
> = {
  TableName: TN;
  Item: _TableItem;
  ConditionExpression?: CE;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: Record<EAs['ean'], GetAllKeys<_TypeOfItem>>;
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
  ) & (
    DeepValidateShapev2WithBinaryResult<Item, _TypeOfItem> extends 1
    ? unknown
    : {
      Item: {
        [ERROR]: `Error: the type of the Item provided to \`put\` does not match a known table item type. Please verify you are not providing any extra keys or incorrect types of values.`;
      };
    }
  );
