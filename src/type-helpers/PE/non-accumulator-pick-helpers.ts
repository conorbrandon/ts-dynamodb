import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Tail } from "../record";
import { DeepSimplifyObject, IsAnyOrUnknown, KeysOfTuple, NoArrays, NoUndefined, OnlyArrays, Primitive } from "../utils";

type ExtractRestElementOfArray<Arr extends any[]> =
  keyof Arr & `${number}` extends never // if the rest array doesn't have `${number}` indices anymore, we've reached the rest element
  ? Arr // returns the rest element as an array, not the type of element in the rest array
  : ExtractRestElementOfArray<Tail<Arr>>;

export type PickFromIndexInDdbArrayForPEType = {
  _val: any;
  _isRest: boolean;
  _isRestElement: boolean;
};
/** Takes an array and an index in the array and determines whether it can confidently say that you will get the element at that index,
 * or if undefined needs to be added to the index access to ensure type safety.
 */
export type PickFromIndexInDdbArrayForPE<Arr extends any[], index extends `${number}`> =
  number extends Arr['length'] & number // check if the array is a tuple. this only evaluates to true if the right side doesn't have a constant length. So pure arrays and rest arrays evaluate to true in this ternary.
  ? (
    keyof Arr & `${number}` extends never // check if the array has any defined indices
    /** noUncheckedIndexedAccess ⬇️ change in the comment below. I don't want to force this option upon anyone, Typescript will do that for them. And, DynamoDB WILL NOT return undefined in the array, because undefined doesn't exist in DynamoDB land */
    ? { _val: Arr[number] /* | undefined */; _isRest: false; _isRestElement: false } // this is a pure array with no rest elements
    : ( // this is an array with rest elements
      keyof Arr & index extends never
      ? ( // we did not index on one of the non-rest elements
        ExtractRestElementOfArray<Arr> extends infer restElement // extract the rest element from the array
        ? restElement extends any[]
        ? { _val: restElement[number]; _isRest: true; _isRestElement: true } // return the type of elements in the rest element
        : never
        : never
      )
      : { _val: Arr[keyof Arr & index]; _isRest: true; _isRestElement: false } // this rest array has defined indices, and the index is one of them
    )
  )
  : (
    keyof Arr & index extends never // check if the tuple has this index
    ? never // if it doesn't, return never
    : { _val: Arr[keyof Arr & index]; _isRest: false; _isRestElement: false } // if it does, return the element
  );

export type MergeRestElementType = {
  _isRestElement: true;
  _val: any; // _val is `never` for rest elements, not `unknown`, which allows us to union the rest element types instead of intersecting them
};
type ResolveTupleOrRestArrays<Keys extends string[], T extends any[]> = {
  [L in keyof Keys]: L extends keyof T ? T[L] extends MergeRestElementType ? T[L]['_val'] : T[L] : never
};
type _ResolveRestElementUnionsInPickedMergedType<PickedType extends Record<any, any>, Shape extends Record<any, any>> = {
  [K in keyof PickedType]:
  PickedType[K] extends infer thePick
  ? (
    thePick extends any[]
    ? (
      number extends thePick['length']
      ? thePick
      : (
        KeysOfTuple<OnlyArrays<NonNullable<Shape>[K]>> extends infer keys
        ? keys extends string[]
        ? RemoveUnknownAndNeverFromSparseArray<ResolveTupleOrRestArrays<keys, thePick>, OnlyArrays<NonNullable<Shape>[K]>> extends (infer removedUnknown extends RemoveUnknownAndNeverFromSparseArrayType)
        ? _ResolveRestElementUnionsInPickedMergedType<removedUnknown['picked'], removedUnknown['shape']>
        : never
        : never
        : never
      )
    )
    : thePick extends string
    ? thePick
    : thePick extends Record<any, any>
    ? _ResolveRestElementUnionsInPickedMergedType<thePick, NonNullable<Shape[K]>>
    : thePick
  )
  : never
};
export type ResolveRestElementUnionsInPickedMergedType<T extends Record<any, any>, Shape extends Record<any, any>> = DeepSimplifyObject<_ResolveRestElementUnionsInPickedMergedType<T, Shape>>;

