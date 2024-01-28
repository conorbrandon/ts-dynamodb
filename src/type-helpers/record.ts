import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { NativeJSBinaryTypes } from '../dynamodb-types';
import { Primitive, IsAnyOrUnknown } from './utils';

/** Take a union of object types and pick Fields from each type, producing another union.
 * i.e.: `U` = `{ p0: string; s0: number[] } | { p0: number; s0: string[] }` and `Fields` = `'p0'`
 * produces: { p0: string } | { p0: number }
 */
export type PickAcrossUnionOfRecords<U, Fields extends string> = U extends Record<string, any> ? Pick<U, Fields> : never;

/** Take an object and get the values that are purely string, no undefined.
 * For example, the type { p0: `${number}-${string}`; s0?: undefined; } produces `${number}-${string}`,
 * while the type { p0: `${number}-${string}`; s0?: `${string}-${number}`; } produces `${number}-${string}` | `${string}-${number}`
 */
export type Values<T extends Record<string, string | undefined>> = Exclude<T[keyof T] & string, undefined>;

/** Get tail of a tuple */
export type Tail<T extends any[]> = T extends [head: any, ...tail: infer I]
  ? I
  : T;
export type Head<T extends any[]> = T extends [...head: infer I, tail: any]
  ? I
  : T;

/** Take a union and convert it to an intersection.
 * Won't work on a discriminated union because, 
 * well, the point is to be able to discriminate across all union members, duh!
 */
export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/** 
 * Removes the readonly modifier from a type (required for SET computed type to extend picked type) 
 * There's some absolute tomfoolery going on with why we need to check for `Primitive`s in DeepWriteable.
 * In short, branded types' primitives get destroyed by mapped types.
 * See https://stackoverflow.com/a/75213240/20071103
*/
export type DeepWriteable<T> = T extends Primitive | NativeJSBinaryTypes | Set<any> | ReadonlySet<any> | DocumentClient.DynamoDbSet ? T : IsAnyOrUnknown<T> extends true ? T : { -readonly [P in keyof T]: DeepWriteable<T[P]> };
/** 
 * Adds the readonly modifier from a type (required for updateSimpleSET Item to extend Partial with keys omitted of TableItem) 
 * (with the appropriate branded types check)
 */
export type DeepReadonly<T> = T extends Primitive | NativeJSBinaryTypes | Set<any> | ReadonlySet<any> | DocumentClient.DynamoDbSet ? T : IsAnyOrUnknown<T> extends true ? T : { readonly [P in keyof T]: DeepReadonly<T[P]> };

/** Makes all properties in object optional, stopping short of mapping over branded types, binary types, and DDB and normal JS Sets */
export type DeepPartial<T> =
  T extends number | string | NativeJSBinaryTypes | Set<any> | ReadonlySet<any>
  ? T
  : T extends DocumentClient.DynamoDbSet
  ? { [K in keyof T]: T[K] }
  : T extends any[] | readonly any[]
  ? { [K in keyof T]: DeepPartial<T[K]> }
  : { [K in keyof T]?: DeepPartial<T[K]> };

type RemoveIndexKeys<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
};
export type GetAllNonIndexKeys<T> = keyof RemoveIndexKeys<T>;

export type KeyIntoObject<T extends object> = T[keyof T];