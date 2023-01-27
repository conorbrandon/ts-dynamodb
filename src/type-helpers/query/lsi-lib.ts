import { AnyExpressionAttributeNames, DynamoDBKeyValue, ExpressionAttributeValues } from "../../dynamodb-types";
import { LSIIndexFromValue, ProjectAllIndex, ProjectAttributesIndex, ProjectOnlyKeysIndex } from "../../lib";
import { ProjectProjectionExpression } from "../PE/pe-lib";
import { DeepSimplifyObject } from "../utils";
import { BeginsWithExtractor, CommonExtractTypeForKCEKey, ExtractKeyFromKCE, NarrowExtractedTypesKeyFieldsToWidenedKeyValues, PickOverAllExtractedQueryTypes, WidenKeyToTypesItExtracted } from "./common";

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

export type ProjectItemsForLSIQuery<Index extends LSIIndexFromValue, IndexKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>, ExtractedItem extends object, MainTableKeyFields extends string, PE extends string, EAN extends AnyExpressionAttributeNames> =
  string extends PE // PE was not provided
  ? (
    WidenKeyToTypesItExtracted<IndexKey, ExtractedItem> extends infer wk extends Record<string, DynamoDBKeyValue>
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
    : never
  )
  : (
    // when a PE is provided, it will do a Projection on the entire object
    // more distributive conditional fun!
    ExtractedItem extends object
    ? ProjectProjectionExpression<ExtractedItem, PE, EAN>
    : never
  );

export type ProjectLSIQuery<KCE extends string, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues, TableIndex extends LSIIndexFromValue, TableItem extends object, PartitionKeyField extends string, SortKeyField extends string, PE extends string> =
  ExtractKeyFromKCE<KCE, EAN, EAV, PartitionKeyField> extends (infer indexKey extends Record<string, DynamoDBKeyValue | BeginsWithExtractor>) // get the index key
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
