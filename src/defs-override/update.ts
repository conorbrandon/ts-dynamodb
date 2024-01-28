import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { EANString, EAVString } from "../dynamodb-types";
import { UpdateReturnValues } from "../lib";
import { DeepValidateShapev2WithBinaryResult } from "../type-helpers/deep-validate";
import { IsUEValid, UEIsValid } from "../type-helpers/UE/ue-lib";
import { _LogParams } from "./defs-helpers";
import { ExtractEAsFromString } from "../type-helpers/extract-EAs";
import { GetAllKeys } from "../type-helpers/get-all-keys";
import { TSDdbSet } from "../type-helpers/sets/utils";
import { DeepSimplifyObject, NoUndefined } from "../type-helpers/utils";
import { ProjectUpdateExpression } from "../type-helpers/UE/output";

export type UpdateInput<
  TN extends string,
  Key extends Record<string, any>,
  TypeOfItem extends Record<string, any>,
  UE extends string,
  CE extends string,
  EAN extends Record<string, string>,
  EAV extends Record<string, any>,
  RV extends UpdateReturnValues,
  UEEAs extends { ean: string; eav: string } = ExtractEAsFromString<UE>,
  CEEAs extends { ean: string; eav: string } = ExtractEAsFromString<CE>,
  EANs extends Record<string, string> = Record<UEEAs['ean'] | CEEAs['ean'], GetAllKeys<TypeOfItem>>,
  EAVs extends Record<string, any> = Record<UEEAs['eav'] | CEEAs['eav'], unknown> // NOTE: this MUST be unknown for `const` inference to work (not `any`).
> = {
  TableName: TN;
  Key: Key;
  UpdateExpression: IsUEValid<UE, TypeOfItem, EAN, EAV> extends infer ueValid
  ? ueValid extends UEIsValid
  ? UE
  : ueValid & string // ueValid is either a string indicating the UE is valid, or a string describing the clause causing the error
  : never;
  ConditionExpression?: CE;
  ReturnValues?: RV;
  ReturnConsumedCapacity?: "INDEXES" | "TOTAL" | "NONE";
  ReturnItemCollectionMetrics?: "SIZE" | "NONE";
  ReturnValuesOnConditionCheckFailure?: "ALL_OLD" | "NONE";
  ExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  ExpressionAttributeValues?: EAVs extends EAV ? EAV : EAVs;
} & (
    `${UE}${CE}` extends EANString
    ? {
      ExpressionAttributeNames: EANs;
    } : {
      ExpressionAttributeNames?: never;
    }
  ) & (
    `${UE}${CE}` extends EAVString
    ? {
      ExpressionAttributeValues: EAVs;
    } : {
      ExpressionAttributeValues?: never;
    }
  );

type ExtraConditions<
  AS extends string,
  TypeOfItem extends Record<string, any>,
  EAN extends Record<string, string>,
  EAV extends Record<string, any>,
  SAEAs extends { ean: string; eav: string } = ExtractEAsFromString<AS>,
  EANs extends Record<string, string> = Record<SAEAs['ean'], GetAllKeys<TypeOfItem>>,
  EAVs extends Record<string, any> = Record<SAEAs['eav'], unknown> // NOTE: this MUST be unknown for `const` inference to work (not `any`).
> = {
  ANDSuffix: AS;
  extraExpressionAttributeNames?: EANs extends EAN ? EAN : EANs;
  extraExpressionAttributeValues?: EAVs extends EAV ? EAV : EAVs;
} & (
    AS extends EANString
    ? {
      extraExpressionAttributeNames: EANs;
    } : {
      extraExpressionAttributeNames?: never;
    }
  ) & (
    AS extends EAVString
    ? {
      extraExpressionAttributeValues: EAVs;
    } : {
      extraExpressionAttributeValues?: never;
    }
  );
