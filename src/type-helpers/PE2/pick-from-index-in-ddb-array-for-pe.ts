import { Tail } from "../record";

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