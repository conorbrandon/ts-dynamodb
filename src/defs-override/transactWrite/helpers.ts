import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ReturnValuesOnConditionCheckFailureValues } from "../../lib";

type GetReturnValuesListValue<TypeOfItem extends Record<string, any>, CE extends string | undefined, RV extends ReturnValuesOnConditionCheckFailureValues | undefined> =
  undefined extends CE
  ? "NO_ITEM"
  : undefined extends RV
  ? "NO_ITEM"
  : "NONE" extends RV
  ? "NO_ITEM"
  : TypeOfItem;
export type GetReturnValuesListValueFromInputs<InputsTransformed extends readonly [TypeOfItem: Record<string, any>, CE: string | undefined, RV: ReturnValuesOnConditionCheckFailureValues | undefined][]> = {
  [K in keyof InputsTransformed]: GetReturnValuesListValue<InputsTransformed[K][0], InputsTransformed[K][1], InputsTransformed[K][2]>;
}[number];

type TwiResponse<RCC extends "INDEXES" | "TOTAL" | "NONE", RICM extends "SIZE" | "NONE"> =
  & {}
  & (
    RCC extends 'NONE'
    ? unknown
    : Required<Pick<DocumentClient.TransactWriteItemsOutput, 'ConsumedCapacity'>>
  )
  & (
    RICM extends 'NONE'
    ? unknown
    : Required<Pick<DocumentClient.TransactWriteItemsOutput, 'ItemCollectionMetrics'>>
  );

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/Class/TransactionCanceledException/
type UnknownReason = {
  Code: string;
  Message?: string;
  Item?: never;
};
type ConditionalCheckFailedReason<Item extends Record<string, unknown>> = {
  Code: "ConditionalCheckFailed";
  Message?: string;
  Item: Item | undefined;
};
type ParsedCancellationReason<Item extends Record<string, unknown> | "NO_ITEM"> = (
  Item extends "NO_ITEM"
  ? UnknownReason
  : ConditionalCheckFailedReason<Exclude<Item, "NO_ITEM">>
) | undefined;
export type ParsedCancellationReasons<ReturnValuesList extends Record<string, unknown> | "NO_ITEM" = Record<string, unknown> | "NO_ITEM"> =
  | ParsedCancellationReason<ReturnValuesList>[]
  | undefined;
export type TwiOutput<RCC extends "INDEXES" | "TOTAL" | "NONE", RICM extends "SIZE" | "NONE", ReturnValuesList extends Record<string, unknown> | "NO_ITEM"> =
  | { success: true; response: TwiResponse<RCC, RICM> }
  | { success: false; CancellationReasons: ParsedCancellationReasons<ReturnValuesList> | undefined; error: unknown };
