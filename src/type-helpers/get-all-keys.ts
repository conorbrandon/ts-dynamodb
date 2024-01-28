import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IsAnyOrUnknown, Primitive } from "./utils";
import { NativeJSBinaryTypes } from "../dynamodb-types";
import { KeyIntoObject } from "./record";

declare const STRING_OBJ_INTERSECTER: unique symbol;
type _GetAllKeys<T, Acc = never> =
  IsAnyOrUnknown<T> extends true
  ? Acc | typeof STRING_OBJ_INTERSECTER
  : T extends Primitive | Set<any> | ReadonlySet<any> | DocumentClient.DynamoDbSet | NativeJSBinaryTypes
  ? Acc // return gathered results
  : T extends any[] | readonly any[]
  ? {
    [K in keyof T]: _GetAllKeys<T[K], Acc>; // DO NOT add K to Acc here because K is a number
  }[number]
  : T extends object
  ? KeyIntoObject<{
    [K in keyof T as K extends symbol ? never : K]: _GetAllKeys<T[K], Acc | (string extends K ? typeof STRING_OBJ_INTERSECTER : K)>;
  }>
  : never;

type FilterGAK<G> = G extends string ? G : G extends number ? `${G}` : G extends typeof STRING_OBJ_INTERSECTER ? (string & {}) : never;
export type GetAllKeys<Obj extends object> = FilterGAK<_GetAllKeys<Obj>>;
