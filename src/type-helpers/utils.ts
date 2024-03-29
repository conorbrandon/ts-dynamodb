import { DynamoDB } from "aws-sdk";
import { NativeJSBinaryTypes } from "../dynamodb-types";
import { Tail } from "./record";

export type NoUndefined<T> = T extends undefined ? never : T;
export type OnlyArrays<T> = Extract<T, any[]>;
export type NoArrays<T> = Exclude<T, any[]>;

export type OnlyObjects<T> = T extends object ? T : never;
export type OnlyStrings<T> = T extends string ? T : never;
export type OnlyNonEmptyObjects<T> = T extends object ? {} extends T ? never : T : never;
export type OnlyNumbers<T> = T extends number ? T : never;

export type KeysOfTuple<Arr extends any[]> = {
  [K in keyof Arr]: K
};

export type Primitive = string | number | boolean | null | undefined | symbol | bigint;

export type DeepSimplifyObject<T> =
  IsAnyOrUnknown<T> extends true
  ? T
  : T extends Primitive | NativeJSBinaryTypes | Set<any> | ReadonlySet<any>
  ? T
  : T extends object
  ? (
    T extends DynamoDB.DocumentClient.DynamoDbSet
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
    IsAnyOrUnknown<T> extends true
    ? T
    : T extends Primitive | NativeJSBinaryTypes | Set<any> | ReadonlySet<any>
    ? T
    : T extends object
    ? (
      T extends DynamoDB.DocumentClient.DynamoDbSet
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
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;
export type IsAnyOrUnknown<T> = IsAny<T> extends true ? true : unknown extends T ? true : false;
export type IsNumberRecord<T> = number extends keyof T ? (T extends any[] ? false : true) : false;
export type IsStringRecord<T> = string extends keyof T ? (T extends any[] ? false : true) : false;
export type IsRecord<T> = IsStringRecord<T> extends true ? true : IsNumberRecord<T> extends true ? true : false;

export type ArrayHasNoDefinedIndices<T extends any[]> = IsNever<keyof T & `${number}`>;

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

declare const checkerForIndexAccess: Record<string, string>;
declare const indexer: string;
const checkingIndexAccess = checkerForIndexAccess[indexer];
export type IsNoUncheckedIndexAccessEnabled = undefined extends typeof checkingIndexAccess ? true : false;

export type IsUnion<T, U extends T = T> = (
  T extends any
  ? (U extends T ? false : true)
  : never
) extends false ? false : true;
export type KeyOfUnion<T> = T extends any ? keyof T : never;

declare const BRAND: unique symbol;
export type Branded<S extends string, Type> = {
  [BRAND]: {
    [k in S]: true
  };
} & Type;
export type UnbrandRecord<T extends Record<string, any> & Branded<string, object>> = {
  [K in keyof T as K extends typeof BRAND ? never : K]: T[K];
};

/**
 * Comes with some pitfalls, see https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
 */
export type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;