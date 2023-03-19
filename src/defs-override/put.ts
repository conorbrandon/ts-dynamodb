import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { EANString, EAVString } from "../dynamodb-types";
import { PutAndDeleteOutputHelper, PutAndDeleteReturnValues } from "../lib";
import { DeepValidateShapev2 } from "../type-helpers/deep-validate";
import { NotEmptyWithMessage } from "../type-helpers/record";
import { FilterUnusedEANOrVs as FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../type-helpers/string";
import { OnlyStrings } from "../type-helpers/utils";

export type PutInput<
  TN extends string,
  Item extends object,
  TypeOfItem extends object,
  CE extends string,
  GAK extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RN extends PutAndDeleteReturnValues
> = Omit<DocumentClient.PutItemInput, 'TableName' | 'Item' | 'ConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ReturnValues'> & {
  TableName: TN;
  Item: Item extends DeepValidateShapev2<Item, TypeOfItem> ? Item : { Error: `Error: the type of the Item provided to \`put\` does not match a known table item type. Please verify you are not providing any extra keys or incorrect types of values.` };
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
// NOTE: to get the behavior I want with the generics around FilterUnusedEANsOrVs and conditionally including ExpressionAttributes, Omit on PutInput DOES NOT WORK. 
// This means if the logic changes in either of these types, it should be reflected in the other.
export type StrictPutItemInput<
  Item extends object,
  TypeOfItem extends object,
  CE extends string,
  GAK extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RN extends PutAndDeleteReturnValues
> = Omit<DocumentClient.PutItemInput, 'TableName' | 'Item' | 'ConditionExpression' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ReturnValues'> & {
  Item: Item extends DeepValidateShapev2<Item, TypeOfItem> ? Item : { Error: `Error: the type of the Item provided to \`put\` does not match a known table item type. Please verify you are not providing any extra keys or incorrect types of values.` };
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

export type PutOutput<
  TypeOfItem extends object,
  RN extends PutAndDeleteReturnValues
> = (Omit<DocumentClient.PutItemOutput, 'Attributes'> & {
  Attributes?: PutAndDeleteOutputHelper<
    TypeOfItem, RN
  > extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;