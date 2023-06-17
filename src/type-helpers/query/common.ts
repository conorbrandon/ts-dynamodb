import { AnyExpressionAttributeNames, DynamoDBKeyValue, ExpressionAttributeValues } from "../../dynamodb-types";
import { GSIIndexFromValue, IndexFromValue, LSIIndexFromValue } from "../../lib";
import { ProjectProjectionExpressionStruct } from "../PE2/pe-lib";
import { UnionToIntersection } from "../record";
import { TSDdbSet } from "../sets/utils";
import { Join, Split, StringReplaceAll, Trim } from "../string";
import { ArrayContainsNever, DeepSimplifyObject, IsNever, NarrowerExtract, NoUndefined } from "../utils";
import { ProjectGSIQuery } from "./gsi-lib";
import { ProjectLSIQuery } from "./lsi-lib";

/** Take a key name in the KCE and map it to the EAN name if it is an EAN, otherwise leave it alone */
type ExtractKeyConditionFieldFromEANs<Field extends string, EAN extends AnyExpressionAttributeNames> =
  Field extends `#${string}`
  ? EAN[Field]
  : Field;
/** Index into the EAVs to get the one at Field, if it exists */
type ExtractKeyConditionFieldFromEAVs<Field extends string, EAV extends ExpressionAttributeValues> = Field extends keyof EAV ? EAV[Field] : never;

/** Replace newlines, tabs, and 'and' with 'AND' and 'between' with 'BETWEEN' in a KCE for consistency */
type KCEKeywords = 'AND' | 'BETWEEN';
/** NOTE: ONLY EXPORTED FOR TESTS */
export type CleanKCE<KCE extends string> = WalkThroughUppercaseKCEKeywords<StringReplaceAll<StringReplaceAll<KCE, { '\n': ' '; '\t': ' '; '\r': '' }>, { '#': ' #'; ':': ' :' }>>;
type WalkThroughUppercaseKCEKeywords<Str extends string, Acc extends string = ''> =
  Str extends `${string} ${infer Rest}`
  ? (
    Str extends `${infer Start}${Rest}`
    ? (
      Uppercase<Start> extends `${KCEKeywords} ${string}`
      ? WalkThroughUppercaseKCEKeywords<Rest, `${Acc}${Uppercase<Start>}`>
      : WalkThroughUppercaseKCEKeywords<Rest, `${Acc}${Start}`>
    )
    : never
  )
  : `${Acc}${Str}`;

// NOTE: these are all strings because a separate step will widen comparisons, check that both between values are the same type, or create a template literal string for begins_with
type StrictEquals = {
  type: 'equals';
  path: string;
  eav: string;
};
type KCComparatorsExc = '<' | '>';
type KCComparatorsInc = '<=' | '>=';
type LooseComparison = {
  type: 'comparision';
  path: string;
  eav: string;
};
type Between = {
  type: 'between';
  path: string;
  eav1: string;
  eav2: string;
};
type BeginsWith = {
  type: 'begins_with';
  path: string;
  eav: string;
};
type KCStructs = StrictEquals | LooseComparison | Between | BeginsWith;

type DeterminedPathVsEAV = { path: string; eav: string };
/** Since the :eav and the path can come in either order in KC = and comparators, we must parse the split tuple to determine which is which */
type DeterminePathVsEAV<Tup extends [string, string]> =
  Tup[0] extends `:${string}`
  ? { path: Tup[1]; eav: Tup[0] }
  : Tup[1] extends `:${string}`
  ? { path: Tup[0]; eav: Tup[1] }
  : never;

/** 
 * Create a structure that represents the key condition we can parse to determine the value of the field in the key.
 * The order in which we do these operations is important. For example, `a <= b` will get picked up by `<`, so we must check for `<=` before `<`.
 */
