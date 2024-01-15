import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ReturnValuesOnConditionCheckFailureValues } from "../lib";
import { DeepValidateShapev2 } from "../type-helpers/deep-validate";
import { FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../type-helpers/string";
import { OnlyStrings } from "../type-helpers/utils";
import { EANString, EAVString } from "../dynamodb-types";
import { NotEmptyWithMessage } from "../type-helpers/record";
import { IsUEValid, UEIsValid } from "../type-helpers/UE/ue-lib";

export type PutTwiInput<
  TN extends string,
  Item extends object,
  TypeOfItem extends object,
  CE extends string,
  GAK extends string,
  EANs extends string,
  EAVs extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RV extends ReturnValuesOnConditionCheckFailureValues
> = {
  TableName: TN;
  Item: Item extends DeepValidateShapev2<Item, TypeOfItem> ? Item : { Error: `Error: the type of the Item provided to \`put\` does not match a known table item type. Please verify you are not providing any extra keys or incorrect types of values.` };
  ConditionExpression?: CE extends UseAllExpressionAttributesInString<EAN, EAV> ? CE : `Error ❌ unused EANs or EAVs: ${FilterUnusedEANOrVs<CE, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ReturnValuesOnConditionCheckFailure?: RV;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    } : {
      ExpressionAttributeNames?: DummyEAN;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
    } : {
      ExpressionAttributeValues?: DummyEAV;
    }
  );

export type UpdateTwiInput<
  TN extends string,
  Key extends object,
  TypeOfItem extends object,
  UE extends string,
  CE extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  EAV extends Record<EAVs, any>,
  RV extends ReturnValuesOnConditionCheckFailureValues
> = {
  TableName: TN;
  Key: Key;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  UpdateExpression:
  `${UE}${CE}` extends UseAllExpressionAttributesInString<EAN, EAV>
  ? (
    IsUEValid<UE, TypeOfItem, EAN, EAV> extends infer ueValid ? (
      ueValid extends UEIsValid ? UE : ueValid & string // ueValid is either a string indicating the UE is valid, or a string describing the clause causing the error
    ) : never
  ) : `Error ❌ unused EAs in UE and/or CE: ${FilterUnusedEANOrVs<`${UE}${CE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  // This needs the Error check on both, because CE or UE can both exist standalone.
  ConditionExpression?: `${UE}${CE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? CE : `Error ❌ unused EAs in UE and/or CE: ${FilterUnusedEANOrVs<`${UE}${CE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ReturnValuesOnConditionCheckFailure?: RV;
};

export type DeleteTwiInput<
  TN extends string,
  Key extends object,
  CE extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RV extends ReturnValuesOnConditionCheckFailureValues
> = {
  TableName: TN;
  Key: Key;
  ConditionExpression?: CE extends UseAllExpressionAttributesInString<EAN, EAV> ? CE : `Error ❌ unused EANs or EAVs: ${FilterUnusedEANOrVs<CE, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ReturnValuesOnConditionCheckFailure?: RV;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    } : {
      ExpressionAttributeNames?: DummyEAN;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
    } : {
      ExpressionAttributeValues?: DummyEAV;
    }
  );

export type ConditionCheckTwiInput<
  TN extends string,
  Key extends object,
  CE extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RV extends ReturnValuesOnConditionCheckFailureValues
> = {
  TableName: TN;
  Key: Key;
  ConditionExpression: CE extends UseAllExpressionAttributesInString<EAN, EAV> ? CE : `Error ❌ unused EANs or EAVs: ${FilterUnusedEANOrVs<CE, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ReturnValuesOnConditionCheckFailure?: RV;
} & (
    CE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    } : {
      ExpressionAttributeNames?: DummyEAN;
    }
  ) & (
    CE extends EAVString
    ? {
      ExpressionAttributeValues: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
    } : {
      ExpressionAttributeValues?: DummyEAV;
    }
  );

export type GetReturnValuesListValue<TypeOfItem extends Record<string, any>, CE extends string | undefined, RV extends ReturnValuesOnConditionCheckFailureValues | undefined> =
  undefined extends CE
  ? "NO_ITEM"
  : undefined extends RV
  ? "NO_ITEM"
  : "NONE" extends RV
  ? "NO_ITEM"
  : TypeOfItem;

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

type UnknownReason = {
  Code: string;
  Message?: string;
};
type ConditionCheckFailedReason<Item extends Record<string, unknown>> = {
  Code: "ConditionalCheckFailed";
  Message: string;
  Item: Item | undefined;
};
type ParsedCancellationReason<Item extends Record<string, unknown> | "NO_ITEM"> = (
  Item extends "NO_ITEM"
  ? UnknownReason
  : ConditionCheckFailedReason<Exclude<Item, "NO_ITEM">>
) | undefined;
export type ParsedCancellationReasons<ReturnValuesList extends Record<string, unknown> | "NO_ITEM" = Record<string, unknown> | "NO_ITEM"> =
  | ParsedCancellationReason<ReturnValuesList>[]
  | undefined;
export type TwiOutput<RCC extends "INDEXES" | "TOTAL" | "NONE", RICM extends "SIZE" | "NONE", ReturnValuesList extends Record<string, unknown> | "NO_ITEM"> =
  | { success: true; response: TwiResponse<RCC, RICM> }
  | { success: false; CancellationReasons: ParsedCancellationReasons<ReturnValuesList> | undefined; error: unknown };
