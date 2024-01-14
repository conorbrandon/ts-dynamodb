import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { FilterUnusedEANOrVs, UseAllExpressionAttributeNamesInString } from "../type-helpers/string";
import { AnyExpressionAttributeNames, EANString } from "../dynamodb-types";
import { NotEmptyWithMessage, UnionToIntersection } from "../type-helpers/record";
import { OnlyStrings } from "../type-helpers/utils";
import { ExtractTableItemForKeys, TableItem } from "../lib";
import { ProjectProjectionExpressionStruct } from "../type-helpers/PE2/pe-lib";
import { TSDdbSet } from "../type-helpers/sets/utils";

export type BatchGetAllRequestRequests = readonly {
  TableName: string;
  Keys: readonly object[];
  ConsistentRead?: DocumentClient.ConsistentRead;
  ProjectionExpression?: string;
  ExpressionAttributeNames?: AnyExpressionAttributeNames;
}[];

export type CreateBatchGetAllRequestAddTableInput<
  Keys extends readonly object[],
  PE extends string,
  EANs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined
> = {
  Keys: Keys;
  ConsistentRead?: DocumentClient.ConsistentRead;
  ProjectionExpression?: PE extends UseAllExpressionAttributeNamesInString<EAN, true> ? PE : `Error ❌ unused EANs: ${FilterUnusedEANOrVs<PE, OnlyStrings<keyof EAN>>}`;
} & (
    PE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    }
    : {
      ExpressionAttributeNames?: DummyEAN;
    }
  );

export type BatchGetAllRequestOutput<TS, Requests extends BatchGetAllRequestRequests> =
  UnionToIntersection<
    {
      [K in keyof Requests]:
      Requests[K] extends {
        TableName: infer TN extends string;
        Keys: infer Keys extends readonly object[];
        ProjectionExpression?: infer PE extends string;
        ExpressionAttributeNames?: infer EAN extends AnyExpressionAttributeNames;
      }
      ? ExtractTableItemForKeys<TableItem<TS, TN>, Keys> extends infer TypeOfItem extends Record<string, any>
      ? {
        [_ in TN]: (
          string extends PE
          ? TSDdbSet<TypeOfItem>
          : ProjectProjectionExpressionStruct<TypeOfItem, PE, EAN>
        )[];
      }
      : never
      : never
    }[number]
  >;
