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
type ValidatePutVariadicTwiInput<
  TS extends AnyGenericTable,
  TN extends string,
  Item extends Record<string, any>,
  CE extends string | undefined = undefined,
  EAs extends { ean: string; eav: string } = ExtractEAsFromString<OnlyStrings<CE>>
> = {
  TableName: TN;
  Item: TableItem<TS, TN>;
  ConditionExpression?: CE;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: Record<EAs['ean'], GetAllKeys<ExtractTableItemForKey<TableItem<TS, TN>, Item>>>;
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
export type ValidatePutVariadicTwiInputs<TS extends AnyGenericTable, Inputs extends readonly PutVariadicTwiBase<TS>[]> =
  // This weird conditional logic is required to perserve Inputs "const-ness".
  [Inputs] extends [unknown]
  ? {
    readonly [K in keyof Inputs]: ValidatePutVariadicTwiInput<TS, Inputs[K]['TableName'], Inputs[K]['Item'], Inputs[K]['ConditionExpression']>;
  }
  : Inputs;
