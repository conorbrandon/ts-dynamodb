import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, EANString } from "../dynamodb-types";
import { ProjectProjectionExpression } from "../type-helpers/PE/pe-lib";
import { NotEmptyWithMessage } from "../type-helpers/record";
import { TSDdbSet } from "../type-helpers/sets/utils";
import { FilterUnusedEANOrVs, UseAllExpressionAttributeNamesInString } from "../type-helpers/string";
import { OnlyStrings } from "../type-helpers/utils";

export type GetInput<
  TN extends string,
  Key extends object,
  PE extends string,
  EANs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>
> = Omit<DocumentClient.GetItemInput, 'TableName' | 'Key' | 'ProjectionExpression' | 'ExpressionAttributeNames'> & {
  TableName: TN;
  Key: Key;
  ProjectionExpression?: PE extends UseAllExpressionAttributeNamesInString<EAN, true> ? PE : `Error ❌ unused EANs: ${FilterUnusedEANOrVs<PE, OnlyStrings<keyof EAN>>}`;
} & (
    PE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    }
    : {
      ExpressionAttributeNames?: undefined;
    }
  );
// NOTE: to get the behavior I want with the generics around FilterUnusedEANsOrVs and conditionally including ExpressionAttributes, Omit on GetInput DOES NOT WORK. 
// This means if the logic changes in either of these types, it should be reflected in the other.
export type StrictGetItemInput<
  Key extends object,
  PE extends string,
  EANs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>
> = Omit<DocumentClient.GetItemInput, 'TableName' | 'Key' | 'ProjectionExpression' | 'ExpressionAttributeNames'> & {
  Key: Key;
  ProjectionExpression?: PE extends UseAllExpressionAttributeNamesInString<EAN, true> ? PE : `Error ❌ unused EANs: ${FilterUnusedEANOrVs<PE, OnlyStrings<keyof EAN>>}`;
} & (
    PE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    }
    : {
      ExpressionAttributeNames?: undefined;
    }
  );

export type GetOutput<
  PE extends string,
  TypeOfItem extends object,
  EAN extends AnyExpressionAttributeNames
> = (Omit<DocumentClient.GetItemOutput, 'Item'> & {
  Item?: (string extends PE
    ? TSDdbSet<TypeOfItem>
    : ProjectProjectionExpression<TypeOfItem, PE, EAN>) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;