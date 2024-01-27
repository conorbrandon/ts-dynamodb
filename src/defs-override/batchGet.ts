import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, EANString } from "../dynamodb-types";
import { UnionToIntersection } from "../type-helpers/record";
import { AnyGenericTable, ExtractTableItemForKeys, TableItem, TableKey } from "../lib";
import { ProjectProjectionExpressionStruct } from "../type-helpers/PE2/pe-lib";
import { TSDdbSet } from "../type-helpers/sets/utils";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";

export type BatchGetAllRequestRequests = readonly {
  TableName: string;
  Keys: readonly object[];
  ConsistentRead?: DocumentClient.ConsistentRead;
  ProjectionExpression?: string;
  ExpressionAttributeNames?: AnyExpressionAttributeNames;
}[];

export type CreateBatchGetAllRequestAddTableInputBase<TS extends AnyGenericTable, TN extends string> = {
  Keys: readonly TableKey<TS, TN>[];
  ConsistentRead?: DocumentClient.ConsistentRead;
  ProjectionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
};
type CreateBatchGetAllRequestAddTableInput<
  TS extends AnyGenericTable,
  TN extends string,
  Keys extends readonly Record<string, any>[],
  PE extends string | undefined
> = {
  Keys: Keys;
  ConsistentRead?: DocumentClient.ConsistentRead;
  ProjectionExpression?: PE;
} & (
    PE extends EANString
    ? {
      ExpressionAttributeNames: Record<ExtractEAsFromString<PE>['ean'], GetAllKeys<ExtractTableItemForKeys<TableItem<TS, TN>, Keys>>>;
    }
    : {
      ExpressionAttributeNames?: never;
    }
  );
export type ValidateCreateBatchGetAllRequestAddTableInput<
  TS extends AnyGenericTable,
  TN extends string,
  Params extends CreateBatchGetAllRequestAddTableInputBase<TS, TN>
> = [Params] extends [unknown]
  ? CreateBatchGetAllRequestAddTableInput<TS, TN, Params['Keys'], Params['ProjectionExpression']>
  : Params;

export type BatchGetAllRequestOutput<TS, Requests extends BatchGetAllRequestRequests, RCC extends "INDEXES" | "TOTAL" | "NONE"> = {
  Responses: UnionToIntersection<
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
} & (
    RCC extends 'NONE'
    ? unknown
    : {
      ConsumedCapacity: DocumentClient.ConsumedCapacityMultiple;
    }
  );