type SplitKeyConditionOnOperator<KC extends string> =
  KC extends `${string}${KCComparatorsInc}${string}`
  ? (
    Split<Trim<KC>, KCComparatorsInc> extends [infer left extends string, infer right extends string]
    ? DeterminePathVsEAV<[left, right]> extends infer determined extends DeterminedPathVsEAV
    ? { type: 'comparision'; path: determined['path']; eav: determined['eav'] }
    : never
    : never
  )
  : (
    KC extends `${string}${KCComparatorsExc}${string}`
    ? (
      Split<Trim<KC>, KCComparatorsExc> extends [infer left extends string, infer right extends string]
      ? DeterminePathVsEAV<[left, right]> extends infer determined extends DeterminedPathVsEAV
      ? { type: 'comparision'; path: determined['path']; eav: determined['eav'] }
      : never
      : never
    )
    : (
      KC extends `${string}=${string}`
      ? (
        Split<Trim<KC>, '='> extends [infer left extends string, infer right extends string]
        ? DeterminePathVsEAV<[left, right]> extends infer determined extends DeterminedPathVsEAV
        ? { type: 'equals'; path: determined['path']; eav: determined['eav'] }
        : never
        : never
      )
      : (
        KC extends `${string}BETWEEN${string}`
        ? (
          Split<KC, 'BETWEEN'> extends [infer path extends string, infer eav extends string]
          ? Split<eav, 'AND'> extends [infer eav1 extends string, infer eav2 extends string]
          ? { type: 'between'; path: Trim<path>; eav1: Trim<eav1>; eav2: Trim<eav2> }
          : never
          : never
        )
        : (
          KC extends `${string}begins_with${string}`
          ? Split<Trim<StringReplaceAll<KC, { "begins_with": ''; '(': ''; ')': '' }>>, ','> extends [infer path extends string, infer eav extends string]
          ? { type: 'begins_with'; path: path; eav: eav }
          : never
          : (
            never // ERROR
          )
        )
      )
    )
  );

/** 
 * Widen the values of an IndexKey, to be used to with `NarrowExtractedTypesKeyFieldsToWidenedKeyValues` and the extracted item to make the index key fields required (they have to be required to be picked up by a query).
 * This will also "extract" from unions the actual member that made the type extraction possible. For example, say we're dealing with a field that's indexed: role, which can be 'user' | 'admin'. 
 * If we KCE on #role = :user ('user'), we will extract the correct type, but the type will still have role = 'user' | 'admin'. We can use the resulting type from this with `NarrowExtractedTypesKeyFieldsToWidenedKeyValues` and the table type to have the table type only retain the 'user' member of the union.
 * This is a convenience feature, not strictly necessary, but a nice quality of life improvement. 
 */
export type WidenKeyToTypesItExtracted<Key extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>, T extends object> = {
  [K in keyof Key]:
  (Key[K] extends BeginsWithExtractor ? Key[K]['begins_with_extractor'] : Key[K]) extends infer tkey
  ? (
    K extends keyof T // just a formality
    ? NarrowerExtract<tkey, T[K]>
    : never
  )
  : never;
};
/**
 * For use with `WidenKeyToTypesItExtracted`. Instead of intersecting the Key with the table types, this results in cleaner types.
 */
export type NarrowExtractedTypesKeyFieldsToWidenedKeyValues<Types extends object, WidenedKey extends Record<string, DynamoDBKeyValue>> =
  Types extends object
  ? (
    Pick<Types, Exclude<keyof Types, keyof WidenedKey>> & {
      [K in Extract<keyof Types, keyof WidenedKey>]-?: // important! because we are no longer intersecting, we should make sure we -? the optionality
      Types[K] extends infer tk
      ? tk extends WidenedKey[K] // this step is to filter out of the types the union members at the key that aren't found in the key
      ? tk // however, we don't need to add NoUndefined here unnecessarily because undefined will get filtered out into the never branch below this (we know the values in WidenedKey CANNOT be undefined, that would have been rejected upstream)
      : never
      : never
    }
  )
  : never;

export type BeginsWithExtractor = { begins_with_extractor: string };

type ResolveKCStruct<KCStruct extends KCStructs, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues, PartitionKeyField extends string> =
  ExtractKeyConditionFieldFromEANs<KCStruct['path'], EAN> extends infer kCKeyPath extends string
  ? (
    KCStruct extends StrictEquals
    ? (
      { [K in kCKeyPath]: ExtractKeyConditionFieldFromEAVs<KCStruct['eav'], EAV> }
    ) : (
      kCKeyPath extends PartitionKeyField // everything below this can only operate on a sortKey for the index
      ? never
      : (
        KCStruct extends LooseComparison
        ? (
          { [K in kCKeyPath]: ExtractKeyConditionFieldFromEAVs<KCStruct['eav'], EAV> }
        )
        : (
          KCStruct extends Between
          ? (
            {
              // by making eav1 | eav2 a union, we can extract more types. Unless someone passes wack conflicting binary types, both union members should be either string | string, number | number, and _hopefully_ like-kind binary | binary types. They have to either BOTH be string, number, or binary, because an IndexKey must be defined as being of a certain type (they're not loosey goosey like regular Attributes).
              [K in kCKeyPath]:
              (ExtractKeyConditionFieldFromEAVs<KCStruct['eav1'], EAV> extends infer right1Val extends DynamoDBKeyValue ? right1Val : never) extends infer eav1
              ? (ExtractKeyConditionFieldFromEAVs<KCStruct['eav2'], EAV> extends infer right2Val extends DynamoDBKeyValue ? right2Val : never) extends infer eav2
              ? eav1 | eav2
              : never
              : never
            }
          )
          : (
            KCStruct extends BeginsWith
            ? (
              {
                [K in kCKeyPath]:
                ExtractKeyConditionFieldFromEAVs<KCStruct['eav'], EAV> extends infer rightVal extends string
                ? { begins_with_extractor: rightVal }
                : never
              }
            )
            : (
              never // ERROR
            )
          )
        )
      )
    )
  )
  : never;

