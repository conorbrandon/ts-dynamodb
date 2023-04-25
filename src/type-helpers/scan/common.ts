import { AnyExpressionAttributeNames } from "../../dynamodb-types";
import { GSIIndexFromValue, IndexFromValue, LSIIndexFromValue, ProjectAllIndex, ProjectAttributesIndex, ProjectOnlyKeysIndex } from "../../lib";
import { ProjectProjectionExpressionStruct } from "../PE2/pe-lib";
import { PickOverAllExtractedQueryTypes } from "../query/common";
import { ExtractKeysOfGSIIndex } from "../query/gsi-lib";
import { ExtractSortKeyOfLSIIndex } from "../query/lsi-lib";
import { TSDdbSet } from "../sets/utils";
import { DeepSimplifyObject } from "../utils";

export type ProjectNonIndexScan<TableItem extends object, EAN extends AnyExpressionAttributeNames, PE extends string> =
  string extends PE
  ? TSDdbSet<TableItem>
  : TableItem extends object
  ? ProjectProjectionExpressionStruct<TableItem, PE, EAN>
  : never;

export type ProjectScan<TableItem extends object, TableIndex extends IndexFromValue, PartitionKeyField extends string, SortKeyField extends string, EAN extends AnyExpressionAttributeNames, PE extends string> =
  TableIndex extends GSIIndexFromValue
  ? ProjectGSIScan<TableIndex, TableItem, PartitionKeyField | SortKeyField, PE, EAN>
  : (
    TableIndex extends LSIIndexFromValue
    ? ProjectLSIScan<TableIndex, TableItem, PartitionKeyField | SortKeyField, PE, EAN>
    : (
      never
    )
  );

type ProjectGSIScan<Index extends GSIIndexFromValue, Item extends object, MainTableKeyFields extends string, PE extends string, EAN extends AnyExpressionAttributeNames> =
  (
    Index extends ProjectAllIndex
    ? Item
    : (
      Index extends ProjectOnlyKeysIndex
      ? PickOverAllExtractedQueryTypes<Item, ExtractKeysOfGSIIndex<Index> | MainTableKeyFields>
      : (
        Index extends ProjectAttributesIndex
        ? PickOverAllExtractedQueryTypes<Item, ExtractKeysOfGSIIndex<Index> | MainTableKeyFields | Index['attributes'][number]>
        : never
      )
    )
  ) extends (infer indexItem extends object)
  ? (
    string extends PE
    ? DeepSimplifyObject<TSDdbSet<indexItem>>
    : (
      indexItem extends object
      ? ProjectProjectionExpressionStruct<indexItem, PE, EAN>
      : never
    )
  )
  : never;

type ProjectLSIScan<Index extends LSIIndexFromValue, Item extends object, MainTableKeyFields extends string, PE extends string, EAN extends AnyExpressionAttributeNames> =
  string extends PE // PE was not provided
  ? (
    Index extends ProjectAllIndex
    ? TSDdbSet<Item>
    : (
      Index extends ProjectOnlyKeysIndex
      ? DeepSimplifyObject<PickOverAllExtractedQueryTypes<TSDdbSet<Item>, ExtractSortKeyOfLSIIndex<Index> | MainTableKeyFields>>
      : (
        Index extends ProjectAttributesIndex
        ? DeepSimplifyObject<PickOverAllExtractedQueryTypes<TSDdbSet<Item>, ExtractSortKeyOfLSIIndex<Index> | MainTableKeyFields | Index['attributes'][number]>>
        : never
      )
    )
  )
  : (
    // when a PE is provided, it will do a Projection on the entire object
    Item extends object
    ? ProjectProjectionExpressionStruct<Item, PE, EAN>
    : never
  );