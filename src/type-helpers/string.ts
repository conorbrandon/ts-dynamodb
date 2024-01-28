import { Tail } from "./record";

/** Takes a string Str and trims the Separator string from Str. 
 * The accumulator is optional by the caller and most likely should not be supplied, but required for inner recursion.
*/
export type Trim<Str extends string, Separator extends string = ' ', Acc extends string = ''> =
  (Str extends `${infer Char}${infer Rest}`
    ? (Char extends Separator
      ? Trim<Rest, Separator, Acc>
      : Trim<Rest, Separator, `${Acc}${Char}`>)
    : (Str extends ''
      ? Acc
      : never)
  );

/** Takes a string and produces an array of the string split on the D=delimeter.
 * For ex, take "obj, item" and produce ["obj", " item"]
 */
export type Split<S extends string, D extends string = " ", Acc extends string[] = []> =
  string extends S
  ? [...Acc, ...string[]]
  : S extends ''
  ? Acc
  : S extends `${infer Start}${D}${infer Rest}`
  ? (
    Split<Rest, D, [...Acc, Start]>
  )
  : [...Acc, S];
/** Takes a union of strings and applies Split to each string in the union,
 * producing a union of string arrays.
 */
export type UnionSplitter<S, D extends string = " "> = S extends string ? Split<S, D> : never;
/** Applies Split to each string in each array in a union of string arrays. */
export type UnionArraySplitter<S extends any[], Separator extends string = " "> = S extends string[] ? { [K in keyof S]: Split<S[K], Separator> } : never;

/** Note: intentionally does _not_ join empty strings with `Sep`!!! */
export type Join<Arr extends string[], Sep extends string = ".", Acc extends string = ''> =
  Arr extends [infer S extends string, ...infer Rest extends string[]]
  ? Join<Rest, Sep, `${Acc}${S}${S extends "" ? "" : Rest extends [] ? "" : Sep}`>
  : Acc;

// https://stackoverflow.com/questions/72193378/replace-parts-of-literal-string-with-values-from-object
export type StringReplaceAll<Str extends string, M extends { [k: string]: string }, Acc extends string = ""> =
  Str extends `${Extract<keyof M, string>}${infer Rest}` ? (
    Str extends `${infer K}${Rest}` ? // assign a type parameter to the extracted part from the previous step
    StringReplaceAll<Rest, M, `${Acc}${M[Extract<K, keyof M>]}`>
    : never
  ) : Str extends `${infer F}${infer R}` ? StringReplaceAll<R, M, `${Acc}${F}`> : Acc;

/** Uses a string[] to continually create new nested objects until the there aren't any elements left, setting the final property name to end value
 * Supports creating an array if one of the strings has an index access on it, but does not put the index in the correct place (only creates a tuple of length 1)
 */
export type CreateNestedObjectUsingStringArray<Keys extends string[], EndValue> =
  Keys extends []
  ? EndValue
  : Keys[0] extends (infer Key extends string)
  ? (
    Key extends `[${number}]`
    ? [CreateNestedObjectUsingStringArray<Tail<Keys>, EndValue>]
    : {
      [k in Key]: CreateNestedObjectUsingStringArray<Tail<Keys>, EndValue>
    }
  )
  : never;

/** This is meant to be used WITH NestedPickForUE! It assumes any arrays in T are of length 1.
 * Take a type and a string[] and attempts to keep traversing into it until 
 * either the path is invalid, or the path runs out of elements, returning the final type 
 */
export type DrillIntoTypeUsingStrArray<T extends object, Keys extends string[]> = (
  Keys[0] extends `[${number}]` // check if this is an index access
  ? (
    T extends any[] // if so, T must be an array so we can index it
    ? T[0] extends infer tElement
    ? (
      Tail<Keys> extends [] // if we've exhausted the keys, be done
      ? tElement
      : ( // if we haven't exhausted the keys, the next T to drill into must be an object or an array
        tElement extends object
        ? (
          DrillIntoTypeUsingStrArray<tElement, Tail<Keys>>
        )
        : never // there were more keys, but the next T is not an object
      )
    )
    : never // fallback for index access inference
    : never // we cannot index into non-arrays
  )
  : (
    Keys[0] extends keyof T // check if we can key into T using Keys[0]
    ? T[Keys[0]] extends infer tk // if we can, get the value at Keys[0]
    ? (
      Tail<Keys> extends [] // if we've exhausted the keys, be done
      ? tk
      : (
        tk extends object // if we haven't exhausted the keys, the next T to drill into must be an object or an array
        ? (
          DrillIntoTypeUsingStrArray<tk, Tail<Keys>>
        )
        : never // there were more keys, but the next T is not an object
      )
    )
    : never // fallback for value access inference
    : never // error for when we can't key into T using Keys[0]
  )
);