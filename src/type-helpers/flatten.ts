import { Tail } from "./record";

/**
 * Determine if calling `Tail` on `Arr` will produce the same array, i.e. will infinitely recurse.
 */
type WillTailOfArrayProduceIdentity<Arr extends any[]> =
  number extends Arr['length'] // is tuple? Tuples have fixed lengths
  ? (
    keyof Arr & `${number}` extends never // is a rest array with defined starting indices? If there are defined indices, calling `Tail` is a safe operation.
    ? true
    : false
  )
  : false;

/**
 * Recurse into an array, extracting all the primitive types.
 * 
 * Examples:
 * 1. `ExtractElementTypesInArray<string[][]> = string`
 * 2. `ExtractElementTypesInArray<[string[], boolean?, ...null[]]> = string | boolean | null | undefined`
 */
type ExtractElementTypesInArray<Arr extends any[]> =
  Arr[number] extends infer elements
  ? elements extends any[]
  ? ExtractElementTypesInArray<Arr[number]>
  : elements
  : never;

/**
 * Recursively flatten an array.
 * 
 * Examples:
 * 1. `Flatten<string[][]> = string[]`
 * 2. `Flatten<[string[], number[], null[]]> = (string | number | null)[]`
 */
export type Flatten<Arr extends any[]> =
  Arr extends []
  ? []
  : (
    true extends WillTailOfArrayProduceIdentity<Arr>
    ? ExtractElementTypesInArray<Arr>[]
    : (
      Flatten<Tail<Arr>> extends infer tailFlatten extends any[]
      ? (
        Arr[0] extends any[]
        ? (
          Flatten<Arr[0]> extends (infer zeroFlatten extends any[])
          ? [...zeroFlatten, ...tailFlatten]
          : never
        )
        : (
          [Arr[0], ...tailFlatten]
        )
      )
      : never
    )
  );