import { AnyExpressionAttributeNames, DynamoDBKeyValue, ExpressionAttributeValues } from "../../dynamodb-types";
import { GSIIndexFromValue, ProjectAllIndex, ProjectAttributesIndex, ProjectOnlyKeysIndex } from "../../lib";
import { ProjectProjectionExpression } from "../PE/pe-lib";
import { DeepWriteable } from "../record";
import { DeepSimplifyObject } from "../utils";
import { BeginsWithExtractor, CommonExtractTypeForKCEKey, ExtractKeyFromKCE, NarrowExtractedTypesKeyFieldsToWidenedKeyValues, PickOverAllExtractedQueryTypes, WidenKeyToTypesItExtracted } from "./common";

type ValidateGSIExtractedKey<ExtractedKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>, Index extends GSIIndexFromValue> =
  ExtractKeysOfGSIIndex<Index> extends infer gsiKeys extends string
  ? keyof ExtractedKey extends gsiKeys // validate that the extractedKey has at least one of the fields for the index defined on the table, and no additional fields not on the index, without caring about the values. (At least one, because we could be querying only the hashKey, and no more because if the index doesn't have a sortKey, and the KCE included one by mistake, that's invalid)
  ? (
    // NOTE: we could add that the EAVs were extracted validly, but we do that other places, notably with the AreAllEAVsUsed and in the other direction too, so they should be resolved except in the case of an exceptional bug. Plus, they're just typed as never, so it's not the end of the world, I'd rather leave that not as strict. Plust ddb itself will give us this for free
    // make sure we've only included valid DdbKeyValues in the Key
    ExtractedKey[keyof ExtractedKey] extends DynamoDBKeyValue | BeginsWithExtractor
    ? DeepSimplifyObject<ExtractedKey> // DONE
    : never
  )
  : never
  : never;

/** Take a GSI Index object and extract the values of the 'partitionKey' and optional 'sortKey' fields in the object */
export type ExtractKeysOfGSIIndex<Index extends GSIIndexFromValue> =
  Pick<DeepWriteable<Index>, 'partitionKey' | 'sortKey'> extends infer picked extends Record<string, any>
  ? {
    [K in keyof picked as unknown extends picked[K] ? never : K]: picked[K] // because sortKey is optional, it's value will be unknown if not in the GSI index
  } extends infer keyFiltered extends Record<string, string>
  ? (
    keyFiltered[keyof keyFiltered] // leaving us with keyFiltered as just { partitionKey: string; } or { partitionKey: string; sortKey: string }
  )
  : never
  : never;

type ProjectItemsForGSIQuery<Index extends GSIIndexFromValue, IndexKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>, ExtractedItem extends object, MainTableKeyFields extends string, PE extends string, EAN extends AnyExpressionAttributeNames> =
  (
    WidenKeyToTypesItExtracted<IndexKey, ExtractedItem> extends infer wk extends Record<string, DynamoDBKeyValue>
    ? (
      Index extends ProjectAllIndex // if the index type projects all, we can operate on the full item
      ? DeepSimplifyObject<
        NarrowExtractedTypesKeyFieldsToWidenedKeyValues<ExtractedItem, wk>
      >
      : (
        Index extends ProjectOnlyKeysIndex
        ? (
          DeepSimplifyObject< // if the index type projects only keys, we can only operate on the main table keys and the index key
            NarrowExtractedTypesKeyFieldsToWidenedKeyValues<PickOverAllExtractedQueryTypes<ExtractedItem, ExtractKeysOfGSIIndex<Index> | MainTableKeyFields>, wk>
          >
        )
        : (
          Index extends ProjectAttributesIndex
          ?
          DeepSimplifyObject< // if the index type projects certain attributes, we can only operate on the main table keys, the index key, and those certain projected attributes
            NarrowExtractedTypesKeyFieldsToWidenedKeyValues<PickOverAllExtractedQueryTypes<ExtractedItem, ExtractKeysOfGSIIndex<Index> | MainTableKeyFields | Index['attributes'][number]>, wk>
          >
          : never
        )
      )
    )
    : never
  ) extends (infer narrowedItemByIndexType extends object)
  ? (
    string extends PE // PE was not provided if string is assignable to PE
    ? narrowedItemByIndexType
    : (
      // more distributive conditional fun!
      narrowedItemByIndexType extends object
      ? ProjectProjectionExpression<narrowedItemByIndexType, PE, EAN>
      : never
    )
  )
  : never;

export type ProjectGSIQuery<KCE extends string, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues, TableIndex extends GSIIndexFromValue, TableItem extends object, MainTableKeyFields extends string, PE extends string> =
  ExtractKeyFromKCE<KCE, EAN, EAV, TableIndex['partitionKey']> extends (infer indexKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>) // get the index key
  ? (
    ValidateGSIExtractedKey<indexKey, TableIndex> extends (infer validatedKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>)
    ? (
      CommonExtractTypeForKCEKey<TableItem, validatedKey> extends (infer extractedItem extends object) // extract the type of item that would be matched by that index key
      ? (
        ProjectItemsForGSIQuery<TableIndex, validatedKey, extractedItem, MainTableKeyFields, PE, EAN> // narrow it according to the projected expression and index projection type (all, keys-only, or attributes)
      )
      : never
    )
    : never
  )
  : never;