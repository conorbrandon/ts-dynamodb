import { AnyExpressionAttributeNames } from "../../dynamodb-types";
import { Flatten } from "../flatten";
import { Tail } from "../record";
import { Split, UnionArraySplitter } from "../string";

/** Takes an array that represents a document path in a UE and replace any EANs with their mapped value */
type MapDocPathPropsToEAN<Props, EAN extends Record<string, string>> =
  Props extends string[]
  ? {
    [K in keyof Props]:
    Props[K] extends `#${infer prop}[${infer index}]`
    ? index extends `${number}` ? `${EAN[`#${prop}` & keyof EAN]}[${index}]` : never
    : Props[K] extends `#${string}`
    ? EAN[Props[K] & keyof EAN]
    : Props[K]
  }
  : never;
export type MapArrayOfDocPathPropsToEAN<Props extends string[][], EAN extends AnyExpressionAttributeNames> =
  Props extends []
  ? []
  : (
    Tail<Props> extends infer tail
    ? tail extends string[][]
    ? MapArrayOfDocPathPropsToEAN<tail, EAN> extends infer mapped
    ? mapped extends string[][]
    ? [MapDocPathPropsToEAN<Props[0], EAN>, ...mapped]
    : never
    : never
    : never
    : never
  );
type ExtractIndexAccessFromPE<Parts extends string[][]> =
  Parts extends []
  ? []
  : Parts[0] extends (infer firstParts extends string[])
  ? (
    {
      [K in keyof firstParts]: Split<firstParts[K], "[">
    } extends (infer firstPartSplit extends string[][])
    ? Flatten<firstPartSplit> extends (infer flattened extends string[])
    ? ExtractIndexAccessFromPE<Tail<Parts>> extends (infer tailIndices extends any[])
    ? (
      {
        [L in keyof flattened]: flattened[L] extends `${string}]` ? `[${flattened[L]}` : flattened[L]
      } extends (infer joined extends string[])
      ? [joined, ...tailIndices]
      : never
    )
    : never
    : never
    : never
  ) :
  never;

/** Take a full projection expression and parse out all the doc paths to get */
export type ParsePEToPropPickNestedArray<PE extends string, EAN extends AnyExpressionAttributeNames> =
  MapArrayOfDocPathPropsToEAN<
    ExtractIndexAccessFromPE<
      UnionArraySplitter<
        Split<PE, ",">
        , ".">
    >
    , EAN>;

/** Takes a SINGLE doc path, may have EANs in it, and create an array out of the doc path using the EANs. Parses only ONE DocPath!!!
 * General purpose function to be used anywhere, i.e. for UEs, etc...
 */
export type CreatePropPickArrayFromDocPath<DocPath extends string, EAN extends AnyExpressionAttributeNames> = ParsePEToPropPickNestedArray<DocPath, EAN> extends (infer singleDocPath extends [string[]]) ? singleDocPath[0] : never;