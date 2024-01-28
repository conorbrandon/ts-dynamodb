import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { EANString, EAVString } from "../dynamodb-types";
import { PutAndDeleteReturnValues } from "../lib";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";
import { PutAndDeleteOutputHelper } from "./put";

export type DeleteInput<
  TN extends string,
  Key extends Record<string, any>,
  TypeOfItem extends Record<string, any>,
  CE extends string,
  RV extends PutAndDeleteReturnValues,
  CEEAs extends { ean: string; eav: string } = ExtractEAsFromString<CE>
> = Omit<DocumentClient.DeleteItemInput, 'TableName' | 'Key' | 'ConditionExpression' | 'ReturnValues' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'ConditionalOperator' | 'Expected'> & {
  TableName: TN;
  Key: Key;
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
  );

export type DeleteOutput<
  TypeOfItem extends object,
  RN extends PutAndDeleteReturnValues
> = (
  Omit<DocumentClient.DeleteItemOutput, 'Attributes'> & {
    Attributes?: PutAndDeleteOutputHelper<TypeOfItem, RN> extends infer Res ? Res : never;
  }
) extends infer Res2 ? Res2 : never;
