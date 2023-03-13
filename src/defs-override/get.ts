import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, EANString } from "../dynamodb-types";
import { ProjectProjectionExpression } from "../type-helpers/PE/pe-lib";
import { DeepPartial, NotEmptyWithMessage } from "../type-helpers/record";
import { TSDdbSet } from "../type-helpers/sets/utils";
import { FilterUnusedEANOrVs, UseAllExpressionAttributeNamesInString } from "../type-helpers/string";
import { OnlyStrings } from "../type-helpers/utils";
import { _LogParams } from "./defs-helpers";

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

export type GetPEInput<
  TN extends string,
  Key extends object
> = Omit<DocumentClient.GetItemInput, 'TableName' | 'Key' | 'ProjectionExpression' | 'ExpressionAttributeNames'> & {
  TableName: TN;
  Key: Key;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `getPE` creates the parameters for you, you may wish to log exactly what was going into your DB.
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
};

export type GetOutput<
  PE extends string,
  TypeOfItem extends object,
  EAN extends AnyExpressionAttributeNames
> = (Omit<DocumentClient.GetItemOutput, 'Item'> & {
  Item?: (string extends PE
    ? TSDdbSet<TypeOfItem>
    : ProjectProjectionExpression<TypeOfItem, PE, EAN>) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;

export type GetPEOutput<
  PE extends string | undefined,
  TypeOfItem extends object,
  EAN extends AnyExpressionAttributeNames
> = (Omit<DocumentClient.GetItemOutput, 'Item'> & {
  Item?: (
    undefined extends PE
    ? TSDdbSet<TypeOfItem>
    : string extends PE
    ? DeepPartial<TSDdbSet<TypeOfItem>>
    : PE extends string
    ? ProjectProjectionExpression<TypeOfItem, PE, EAN>
    : never
  ) extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;