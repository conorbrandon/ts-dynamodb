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
  EAN extends Record<string, string>,
  EAV extends Record<string, any>,
  RV extends PutAndDeleteReturnValues,
  CEEAs extends { ean: string; eav: string } = ExtractEAsFromString<CE>,
  EANs extends Record<string, string> = Record<CEEAs['ean'], GetAllKeys<TypeOfItem>>,
  EAVs extends Record<string, any> = Record<CEEAs['eav'], unknown> // NOTE: this MUST be unknown for `const` inference to work (not `any`).
> = {
  TableName: TN;
  Key: Key;
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
  );

export type DeleteOutput<
  TypeOfItem extends object,
  RN extends PutAndDeleteReturnValues
> = (
  Omit<DocumentClient.DeleteItemOutput, 'Attributes'> & {
    Attributes?: PutAndDeleteOutputHelper<TypeOfItem, RN> extends infer Res ? Res : never;
  }
) extends infer Res2 ? Res2 : never;
