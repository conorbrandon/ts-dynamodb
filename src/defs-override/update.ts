import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, EANString, EAVString } from "../dynamodb-types";
import { UpdateOutputHelper, UpdateReturnValues, UpdateSimpleSETOutputHelper } from "../lib";
import { DeepValidateShapev2WithBinaryResult } from "../type-helpers/deep-validate";
import { DeepWriteable, NotEmptyWithMessage } from "../type-helpers/record";
import { FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../type-helpers/string";
import { IsUEValid, UEIsValid } from "../type-helpers/UE/ue-lib";
import { OnlyStrings } from "../type-helpers/utils";
import { _LogParams } from "./defs-helpers";

export type UpdateInput<
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
  RN extends UpdateReturnValues
> = Omit<DocumentClient.UpdateItemInput, 'TableName' | 'Key' | 'ExpressionAttributeNames' | 'ExpressionAttributeValues' | 'UpdateExpression' | 'ConditionExpression' | 'ReturnValues'> & {
  TableName: TN;
  Key: Key;
  ExpressionAttributeNames?: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
  ExpressionAttributeValues?: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
  UpdateExpression?:
  `${UE}${CE}` extends UseAllExpressionAttributesInString<EAN, EAV>
  ? (
    IsUEValid<UE, TypeOfItem, EAN, EAV> extends infer ueValid ? (
      ueValid extends UEIsValid ? UE : ueValid & string // ueValid is either a string indicating the UE is valid, or a string describing the clause causing the error
    ) : never
  ) : `Error ❌ unused EAs in UE and/or CE: ${FilterUnusedEANOrVs<`${UE}${CE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  // This needs the Error check on both, because CE or UE can both exist standalone.
  ConditionExpression?: `${UE}${CE}` extends UseAllExpressionAttributesInString<EAN, EAV> ? CE : `Error ❌ unused EAs in UE and/or CE: ${FilterUnusedEANOrVs<`${UE}${CE}`, OnlyStrings<keyof EAN | keyof EAV>>}`;
  ReturnValues?: RN;
};
export type StrictUpdateItemInput<
  Key extends object,
  TypeOfItem extends object,
  UE extends string,
  CE extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  EAV extends Record<EAVs, any>,
  RN extends UpdateReturnValues
> = Omit<UpdateInput<never, Key, TypeOfItem, UE, CE, EANs, EAVs, GAK, EAN, EAV, RN>, 'TableName'>;

export type ExtraConditions<AS extends string, EANs extends string, EAVs extends string, GAK extends string, EAN extends Record<EANs, GAK>, DummyEAN extends undefined, EAV extends Record<EAVs, any>, DummyEAV extends undefined> = {
  ANDSuffix: AS extends UseAllExpressionAttributesInString<EAN, EAV> ? AS : `Error ❌ unused EAs in ANDSuffix: ${FilterUnusedEANOrVs<AS, OnlyStrings<keyof EAN | keyof EAV>>}`;
} & (
    AS extends EANString
    ? {
      extraExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    } : {
      extraExpressionAttributeNames?: DummyEAN;
    }
  ) & (
    AS extends EAVString
    ? {
      extraExpressionAttributeValues: NotEmptyWithMessage<EAV, "ExpressionAttributeValues cannot be empty">;
    } : {
      extraExpressionAttributeValues?: DummyEAV;
    }
  );
export type UpdateSimpleSETInput<
  TN extends string,
  Key extends object,
  TypeOfItem extends object,
  Item extends object,
  AS extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RN extends UpdateReturnValues
> = {
  TableName: TN;
  Key: Key;
  Item: Item;
  ReturnValues?: RN;
  /** 
  * 
  * Advanced feature: add extra conditions to the base `ConditionExpression` created from the Key. 
  * 
  * Be careful: 
  * - do not prefix the `ANDSuffix` with `'AND'`, it is added automatically if an `ANDSuffix` is provided.
  * - do not include any `extraExpressionAttributeNames` keys that would conflict with one added from the fields on the `Item` to update. 
  * For example, if `Item` could include the key `a`, the `ExpressionAttributeNames` will include the key `'#a'` with value `'a'`, so do not include in `extraExpressionAttributeNames` the key `'#a'` with a different value than `'a'`, as the result might not be what you expect.
  * - the above also applies to `extraExpressionAttributeValues`, except the key `':a'` and whatever the value of `Item.a` is.
  * 
  * @example
  * ```ts
  {
      ANDSuffix: 'thing.#updated < :updated', // if the Key is { hashKey: string }, the resulting ConditionExpression is '(#hashKey=:hashKey) AND thing.#updated < :updated'
      extraExpressionAttributeNames: {
        '#updated': 'updated'
      },
      extraExpressionAttributeValues: {
        ':updated': Date.now()
      }
  }
  * ```
  */
  extraConditions?: ExtraConditions<AS, EANs, EAVs, GAK, EAN, DummyEAN, EAV, DummyEAV>;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `simpleUpdateSET` creates the parameters for you, you may wish to log exactly what was going into your DB (or debug conflicting names with the `extraConditions` option).
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
} & (
    DeepValidateShapev2WithBinaryResult<DeepWriteable<Item>, DeepWriteable<TypeOfItem>> extends 1 ? unknown : { Error: "The type of Item provided to `updateSimpleSET` is invalid. The Item must extend a Partial of the type of Item with the provided Key, but may not contain any additional fields and may not contain any of the fields on the provided Key. Succinctly, `Exact< Partial< Omit<Item_with_Key, keyof Key> > >`" }
  );
export type StrictUpdateSimpleSETInput<
  Key extends object,
  TypeOfItem extends object,
  Item extends object,
  AS extends string,
  EANs extends string,
  EAVs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined,
  EAV extends Record<EAVs, any>,
  DummyEAV extends undefined,
  RN extends UpdateReturnValues
> = Omit<UpdateSimpleSETInput<never, Key, TypeOfItem, Item, AS, EANs, EAVs, GAK, EAN, DummyEAN, EAV, DummyEAV, RN>, 'TableName'>;

export type UpdateOutput<
  GenericT extends object,
  UE extends string,
  EAN extends AnyExpressionAttributeNames,
  RN extends UpdateReturnValues,
> = (Omit<DocumentClient.UpdateItemOutput, 'Attributes'> & {
  Attributes?: UpdateOutputHelper<GenericT, UE, EAN, RN> extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;
export type UpdateSimpleSETOutput<
  Item extends object,
  TypeOfItem extends object,
  RN extends UpdateReturnValues
> = (Omit<DocumentClient.UpdateItemOutput, 'Attributes'> & {
  Attributes?: UpdateSimpleSETOutputHelper<Item, TypeOfItem, RN> extends infer Res ? Res : never;
}) extends infer Res2 ? Res2 : never;