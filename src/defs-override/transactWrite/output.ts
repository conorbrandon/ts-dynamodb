import { DocumentClient } from "aws-sdk/clients/dynamodb";

type TwiResponse<RCC extends "INDEXES" | "TOTAL" | "NONE", RICM extends "SIZE" | "NONE"> =
  & {}
  & (
    RCC extends 'NONE'
    ? unknown
    : Pick<DocumentClient.TransactWriteItemsOutput, 'ConsumedCapacity'>
  )
  & (
    RICM extends 'NONE'
    ? unknown
    : Pick<DocumentClient.TransactWriteItemsOutput, 'ItemCollectionMetrics'>
  );

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/Class/TransactionCanceledException/
type UnknownReason = {
  Code: string & {};
  Message?: string;
  Item?: never;
};
type ConditionalCheckFailedReason<Item extends Record<string, unknown>> = {
  Code: "ConditionalCheckFailed";
  Message?: string;
  Item?: Item;
};
type ParsedCancellationReason<Item extends Record<string, unknown>> = ConditionalCheckFailedReason<Item> | UnknownReason;
export type ParsedCancellationReasons<ReturnValues extends Record<string, unknown> = Record<string, unknown>> = (
  ReturnValues extends ReturnValues
  ? ParsedCancellationReason<ReturnValues>
  : never
)[] | undefined;
export type TwiOutput<RCC extends "INDEXES" | "TOTAL" | "NONE", RICM extends "SIZE" | "NONE", ReturnValues extends Record<string, unknown>> =
  | { success: true } & TwiResponse<RCC, RICM>
  | { success: false; CancellationReasons: ParsedCancellationReasons<ReturnValues> | undefined; error: unknown };
