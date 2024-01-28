import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { EANString, EAVString } from "../dynamodb-types";
import { PutAndDeleteReturnValues } from "../lib";
import { DeepValidateShapev2WithBinaryResult } from "../type-helpers/deep-validate";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";
import { TSDdbSet } from "../type-helpers/sets/utils";

declare const ERROR: unique symbol;
export type PutInput<
  TN extends string,
  Item extends Record<string, any>,
  TypeOfItem extends Record<string, any>,
  CE extends string,
  RV extends PutAndDeleteReturnValues,
  CEEAs extends { ean: string; eav: string } = ExtractEAsFromString<CE>
> = Omit<DocumentClient.PutItemInput, 'TableName' | 'Item' | 'ConditionExpression' | 'ReturnValues' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ConditionalOperator' | 'Expected'> & {
  TableName: TN;
  Item: Item;
  ConditionExpression?: CE;
  ReturnValues?: RV;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: Record<CEEAs['ean'], GetAllKeys<TypeOfItem>>;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: Record<CEEAs['eav'], any>;
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


export type PutAndDeleteOutputHelper<TypeOfItem extends Record<any, any>, RN extends PutAndDeleteReturnValues | undefined> =
  RN extends undefined ? undefined
  : RN extends 'NONE' ? undefined
  : RN extends 'ALL_OLD' ? TSDdbSet<TypeOfItem> | undefined
  : never;
export type PutOutput<
  TypeOfItem extends object,
  RN extends PutAndDeleteReturnValues
> = (
  Omit<DocumentClient.PutItemOutput, 'Attributes'> & {
    Attributes?: PutAndDeleteOutputHelper<TypeOfItem, RN> extends infer Res ? Res : never;
  }
) extends infer Res2 ? Res2 : never;
