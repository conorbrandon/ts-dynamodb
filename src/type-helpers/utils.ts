import { DynamoDB } from "aws-sdk";
import { NativeJSBinaryTypes } from "../dynamodb-types";
import { Tail } from "./record";

export type NoUndefined<T> = T extends undefined ? never : T;
export type OnlyArrays<T> = Extract<T, any[]>;
export type NoArrays<T> = Exclude<T, any[]>;

export type OnlyObjects<T> = T extends object ? T : never;
export type OnlyStrings<T> = T extends string ? T : never;

export type KeysOfTuple<Arr extends any[]> = {
  [K in keyof Arr]: K
};

export type Primitive = string | number | boolean | null | undefined | symbol;

export type DeepSimplifyObject<T> =
  T extends Primitive // make extra special considerations for strings, which may be template literals, branded types, etc...
  ? T
  : T extends object
  ? (
    T extends NativeJSBinaryTypes | Set<any>
    ? T
    : T extends DynamoDB.DocumentClient.DynamoDbSet
    ? {
      [K in keyof T]: T[K]
    }
    : {
      [K in keyof T]: DeepSimplifyObject<T[K]>
    }
  )
  : T;
export type XLevelSimplifyObject<T, Levels extends never[] = [never]> =
  Levels extends []
  ? T
  : (
    T extends Primitive
    ? T
    : T extends object
    ? (
      T extends NativeJSBinaryTypes | Set<any>
      ? T
      : T extends DynamoDB.DocumentClient.DynamoDbSet
      ? {
        [K in keyof T]: T[K]
      }
      : {
        [K in keyof T]: XLevelSimplifyObject<T[K], Tail<Levels>>
      }
    )
    : T
  );

export type IsNever<T> = [T] extends [never] ? true : false;
export type IsAny<T> = 0 extends (1 & T) ? true : false;

export type ArrayContainsNever<Arr extends any[]> =
  Arr extends [infer start, ...infer rest]
  ? (
    IsNever<start> extends true
    ? true
    : ArrayContainsNever<rest>
  )
  : false;

/** 
 * extract from type B those types that A extends. Useful for extracting from B = string | number and A = '', resulting in string.
 * regular Extract falls down in this scenario: Extract<string | number, ''> = never
 */
export type NarrowerExtract<A, B> = B extends any ? A extends B ? B : never : never;