import { PickFromIndexInDdbArrayForPE, PickFromIndexInDdbArrayForPEType } from "../PE/non-accumulator-pick-helpers";
import { Tail } from "../record";
import { IsAnyOrUnknown, IsNumberRecord, IsStringRecord } from "../utils";


export type NestedPickForUE<T extends Record<any, any>, Keys extends string[], AddUndefinedToIndexAccess extends undefined> =
  Keys extends []
  ? T
  : IsAnyOrUnknown<T> extends true // SHORT CIRCUIT for any or unknown
  ? T
  : (
    IsStringRecord<T> extends true
    ? {
      [K in Keys[0]]: NestedPickForUE<T[K], Tail<Keys>, AddUndefinedToIndexAccess> | AddUndefinedToIndexAccess
    }
    : (
      IsNumberRecord<T> extends true
      ? {
        [K in Keys[0] & `${number}`]: NestedPickForUE<T[K], Tail<Keys>, AddUndefinedToIndexAccess> | AddUndefinedToIndexAccess
      }
      : (
        T extends object
        ? (
          Keys[0] extends `[${infer index extends `${number}`}]`
          ? (
            T extends any[]
            ? (
              PickFromIndexInDdbArrayForPE<T, index> extends (infer pickedIndex extends PickFromIndexInDdbArrayForPEType)
              ? (
                (Tail<Keys> extends [] ? pickedIndex['_val'] : NestedPickForUE<pickedIndex['_val'], Tail<Keys>, AddUndefinedToIndexAccess>) extends infer PickedIndexVal
                ? (
                  [
                    PickedIndexVal
                    | (true extends pickedIndex['_isRestElement'] ? AddUndefinedToIndexAccess : never)
                    | (keyof T & `${number}` extends never ? AddUndefinedToIndexAccess : never)
                  ]
                )
                : never
              )
              : never
            )
            : never
          )
          : (
            {
              [K in Extract<keyof T, Keys[0]>]: NestedPickForUE<T[K], Tail<Keys>, AddUndefinedToIndexAccess>
            }
          )
        )
        : (
          Keys extends []
          ? T
          : never
        ) | (undefined extends T ? undefined : never)
      )
    )
  );