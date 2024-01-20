import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyGenericTable, ExtractTableItemForKey, ReturnValuesOnConditionCheckFailureValues, TableItem, TableKey, TableName } from "../../lib";
import { ExtractEAsFromString } from "../../type-helpers/extract-EAs";
import { IsUnknown, OnlyStrings } from "../../type-helpers/utils";
import { GetAllKeys } from "../../type-helpers/get-all-keys";
import { IsUEValid, UEIsValid } from "../../type-helpers/UE/ue-lib";
import { AnyExpressionAttributeNames, EANString, EAVString, ExpressionAttributeValues } from "../../dynamodb-types";

export type UpdateVariadicTwiBase<TS extends AnyGenericTable> = Omit<DocumentClient.Update, 'TableName' | 'ReturnValuesOnConditionCheckFailure' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues'> & {
  TableName: TableName<TS>;
  ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
  ExpressionAttributeNames?: AnyExpressionAttributeNames;
  ExpressionAttributeValues?: ExpressionAttributeValues;
};
/** 
 * TS is greedily evaluating the UpdateExpression for errors. 
 * If it is erroring because of missing EAs, the error that EAs are missing will be superseded
 * by the error that the UpdateExpression is invalid. This will help to surface the missing EAs
 * error instead of the UpdateExpression error.
 */
type MissingEANOrEAVFalseReportsFalseError<UEDefinedCE extends string, EAN, EAV> =
  | (
    UEDefinedCE extends EANString
    ? IsUnknown<EAN> extends true
    ? 1
    : 0
    : 0
  )
  | (
    UEDefinedCE extends EAVString
    ? IsUnknown<EAV> extends true
    ? 1
    : 0
    : 0
  );
export type ValidateUpdateVariadicTwiInput<
  TS extends AnyGenericTable,
  TN extends string,
  Key extends Record<string, any>,
  UE extends string,
  CE extends string | undefined,
  EAN extends AnyExpressionAttributeNames | undefined,
  EAV extends ExpressionAttributeValues | undefined,
  TypeOfItem extends Record<string, any> = ExtractTableItemForKey<TableItem<TS, TN>, Key>,
  UEEAs extends { ean: string; eav: string } = ExtractEAsFromString<UE>,
  CEEAs extends { ean: string; eav: string } = ExtractEAsFromString<OnlyStrings<CE>>,
> =
  [
    IsUnknown<EAN> extends true ? {} : EAN,
    IsUnknown<EAV> extends true ? {} : EAV,
    IsUnknown<CE> extends true ? "" : CE // important: CE is actually unknown if not set, and this swallows any UE causing the false branch to be hit
  ] extends [
    infer definedEAN extends AnyExpressionAttributeNames,
    infer definedEAV extends ExpressionAttributeValues,
    infer definedCE extends string
  ]
  ? {
    TableName: TN;
    Key: TableKey<TS, TN>;
    ConditionExpression?: CE;
    UpdateExpression:
    1 extends MissingEANOrEAVFalseReportsFalseError<`${UE}${definedCE}`, EAN, EAV>
    ? UE
    : (
      IsUEValid<UE, TypeOfItem, definedEAN, definedEAV> extends infer ueValid
      ? ueValid extends UEIsValid ? UE : ueValid & string // ueValid is either a string indicating the UE is valid, or a string describing the clause causing the error 
      : never
    );
    ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailureValues;
  } & (
    `${UE}${definedCE}` extends EANString
    ? {
      ExpressionAttributeNames: Record<UEEAs['ean'] | CEEAs['ean'], GetAllKeys<TypeOfItem>>;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    `${UE}${definedCE}` extends EAVString
    ? {
      ExpressionAttributeValues: Record<UEEAs['eav'] | CEEAs['eav'], any>;
    } : {
      ExpressionAttributeValues?: never;
    }
  )
  : never;
