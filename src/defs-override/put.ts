import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { EANString, EAVString } from "../dynamodb-types";
import { PutAndDeleteOutputHelper, PutAndDeleteReturnValues } from "../lib";
import { DeepValidateShapev2WithBinaryResult } from "../type-helpers/deep-validate";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";

declare const ERROR: unique symbol;
export type PutInput<
  TN extends string,
  Item extends Record<string, any>,
  TypeOfItem extends Record<string, any>,
  CE extends string,
  EAN extends Record<string, string>,
  EAV extends Record<string, any>,
  RV extends PutAndDeleteReturnValues,
  CEEAs extends { ean: string; eav: string } = ExtractEAsFromString<CE>,
  EANs extends Record<string, string> = Record<CEEAs['ean'], GetAllKeys<TypeOfItem>>,
  EAVs extends Record<string, any> = Record<CEEAs['eav'], unknown> // NOTE: this MUST be unknown for `const` inference to work (not `any`).
> = {
  TableName: TN;
  Item: Item;
  ConditionExpression?: CE;
  ReturnValues?: RV;
  ReturnConsumedCapacity?: "INDEXES" | "TOTAL" | "NONE";
  ReturnItemCollectionMetrics?: "SIZE" | "NONE";
  ReturnValuesOnConditionCheckFailure?: "ALL_OLD" | "NONE";
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  ExpressionAttributeValues?: EAVs extends EAV ? EAV : EAVs;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: EANs;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: EAVs;
    } : {
      ExpressionAttributeValues?: never;
    }
  ) & (
    DeepValidateShapev2WithBinaryResult<Item, TypeOfItem> extends 1
    ? unknown
    : {
      Item: {
        [ERROR]: `Error: the type of the Item provided to \`put\` does not match a known table item type. Please verify you are not providing any extra keys or incorrect types of values.`;
      };
    }
  );

export type PutOutput<
  TypeOfItem extends object,
  RN extends PutAndDeleteReturnValues
> = (
  Omit<DocumentClient.PutItemOutput, 'Attributes'> & {
    Attributes?: PutAndDeleteOutputHelper<TypeOfItem, RN> extends infer Res ? Res : never;
  }
) extends infer Res2 ? Res2 : never;