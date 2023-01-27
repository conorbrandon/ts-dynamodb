import { PickFromIndexInDdbArrayForPE, PickFromIndexInDdbArrayForPEType } from "../PE/non-accumulator-pick-helpers";
import { Tail } from "../record";

export type NestedPickForUE<T extends Record<any, any>, Keys extends string[]> =
  Keys extends []
  ? T
  : (
    T extends object
    ? (
      Keys[0] extends `[${infer index extends `${number}`}]`
      ? (
        T extends any[]
        ? (
          PickFromIndexInDdbArrayForPE<T, index> extends (infer pickedIndex extends PickFromIndexInDdbArrayForPEType)
          ? (
            (Tail<Keys> extends [] ? pickedIndex['_val'] : NestedPickForUE<pickedIndex['_val'], Tail<Keys>>) extends infer PickedIndexVal
            ? (
              [
                PickedIndexVal
                | (true extends pickedIndex['_isRestElement'] ? undefined : never)
                | (keyof T & `${number}` extends never ? undefined : never)
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
          [K in Extract<keyof T, Keys[0]>]: NestedPickForUE<T[K], Tail<Keys>>
        }
      )
    )
    : (
      Keys extends []
      ? T
      : never
    ) | (undefined extends T ? undefined : never)
  );