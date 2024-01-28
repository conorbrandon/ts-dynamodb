import { DynamoDBKeyValue } from "../../dynamodb-types";
import { LSIIndexFromValue, ProjectAllIndex, ProjectAttributesIndex, ProjectOnlyKeysIndex } from "../../lib";
import { ProjectProjectionExpressionStruct } from "../PE2/pe-lib";
import { DeepSimplifyObject, IsNever } from "../utils";
import { BeginsWithExtractor, CommonExtractTypeForKCEKey, ExtractKeyFromKCE, NarrowExtractedTypesKeyFieldsToWidenedKeyValues, PickOverAllExtractedQueryTypes, PickOverTypesForQueryKey, WidenKeyToTypesItExtracted } from "./common";

type ValidateLSIExtractedKey<ExtractedKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>, Index extends LSIIndexFromValue, PartitionKeyField extends string> =
  ExtractSortKeyOfLSIIndex<Index> extends infer lsiKey extends string
  ? keyof ExtractedKey extends (lsiKey | PartitionKeyField) // remember, we may just be querying the LSI index without the sortKey to only get the ProjectedAttributes, or whatnot
  ? (
    ExtractedKey[keyof ExtractedKey] extends DynamoDBKeyValue | BeginsWithExtractor
    ? DeepSimplifyObject<ExtractedKey>
    : never
  )
  : never
  : never;

export type ExtractSortKeyOfLSIIndex<Index extends LSIIndexFromValue> = Index['sortKey'];
export type GetLSIIndexKeyTypes<Index extends LSIIndexFromValue, PartitionKey extends string, AllTypesForTable extends object> =
  PickOverTypesForQueryKey<AllTypesForTable, { partitionKey: PartitionKey; sortKey: Index['sortKey'] }>;

type ProjectItemsForLSIQuery<Index extends LSIIndexFromValue, IndexKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>, ExtractedItem extends object, MainTableKeyFields extends string, PE extends string, EAN extends Record<string, string>> =
  WidenKeyToTypesItExtracted<IndexKey, ExtractedItem> extends infer wk extends Record<string, DynamoDBKeyValue>
  ? (
    string extends PE // PE was not provided
    ? (
      Index extends ProjectAllIndex
      ? DeepSimplifyObject<
        NarrowExtractedTypesKeyFieldsToWidenedKeyValues<ExtractedItem, wk>
      >
      : (
        Index extends ProjectOnlyKeysIndex
        ? (
          DeepSimplifyObject<
            NarrowExtractedTypesKeyFieldsToWidenedKeyValues<PickOverAllExtractedQueryTypes<ExtractedItem, ExtractSortKeyOfLSIIndex<Index> | MainTableKeyFields>, wk>
          >
        )
        : (
          Index extends ProjectAttributesIndex
          ? (
            DeepSimplifyObject<
              NarrowExtractedTypesKeyFieldsToWidenedKeyValues<PickOverAllExtractedQueryTypes<ExtractedItem, ExtractSortKeyOfLSIIndex<Index> | MainTableKeyFields | Index['attributes'][number]>, wk>
            >
          )
          : never
        )
      )
    )
    : (
      // when a PE is provided, it will do a Projection on the entire object
      // more distributive conditional fun!
      ExtractedItem extends object
      ? ProjectProjectionExpressionStruct<NarrowExtractedTypesKeyFieldsToWidenedKeyValues<ExtractedItem, wk>, PE, EAN>
      : never
    )
  )
  : never;

export type ProjectLSIQuery<KCE extends string, EAN extends Record<string, string>, EAV extends Record<string, unknown>, TableIndex extends LSIIndexFromValue, TableItem extends object, PartitionKeyField extends string, SortKeyField extends string, PE extends string, QueryKey extends Record<string, DynamoDBKeyValue> = never> =
  (IsNever<QueryKey> extends true ? ExtractKeyFromKCE<KCE, EAN, EAV, PartitionKeyField> : QueryKey) extends (infer indexKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>) // get the index key
  ? (
    ValidateLSIExtractedKey<indexKey, TableIndex, PartitionKeyField> extends (infer validatedKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>)
    ? (
      CommonExtractTypeForKCEKey<TableItem, validatedKey> extends (infer extractedItem extends object)
      ? (
        ProjectItemsForLSIQuery<TableIndex, validatedKey, extractedItem, PartitionKeyField | SortKeyField, PE, EAN>
      )
      : never
    )
    : never
  )
  : never;