type RemoveUnknownAndNeverFromSparseArrayType = { picked: any[]; shape: any[] };
type RemoveUnknownAndNeverFromSparseArray<PickedArr extends any[], ShapeArr extends any[]> =
  PickedArr extends []
  ? { picked: []; shape: [] }
  : unknown extends PickedArr[0] // Arr is [unknown, etc...]
  ? (
    RemoveUnknownAndNeverFromSparseArray<Tail<PickedArr>, Tail<ShapeArr>> // continue to recurse
  )
  : PickedArr[0] extends never // Arr is [...never[]]
  ? { picked: []; shape: [] }
  : (
    keyof PickedArr & `${number}` extends never // this will also capture a rest array
    ? (
      { picked: [...(PickedArr[number])[]]; shape: [...(ShapeArr[number])[]] } // but, we know it can't be never because that would have been captured above
    )
    : (
      Tail<PickedArr> extends infer tail // relatively straightforward, we are dealing with tuples again
      ? (
        tail extends any[]
        ? (
          RemoveUnknownAndNeverFromSparseArray<tail, Tail<ShapeArr>> extends infer nextPartToRemove
          ? (
            nextPartToRemove extends RemoveUnknownAndNeverFromSparseArrayType
            ? { picked: [PickedArr[0], ...nextPartToRemove['picked']]; shape: [ShapeArr[0], ...nextPartToRemove['shape']] }
            : never
          )
          : never
        )
        : never
      )
      : never
    )
  );

type CheckIfUndefinedInTuple<T extends any[]> = {
  [K in keyof T & `${number}`]:
  undefined extends T[K] // I don't believe (hopefully) we need to check for any or unknown because those are banned in validate-input-types.ts
  ? 1
  : 0
}[keyof T & `${number}`];
type CheckKeysOfObjectForUndefined<T extends Record<PropertyKey, any>> = {
  [K in keyof T]: IsAnyOrUnknown<T[K]> extends true ? 0 : (undefined extends T[K] ? 0 : 1)
}[keyof T];
type _AddUndefinedToObjectsWithOnlyUndefinedPropertiesAndUnknownToSparseArrays<T extends Record<any, any>> = {
  [K in keyof T]:
  T[K] extends infer tk
  ? tk extends DocumentClient.DynamoDbSet // things are becoming a silly bugger without this check
  ? tk
  : tk extends any[]
  ? (
    tk extends infer arr
    ? OnlyArrays<arr> extends infer onlyArrs
    ? (
      {
        [L in keyof onlyArrs]: onlyArrs[L] extends infer el
        ? el extends Primitive // branded types!
        ? el
        : el extends object
        ? _AddUndefinedToObjectsWithOnlyUndefinedPropertiesAndUnknownToSparseArrays<el>
        : el
        : never
      } extends infer newArray
      ? newArray extends any[]
      ? (
        `${number}` & keyof newArray extends never
        ? newArray
        : (
          1 extends CheckIfUndefinedInTuple<newArray> // if we extend `1`, it means there is at least one _guaranteed_ undefined or optional property in the `{number}` indices of the array, meaning we cannot rely on the length or order of the array anymore
          ? unknown[] | undefined // we still type it as an array, but add undefined as well, because potentially _all_ the elements in the array are undefined, thus making it so the array isn't even returned at all
          : newArray
        )
      )
      : never
      : never
    )
    : NoArrays<arr>
    : never
  )
  : tk extends object
  ? _AddUndefinedToObjectsWithOnlyUndefinedPropertiesAndUnknownToSparseArrays<tk>
  : tk
  : never
} extends infer newMappedType
  ? (
    newMappedType extends Record<PropertyKey, any>
    ? (
      1 extends CheckKeysOfObjectForUndefined<newMappedType> // if we extend `1`, it means there is at least one _guaranteed_ non-undefined or optional property in the object that _will_ be returned from DynamoDB
      ? newMappedType
      : (newMappedType | undefined)
    )
    : never
  )
  : never;

export type AddUndefinedToObjectsWithOnlyUndefinedPropertiesAndUnknownToSparseArrays<T extends Record<PropertyKey, any>> =
  // the reason why we add NoUndefined is because the final object, if it exists, _will_ be returned, it just might be entirely empty if its top level fields are undefined. But, the empty object itself won't be undefined, unless we've added undefined through another mechanism, like we do in GetItemOutput['Item'] or UpdateItemOutput['Attributes']. For this reason, we could in theory ignore it, but it becomes an issue for query, where we don't want to inadvertantely introduce our own noUncheckedIndexAccess equivalent by accident.
  NoUndefined<
    DeepSimplifyObject<_AddUndefinedToObjectsWithOnlyUndefinedPropertiesAndUnknownToSparseArrays<T>>
  >;