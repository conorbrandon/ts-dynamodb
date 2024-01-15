import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ReturnValuesOnConditionCheckFailureValues } from "../../lib";

type GetReturnValuesValue<TypeOfItem extends Record<string, any>, CE extends string | undefined, RV extends ReturnValuesOnConditionCheckFailureValues | undefined> =
  undefined extends CE
  ? never
  : undefined extends RV
  ? never
  : "NONE" extends RV
  ? never
  : TypeOfItem;
export type GetReturnValuesValueFromInputs<InputsTransformed extends readonly [TypeOfItem: Record<string, any>, CE: string | undefined, RV: ReturnValuesOnConditionCheckFailureValues | undefined][]> = {
  [K in keyof InputsTransformed]: GetReturnValuesValue<InputsTransformed[K][0], InputsTransformed[K][1], InputsTransformed[K][2]>;
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
  | { success: true; response: TwiResponse<RCC, RICM> }
  | { success: false; CancellationReasons: ParsedCancellationReasons<ReturnValues> | undefined; error: unknown };