/** 
 * We need to do this because BETWEEN includes an AND in it, unfortunately. Argh.
 * It is pretty naive logic, but it should do the trick. Supports both the partiontionKey coming first in the kC or the sortKey coming first in the KC
 */
type ReconstructSplitKC<SplitKC extends string[]> =
  SplitKC extends [string] // we don't have a sortKey in the KCE
  ? SplitKC
  : SplitKC extends [string, string] // we don't have a BETWEEN operator in the KCE, we can return it as is
  ? SplitKC
  : (
    SplitKC extends [string, string, string]
    ? (
      SplitKC[0] extends `${string}BETWEEN${string}`
      ? [Join<[SplitKC[0], SplitKC[1]], ' AND '>, SplitKC[2]]
      : (
        SplitKC[1] extends `${string}BETWEEN${string}`
        ? [SplitKC[0], Join<[SplitKC[1], SplitKC[2]], ' AND '>]
        : never
      )
    )
    : never
  );

/** Take a KCE and create the type of the Key is represents */
export type ExtractKeyFromKCE<KCE extends string, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues, PartitionKeyFieldForIndex extends string> =
  ReconstructSplitKC<Split<CleanKCE<KCE>, 'AND'>> extends (infer splitAND extends string[])
  ? (
    {
      [K in keyof splitAND]: SplitKeyConditionOnOperator<splitAND[K]> extends infer kcStruct extends KCStructs
      ? (
        ResolveKCStruct<kcStruct, EAN, EAV, PartitionKeyFieldForIndex> extends infer resolved
        ? (
          {} extends resolved ? never : resolved // an empty object occurs when the `path` in a KC struct resolved to never. This can happen if no :eav is in a key condition (see DeterminePathVsEAV)
        ) : never
      )
      : never
    } extends infer objTupleOfKC extends object[]
    ? (
      ArrayContainsNever<objTupleOfKC> extends true
      ? never
      : UnionToIntersection<objTupleOfKC[number]> extends (infer extractedKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>)
      ? DeepSimplifyObject<extractedKey>
      : never
    )
    : never
  )
  : never;

type StartsWithForBeginsWithExtractor<ExtractedS extends string, Pre extends string> =
  string extends ExtractedS // special condition to accomodate the primitive `string` type, only string extends string
  ? true
  : (
    Pre extends ExtractedS // this will capture something like `id_8` extends `id_${number}`
    ? true
    : (
      ExtractedS extends string // can't hurt (I think...) to distribute ExtractedS
      ? ExtractedS extends `${Pre}${string}` // this will capture exact matches on template literals, and something like `id_${number}` extends `id_${string}` where `id_` is the :eav in the KCE (i.e. Pre) (this is provided for maximum flexibility in using begins_with, I'm not sure if there are other checks I can add to make it even more flexible). And probably other stuff, but is absolutely not exhaustive and will miss some things
      ? true
      : never
      : never
    )
  );
/** Initially extract only types that fit the BeginsWithExtractor constraint, then feed back into CommonExtractTypeForKCEKey without the BeginsWithExtractorKey */
type FilterForBeginsWithExtractor<AllTypesForTable extends object, HasBeginsWithKey extends Record<string, BeginsWithExtractor>, NoBeginsWithKey extends Record<string, DynamoDBKeyValue>> =
  AllTypesForTable extends object
  ? (
    keyof HasBeginsWithKey extends keyof AllTypesForTable
    ? (
      NoUndefined<AllTypesForTable[keyof HasBeginsWithKey]> extends string
      ? (
        IsNever<StartsWithForBeginsWithExtractor<NoUndefined<AllTypesForTable[keyof HasBeginsWithKey]>, HasBeginsWithKey[keyof HasBeginsWithKey]['begins_with_extractor']>> extends true
        ? never
        : CommonExtractTypeForKCEKey<AllTypesForTable, NoBeginsWithKey>
      )
      : never
    )
    : never
  )
  : never;