declare const ERROR: unique symbol;
export type UpdateSimpleSETInput<
  TN extends string,
  Key extends Record<string, any>,
  TypeOfItem extends Record<string, any>,
  UpdateKeys extends keyof TypeOfItem,
  AS extends string,
  EAN extends Record<string, string>,
  EAV extends Record<string, any>,
  RV extends UpdateReturnValues
> = {
  TableName: TN;
  Key: Key;
  Item: { [K in UpdateKeys]: TypeOfItem[K] };
  ReturnValues?: RV;
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
  extraConditions?: ExtraConditions<AS, TypeOfItem, EAN, EAV>;
  /**
   * Advanced feature: with all other methods, you can create the parameters however you wish ahead of time and log them. However, since `updateSimpleSET` creates the parameters for you, you may wish to log exactly what was going into your DB (or debug conflicting names with the `extraConditions` option).
   * Make sure to set `log` to `true`!
   * Optionally also log a custom `message`.
   */
  _logParams?: _LogParams;
} & (
    DeepValidateShapev2WithBinaryResult<Item, NoKeysTypeOfItem> extends 1
    ? unknown
    : {
      Item: {
        [ERROR]: "The type of Item provided to `updateSimpleSET` is invalid. The Item must extend a Partial of the type of Item with the provided Key, but may not contain any additional fields and may not contain any of the fields on the provided Key. Succinctly, `Exact< Partial< Omit<Item_with_Key, keyof Key> > >`";
      };
    }
  );

type UpdateOutputHelper<T extends Record<any, any>, UE extends string, EAN extends Record<string, string>, RN extends UpdateReturnValues | undefined> =
  RN extends undefined ? undefined
  : RN extends 'NONE' ? undefined
  : RN extends 'ALL_OLD' | 'ALL_NEW' ? TSDdbSet<T> | undefined
  : RN extends 'UPDATED_OLD' | 'UPDATED_NEW' ? ProjectUpdateExpression<UE, T, EAN, RN>
  : never;
export type UpdateOutput<
  TypeOfItem extends Record<string, any>,
  UE extends string,
  EAN extends Record<string, string>,
  RN extends UpdateReturnValues,
> = (
  Omit<DocumentClient.UpdateItemOutput, 'Attributes'> & {
    Attributes?: UpdateOutputHelper<TypeOfItem, UE, EAN, RN> extends infer Res ? Res : never;
  }
) extends infer Res2 ? Res2 : never;

type UpdateSimpleSETOutputHelper<TypeOfItem extends Record<string, any>, UpdateKeys extends keyof TypeOfItem, RN extends UpdateReturnValues | undefined> =
  RN extends undefined | 'NONE' ? undefined
  // The lack of undefined is predicated on the fact a CE with the Key is ALWAYS included
  : RN extends 'ALL_OLD' | 'ALL_NEW' ? TSDdbSet<TypeOfItem>
  // below this, we add undefined because we are allowing a Partial of TypeOfItem, and if the Item doesn't actually contains any keys or all values are undefined, no UpdateExpression will be created, thus Attributes could be undefined.
  : RN extends 'UPDATED_OLD' ? DeepSimplifyObject<TSDdbSet<{ [K in UpdateKeys]: TypeOfItem[K] }>> | undefined
  : RN extends 'UPDATED_NEW' ? DeepSimplifyObject<TSDdbSet<{ [K in UpdateKeys]-?: NoUndefined<TypeOfItem[K]> }>> | undefined
  : never;
export type UpdateSimpleSETOutput<
  TypeOfItem extends Record<string, any>,
  UpdateKeys extends keyof TypeOfItem,
  RN extends UpdateReturnValues
> = (
  Omit<DocumentClient.UpdateItemOutput, 'Attributes'> & {
    Attributes?: UpdateSimpleSETOutputHelper<TypeOfItem, UpdateKeys, RN> extends infer Res ? Res : never;
  }
) extends infer Res2 ? Res2 : never;