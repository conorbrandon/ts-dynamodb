import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { EANString, EAVString } from "../dynamodb-types";
import { PutAndDeleteOutputHelper, PutAndDeleteReturnValues } from "../lib";
import { NotEmptyWithMessage } from "../type-helpers/record";
import { UseAllExpressionAttributesInString, FilterUnusedEANOrVs } from "../type-helpers/string";
import { OnlyStrings } from "../type-helpers/utils";

export type DeleteInput<
  TN extends string,
  Key extends object,
  CE extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RN extends PutAndDeleteReturnValues
> = Omit<DocumentClient.DeleteItemInput, 'TableName' | 'Key' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ConditionExpression' | 'ReturnValues'> & {
  TableName: TN;
  Key: Key;
  ConditionExpression?: CE extends UseAllExpressionAttributesInString<EAN, EAV> ? CE : `Error ❌ unused EANs or EAVs: ${FilterUnusedEANOrVs<CE, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ReturnValues?: RN;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    } : {
      ExpressionAttributeNames?: DummyEAN;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
    } : {
      ExpressionAttributeValues?: DummyEAV;
    }
  );
// NOTE: to get the behavior I want with the generics around FilterUnusedEANsOrVs and conditionally including ExpressionAttributes, Omit on DeleteInput DOES NOT WORK. 
// This means if the logic changes in either of these types, it should be reflected in the other.
export type StrictDeleteItemInput<
  Key extends object,
  CE extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RN extends PutAndDeleteReturnValues
> = Omit<DocumentClient.DeleteItemInput, 'TableName' | 'Key' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ConditionExpression' | 'ReturnValues'> & {
  Key: Key;
  ConditionExpression?: CE extends UseAllExpressionAttributesInString<EAN, EAV> ? CE : `Error ❌ unused EANs or EAVs: ${FilterUnusedEANOrVs<CE, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ReturnValues?: RN;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    } : {
      ExpressionAttributeNames?: DummyEAN;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
    } : {
      ExpressionAttributeValues?: DummyEAV;
    }
  );

export type DeleteOutput<
  TypeOfItem extends object,
  RN extends PutAndDeleteReturnValues
> = (Omit<DocumentClient.DeleteItemOutput, 'Attributes'> & {
  Attributes?: PutAndDeleteOutputHelper<
    TypeOfItem, RN
  > extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;