export type OnlyBeginsWithExtractor<Key extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>> =
  {
    [K in keyof Key as Key[K] extends BeginsWithExtractor ? K : never]: Key[K]
  };
export type NoBeginsWithExtractor<Key extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>> =
  {
    [K in keyof Key as Key[K] extends BeginsWithExtractor ? never : K]: Key[K]
  };


/** Take an extracted Key of a KCE and find the type(s) in the TypesUnion of the table that include the Key (with correct values also) */
export type CommonExtractTypeForKCEKey<AllTypesForTable extends object, Key extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>> =
  OnlyBeginsWithExtractor<Key> extends infer hasBeginsWithKeys extends Record<string, BeginsWithExtractor>
  ? {} extends hasBeginsWithKeys
  ? (
    AllTypesForTable extends object // distributive conditional types ftw
    ? (
      keyof Key extends keyof AllTypesForTable // give TS 'permission' to pick from T the fields in the Key
      ? (
        Key extends Pick<AllTypesForTable, keyof Key> // make sure the values in Key extend the type of the values in the pick (I have confirmed this works for optional properties, phew!)
        ? TSDdbSet<AllTypesForTable>
        : never
      )
      : never
    )
    : never
  )
  : FilterForBeginsWithExtractor<AllTypesForTable, hasBeginsWithKeys, NoBeginsWithExtractor<Key> extends infer noBeginsWithKey extends Record<string, DynamoDBKeyValue> ? noBeginsWithKey : never>
  : never;

/** @param {QueryKey} - the pre-computed object key of the query, if any */
export type ProjectQuery<KCE extends string, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues, TableIndex extends IndexFromValue, TableItem extends object, PartitionKeyField extends string, SortKeyField extends string, PE extends string, QueryKey extends Record<string, DynamoDBKeyValue> = never> =
  TableIndex extends GSIIndexFromValue
  ? ProjectGSIQuery<KCE, EAN, EAV, TableIndex, TableItem, PartitionKeyField | SortKeyField, PE, QueryKey>
  : (
    TableIndex extends LSIIndexFromValue
    ? ProjectLSIQuery<KCE, EAN, EAV, TableIndex, TableItem, PartitionKeyField, SortKeyField, PE, QueryKey>
    : (
      never
    )
  );

// TODO: can widen and extract here?
/** @param {QueryKey} - the pre-computed object key of the query, if any */
export type ProjectNonIndexQuery<KCE extends string, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues, PartitionKeyField extends string, SortKeyField extends string, TableItem extends object, PE extends string, QueryKey extends Record<string, DynamoDBKeyValue> = never> =
  (IsNever<QueryKey> extends true ? ExtractKeyFromKCE<KCE, EAN, EAV, PartitionKeyField> : QueryKey) extends (infer indexKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>) // get the index key
  ? (
    keyof indexKey extends (PartitionKeyField | SortKeyField)
    ? (
      CommonExtractTypeForKCEKey<TableItem, indexKey> extends infer typesFromQuery
      ? (
        string extends PE
        ? typesFromQuery
        : (
          typesFromQuery extends object // again, distributive conditional
          ? ProjectProjectionExpressionStruct<typesFromQuery, PE, EAN>
          : never
        )
      )
      : never
    )
    : never
  )
  : never;

/** Because the extracted query types could be a union, we have to use distributive conditional types, and then only pick the fields from each type that exist on that type */
export type PickOverAllExtractedQueryTypes<TypeUnion extends object, FieldsOnIndex extends string> =
  TypeUnion extends object
  ? (
    Pick<TypeUnion, Extract<FieldsOnIndex, keyof TypeUnion>>
  )
  : never;
export type PickOverTypesForQueryKey<TypeUnion extends object, IndexKeyNames extends { partitionKey: string } | { partitionKey: string; sortKey: string }> =
  TypeUnion extends object
  ? (
    IndexKeyNames['partitionKey'] extends keyof TypeUnion // an Item has to have at minimum the partitionKey of a GSI index to be able be queried
    ? (
      Required<
        Pick<TypeUnion, IndexKeyNames['partitionKey']>
      > & (
        IndexKeyNames extends { sortKey: string }
        ? (
          IndexKeyNames['sortKey'] extends keyof TypeUnion
          ? Partial<Pick<TypeUnion, IndexKeyNames['sortKey']>>
          : {
            [K in IndexKeyNames['sortKey']]?: never // make sure to Exclusify the union for proper excess property checking
          }
        )
        : unknown
      )
    )
    : never
  )
  : never;