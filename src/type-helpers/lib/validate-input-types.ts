import { Tail } from "../record";
import { KeysOfTuple } from "../utils";

type TypesContainSparseArraysError = "Error: at least one of the types provided to a Table type contains sparse array(s), \
i.e. tuples that can contain `undefined`, `any`, or `unknown` at one or more elements. These types of arrays are not able to be checked in the type system \
due to DynamoDB shifting elements forward when a preceding element is `put` as `undefined`. Consider using `null` instead to preserve tuple ordering.";

/** Take a tuple and if any of the elements are optional, return 1.
 * Recursively check the elements, if they are arrays or Records, as well
 */
type DeepCheckIfUndefinedInTuple<T extends any[]> = {
  [K in keyof T & `${number}`]:
  undefined extends T[K]
  ? 1 | (T[K] extends Record<any, any> ? _IsArraySparse<T[K]> : never)
  : 0 | (T[K] extends Record<any, any> ? _IsArraySparse<T[K]> : never)
}[keyof T & `${number}`];

type _IsArraySparse<T extends Record<any, any>> =
  T extends Record<any, any>
  ? T extends any[]
  ? 1 extends DeepCheckIfUndefinedInTuple<T> ? 1 : 0
  : (
    T extends string
    ? never
    : {
      [K in keyof T]: _IsArraySparse<T[K]>
    }[keyof T]
  )
  : never;
type IsArraySparse<T extends Record<any, any>> =
  T extends Record<any, any>
  ? _IsArraySparse<T> extends infer isSparse
  ? unknown extends isSparse ? 0 // this is so generic types like any or Record<any, any> can be passed. Have to use these types in the Tables in the TypesafeDocumentClient
  : (1 extends isSparse ? 1 : 0)
  : never
  : never;

type IsArraySparseInUnion<T extends Record<any, any>> =
  1 extends IsArraySparse<T> ? 1 : 0;

type TypesContainUnknowableRestArraysError = "Error: at least one of the types provided to the Table type contains rest tuple(s) with \
rest elements that do not terminate the array, e.g. `[...any[], any]`. These types of arrays are not able to be checked in the type system \
due to an unknowable number of elements in a rest element preceding a non-rest element. \
You could consider using the closest approximation to the above example, which is: `[[any[]], any]`";

/**
 * Take a tuple or array and check if it contains rest elements that are NOT in the final position.
 * Pure arrays and non-rest tuple return 0, rest tuples with a rest element in the final position return 0,
 * any other rest tuple returns 1.
 */
type IsTerminatingTailOfArrayRest<Arr extends any[]> =
  Arr extends [] // if we have reached the end of a pure tuple, return 0
  ? 0
  : KeysOfTuple<Arr> extends number[] // if we have a pure array, or we have reached the rest element of the array (it will be a pure array), return 1. Recursive Tail can only EVER reach the rest element of the array if it comes in the final position.
  ? 0
  : Tail<Arr> extends Arr // we have to be careful here, because Tail on a pure array or empty tuple will satisfy this condition, but we outrule those conditions above.
  ? 1
  : (
    IsTerminatingTailOfArrayRest<Tail<Arr>> // we can continue to recurse using the Tail
    | (Arr[0] extends Record<any, any> ? _AreRestArraysTailGrowing<Arr[0]> : never)
  );

type _AreRestArraysTailGrowing<T extends Record<any, any>> =
  T extends Record<any, any>
  ? T extends any[]
  ? 1 extends IsTerminatingTailOfArrayRest<T> ? 1 : 0
  : (
    T extends string
    ? never
    : {
      [K in keyof T]: _AreRestArraysTailGrowing<T[K]>
    }[keyof T]
  )
  : never;
type AreRestArraysTailGrowing<T extends Record<any, any>> =
  T extends Record<any, any>
  ? _AreRestArraysTailGrowing<T> extends infer areTail
  ? unknown extends areTail ? 0 // this is so generic types like any or Record<any, any> can be passed. Have to use these types in the Tables in the TypesafeDocumentClient
  : (1 extends areTail ? 1 : 0)
  : never
  : never;

// the reason we can't allow these is when updating. Think about if there is a non-rest element after a rest element.
// If we wanted to SET index N to the last non rest element type. how to we know that the length of the array is N + 1?
type AreRestArraysTailGrowingInUnion<T extends Record<any, any>> =
  1 extends AreRestArraysTailGrowing<T> ? 1 : 0;

/**
 * Determine if there are any illegal or unknowable types in the types provided to the Table
 */
export type ValidateInputTypesForTable<TypesUnion extends Record<any, any>> =
  1 extends IsArraySparseInUnion<TypesUnion>
  ? TypesContainSparseArraysError
  : 1 extends AreRestArraysTailGrowingInUnion<TypesUnion>
  ? TypesContainUnknowableRestArraysError
  : 1;

/** Check if a `Key` that could be provided to createStrictGet/DeleteItem has a property called "Key". If so, make it so the raw `Key` _cannot_ be an argument to createStrictGet/DeleteItem. This is to avoid incorrect parameters being passed to `get`/`delete`. */
export type DoesKeyHaveAPropertyCalledKey<Key extends Record<string, unknown>> = "Key" extends keyof Key ? never : Key;