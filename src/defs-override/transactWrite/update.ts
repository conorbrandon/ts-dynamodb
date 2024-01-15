import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyGenericTable, ExtractTableItemForKey, ReturnValuesOnConditionCheckFailureValues, TableItem, TableKey, TableName } from "../../lib";
import { ExtractEAsFromString } from "../../type-helpers/extract-EAs";
import { OnlyStrings } from "../../type-helpers/utils";
import { NotEmptyWithMessage } from "../../type-helpers/record";
import { GetAllKeys } from "../../type-helpers/get-all-keys";
import { FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../../type-helpers/string";
import { IsUEValid, UEIsValid } from "../../type-helpers/UE/ue-lib";
import { AnyExpressionAttributeNames, ExpressionAttributeValues } from "../../dynamodb-types";

export type UpdateVariadicTwiBase<TS extends AnyGenericTable> = Omit<DocumentClient.Update, 'TableName' | 'ReturnValuesOnConditionCheckFailure' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'> & {
  TableName: TableName<TS>;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
  ExpressionAttributeNames?: AnyExpressionAttributeNames;
  ExpressionAttributeValues?: ExpressionAttributeValues;
};
type ValidateUpdateVariadicTwiInput<
  TS extends AnyGenericTable,
  TN extends string,
  Key extends Record<string, any>,
  UE extends string,
  CE extends string | undefined = undefined,
  EAN extends AnyExpressionAttributeNames | undefined = undefined,
  EAV extends ExpressionAttributeValues | undefined = undefined,
  TypeOfItem extends Record<string, any> = ExtractTableItemForKey<TableItem<TS, TN>, Key>,
  UEEAs extends { ean: string; eav: string } = ExtractEAsFromString<UE>,
  CEEAs extends { ean: string; eav: string } = ExtractEAsFromString<OnlyStrings<CE>>,
> =
  [undefined extends EAN ? {} : EAN, undefined extends EAV ? {} : EAV] extends [infer definedEAN extends AnyExpressionAttributeNames, infer definedEAV extends ExpressionAttributeValues]
  ? {
    TableName: TN;
    Key: TableKey<TS, TN>;
    ConditionExpression?: CE;
    UpdateExpression:
    `${UE}${CE}` extends UseAllExpressionAttributesInString<definedEAN, definedEAV>
    ? (
      IsUEValid<UE, TypeOfItem, definedEAN, definedEAV> extends infer ueValid ? (
        ueValid extends UEIsValid ? UE : ueValid & string // ueValid is either a string indicating the UE is valid, or a string describing the clause causing the error
      ) : never
    ) : `Error ❌ unused EAs in UE and/or CE: ${FilterUnusedEANOrVs<`${UE}${CE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
    ExpressionAttributeNames?: NotEmptyWithMessage<Record<UEEAs['ean'] | CEEAs['ean'], GetAllKeys<TypeOfItem>>, "ExpressionAttributeNames cannot be empty">;
    ExpressionAttributeValues?: NotEmptyWithMessage<Record<UEEAs['eav'] | CEEAs['eav'], any>, "ExpressionAttributeValues cannot be empty">;
    ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
  }
  : never;
export type ValidateUpdateVariadicTwiInputs<TS extends AnyGenericTable, Inputs extends readonly UpdateVariadicTwiBase<TS>[]> =
  // This weird conditional logic is required to perserve Inputs "const-ness".
  [Inputs] extends [unknown]
  ? {
    readonly [K in keyof Inputs]: ValidateUpdateVariadicTwiInput<TS, Inputs[K]['TableName'], Inputs[K]['Key'], Inputs[K]['UpdateExpression'], Inputs[K]['ConditionExpression'], Inputs[K]['ExpressionAttributeNames'], Inputs[K]['ExpressionAttributeValues']>;
  }
  : Inputs;
