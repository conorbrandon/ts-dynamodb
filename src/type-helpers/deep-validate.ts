import { IsAnyOrUnknown, IsNever, IsStringRecord, OnlyObjects, Primitive } from "./utils";
import { NativeJSBinaryTypes } from "../dynamodb-types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { UnionToIntersection } from "./record";

/** Intersect all union constituents that Obj satisfies, with what effectively amounts to excess property checking. */
type IntersectSatisfiedUnions<T extends object, Obj> = UnionToIntersection<
  T extends any
  ? Obj extends T
  ? T
  : never
  : never
>;

type DeepValidateArray<Arr extends any[], Shape> =
  Shape extends any[] // the reason to include this at all is an absolute gut punch from TS's structural type system. [string] extends { "0": string }. Brutal.
  ? {
    // And remember, we don't want to do the K extends keyof Shape like we do below, because this type might get something like this: if coming from a readonly const, Arr is [0] and Shape is number[], which we want to succeed, but "0" is not a keyof Shape, but "0" & keyof Shape will produce number. Wacky stuff. 
    [K in keyof Arr]: _DeepValidateShapev2<Arr[K], Shape[K & keyof Shape]>;
  }
  : never;

type _DeepValidateShapev2<Obj, Shape> =
  IsNever<Obj> extends true
  ? never
  : IsAnyOrUnknown<Obj> extends true // SHORT CIRCUIT for any or unknown
  ? Obj
  : (
    Obj extends Shape // first we check if all the required fields are on Obj, and the correct types
    ? (
      Obj extends Primitive | NativeJSBinaryTypes | DocumentClient.DynamoDbSet | Set<any> | ReadonlySet<any> // accept branded types and template literal types
      ? Obj
      : Obj extends any[] // delegate this to a helper type, hopefully allowing it to preserve an array type, instead of doing all sorts of annoying things and turning it into an object
      ? DeepValidateArray<Obj, Shape> // this must come before the Exclude thing below, because Obj might be a tuple, while Shape is an array, resulting in a `${number}` key not being excluded
      : (
        Obj extends object // we should have gotten rid of all the types that extend object but that aren't really what most people thing of as "objects" above
        ? (
          // when Obj may satisfy multiple union constituents, we must find those constituents and check for extra properties.
          // as a side effect, this will produce very specific errors for extra fields, since they're set to never.
          IntersectSatisfiedUnions<OnlyObjects<Shape>, Obj> extends infer intersected
          ? {
            [K in keyof Obj]: K extends keyof intersected ? _DeepValidateShapev2<Obj[K], intersected[K]> : never;
          }
          : never
        )
        : Obj // Obj must be a boolean, null, bigint, undefined or something else (not sure that'd be though)
      )
    )
    : never
  );

export type DeepValidateShapev2<Obj, Shape> =
  IsStringRecord<Obj> extends true // annoyingly, it seems the Record<string, any> types passed from unresolved generics cause it to infinitely blow up for put
  ? Obj
  : _DeepValidateShapev2<Obj, Shape> extends infer validated ? validated : never;

export type DeepValidateShapev2WithBinaryResult<Obj, Shape> = Obj extends DeepValidateShapev2<Obj, Shape> ? 1 : 0;
