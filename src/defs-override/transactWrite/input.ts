import { AnyGenericTable, ExtractTableItemForKey, ReturnValuesOnConditionCheckFailureValues, TableItem } from "../../lib";
import { ConditionCheckVariadicTwiBase, ValidateConditionCheckVariadicTwiInput } from "./condition-check";
import { DeleteVariadicTwiBase, ValidateDeleteVariadicTwiInput } from "./delete";
import { PutVariadicTwiBase, ValidatePutVariadicTwiInput } from "./put";
import { UpdateVariadicTwiBase, ValidateUpdateVariadicTwiInput } from "./update";

export type VariadicTwiBase<TS extends AnyGenericTable> =
  | { Put: PutVariadicTwiBase<TS>; Update?: never; Delete?: never; ConditionCheck?: never }
  | { Put?: never; Update: UpdateVariadicTwiBase<TS>; Delete?: never; ConditionCheck?: never }
  | { Put?: never; Update?: never; Delete: DeleteVariadicTwiBase<TS>; ConditionCheck?: never }
  | { Put?: never; Update?: never; Delete?: never; ConditionCheck: ConditionCheckVariadicTwiBase<TS> };

export type ValidateVariadicTwiInputs<TS extends AnyGenericTable, Inputs extends readonly VariadicTwiBase<TS>[]> =
  // `[Inputs] extends [unknown]` hack: https://github.com/microsoft/TypeScript/issues/54537
  [Inputs] extends [unknown]
  ? {
    [K in keyof Inputs]:
    Inputs[K] extends infer Input // CRUCIAL: must distribute this otherwise differing types of Puts, Updates, etc... in a non-tuple array get their properties accessed within the union, NOT individually.
    ? Input extends { Put: PutVariadicTwiBase<TS> }
    ? { Put: ValidatePutVariadicTwiInput<TS, Input['Put']['TableName'], Input['Put']['Item'], Input['Put']['ConditionExpression']> }
    : Input extends { Update: UpdateVariadicTwiBase<TS> }
    ? { Update: ValidateUpdateVariadicTwiInput<TS, Input['Update']['TableName'], Input['Update']['Key'], Input['Update']['UpdateExpression'], Input['Update']['ConditionExpression'], Input['Update']['ExpressionAttributeNames'], Input['Update']['ExpressionAttributeValues']> }
    : Input extends { Delete: DeleteVariadicTwiBase<TS> }
    ? { Delete: ValidateDeleteVariadicTwiInput<TS, Input['Delete']['TableName'], Input['Delete']['Key'], Input['Delete']['ConditionExpression']> }
    : Input extends { ConditionCheck: ConditionCheckVariadicTwiBase<TS> }
    ? { ConditionCheck: ValidateConditionCheckVariadicTwiInput<TS, Input['ConditionCheck']['TableName'], Input['ConditionCheck']['Key'], Input['ConditionCheck']['ConditionExpression']> }
    : VariadicTwiBase<TS> // This allows for autocomplete to continue until all required properties are added.
    : never;
  }
  : Inputs;

type GetReturnValuesValue<TypeOfItem extends Record<string, any>, CE extends string | undefined, RV extends ReturnValuesOnConditionCheckFailureValues | undefined> =
  undefined extends CE
  ? never
  : undefined extends RV
  ? never
  : "NONE" extends RV
  ? never
  : TypeOfItem;
export type GetNewVariadicTwiReturnValues<TS extends AnyGenericTable, Inputs extends readonly VariadicTwiBase<TS>[]> = {
  [K in keyof Inputs]:
  Inputs[K] extends { Put: PutVariadicTwiBase<TS> }
  ? GetReturnValuesValue<
    ExtractTableItemForKey<TableItem<TS, Inputs[K]['Put']['TableName']>, Inputs[K]['Put']['Item']>,
    Inputs[K]['Put']['ConditionExpression'],
    Inputs[K]['Put']['ReturnValuesOnConditionCheckFailure']
  >
  : Inputs[K] extends { Update: UpdateVariadicTwiBase<TS> }
  ? GetReturnValuesValue<
    ExtractTableItemForKey<TableItem<TS, Inputs[K]['Update']['TableName']>, Inputs[K]['Update']['Key']>,
    Inputs[K]['Update']['ConditionExpression'],
    Inputs[K]['Update']['ReturnValuesOnConditionCheckFailure']
  >
  : Inputs[K] extends { Delete: DeleteVariadicTwiBase<TS> }
  ? GetReturnValuesValue<
    ExtractTableItemForKey<TableItem<TS, Inputs[K]['Delete']['TableName']>, Inputs[K]['Delete']['Key']>,
    Inputs[K]['Delete']['ConditionExpression'],
    Inputs[K]['Delete']['ReturnValuesOnConditionCheckFailure']
  >
  : Inputs[K] extends { ConditionCheck: ConditionCheckVariadicTwiBase<TS> }
  ? GetReturnValuesValue<
    ExtractTableItemForKey<TableItem<TS, Inputs[K]['ConditionCheck']['TableName']>, Inputs[K]['ConditionCheck']['Key']>,
    Inputs[K]['ConditionCheck']['ConditionExpression'],
    Inputs[K]['ConditionCheck']['ReturnValuesOnConditionCheckFailure']
  >
  : never;
}[number];