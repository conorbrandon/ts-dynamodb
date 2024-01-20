import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyGenericTable, ExtractTableItemForKey, ReturnValuesOnConditionCheckFailureValues, TableItem, TableKey, TableName } from "../../lib";
import { ExtractEAsFromString } from "../../type-helpers/extract-EAs";
import { OnlyStrings } from "../../type-helpers/utils";
import { GetAllKeys } from "../../type-helpers/get-all-keys";
import { EANString, EAVString } from "../../dynamodb-types";

export type DeleteVariadicTwiBase<TS extends AnyGenericTable> = Omit<DocumentClient.Delete, 'TableName' | 'ReturnValuesOnConditionCheckFailure'> & {
  TableName: TableName<TS>;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
};
export type ValidateDeleteVariadicTwiInput<
  TS extends AnyGenericTable,
  TN extends string,
  Key extends Record<string, any>,
  CE extends string | undefined,
  EAs extends { ean: string; eav: string } = ExtractEAsFromString<OnlyStrings<CE>>
> = {
  TableName: TN;
  Key: TableKey<TS, TN>;
  ConditionExpression?: CE;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: Record<EAs['ean'], GetAllKeys<ExtractTableItemForKey<TableItem<TS, TN>, Key>>>;
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
