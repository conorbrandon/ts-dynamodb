import { TypesafePromiseResult, TypesafeCallback, TypesafeRequest, _LogParams } from "./defs-override/defs-helpers";
import { DeleteInput, DeleteOutput, StrictDeleteItemInput } from "./defs-override/delete";
import { GetInput, StrictGetItemInput, GetOutput, GetPEInput, GetPEOutput } from "./defs-override/get";
import { PutInput, PutOutput, StrictPutItemInput } from "./defs-override/put";
import { ExtraConditions, StrictUpdateItemInput, StrictUpdateSimpleSETInput, UpdateInput, UpdateOutput, UpdateSimpleSETInput, UpdateSimpleSETOutput } from "./defs-override/update";
import { DoesKeyHaveAPropertyCalledKey, ValidateInputTypesForTable } from "./type-helpers/lib/validate-input-types";
import { DeepReadonly, DeepWriteable, PickAcrossUnionOfRecords, Values } from "./type-helpers/record";
import { ProjectUpdateExpression } from "./type-helpers/UE/output";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AnyExpressionAttributeNames, ExpressionAttributeValues } from "./dynamodb-types";
import { QueryInput, QueryItemOutput, QueryItemPEOutput, QueryKeyInput, QueryKeyKey, QueryKeyOutput, QueryKeyPEInput, QueryKeyPEOutput, QueryOutput, QueryPEInput, QueryPEOutput } from "./defs-override/query";
import { DeepSimplifyObject, NoUndefined, OnlyStrings } from "./type-helpers/utils";
import { ExtractEAsFromString } from "./type-helpers/extract-EAs";
import { TSDdbSet } from "./type-helpers/sets/utils";
import { ScanInput, ScanOutput, ScanPEInput, ScanPEOutput } from "./defs-override/scan";
import { inspect, InspectOptions } from 'util';
import { GetAllKeys } from "./type-helpers/get-all-keys";
import { BatchGetAllRequestOutput, BatchGetAllRequestRequests, CreateBatchGetAllRequestAddTableInput } from "./defs-override/batchGet";
import { AWSError } from "aws-sdk";

export type ProjectAllIndex = {
  project: 'all';
};
export type ProjectOnlyKeysIndex = {
  project: 'keys-only';
};
export type ProjectAttributesIndex = {
  project: 'attributes';
  attributes: readonly string[];
};
type ProjectIndex = ProjectAllIndex | ProjectOnlyKeysIndex | ProjectAttributesIndex;
export type GSIIndexFromValue = {
  name: string; // A dynamic name that can be changed at runtime
  type: 'GSI';
  partitionKey: string;
  sortKey?: string;
} & ProjectIndex;
export type LSIIndexFromValue = {
  name: string; // A dynamic name that can be changed at runtime
  type: 'LSI';
  sortKey: string;
} & ProjectIndex;
export type IndexFromValue = GSIIndexFromValue | LSIIndexFromValue;

/** 
 * This type exists so you can define an actual JS object and use `typeof` to create a type from it. That way,
 * if the table name or index names are environment dependent, you can use a computed value determined at runtime instead of a constant value.
 */
export type TableFromValue = {
  name: string;
  indices?: Record<string, IndexFromValue>;
};
/**
 * The table definition type. Provide this as input to `TypesafeDocumentClient`[`Raw`]
 */
export type Table<
  TFV extends TableFromValue,
  TypesUnion extends Record<string, any>,
  PartitionKey extends keyof TypesUnion,
  RangeKey extends keyof TypesUnion | undefined = undefined
> =
  ValidateInputTypesForTable<TypesUnion> extends infer validated
  ? (
    validated extends 1 // type validation success!
    ? TFV & {
      keys: {
        partitionKey: PartitionKey;
        sortKey?: RangeKey;
      };
      types: TypesUnion;
    }
    : {
      name: validated; // reuse validated to display the issue
      keys: {
        partitionKey: never;
        sortKey?: never;
      };
      types: never;
    }
  )
  : never;
type AnyGenericTable = Table<TableFromValue, Record<string, any>, string, string | undefined>;

/** Produce a union of all table names from a union of Tables */
export type TableName<Tables> = Tables extends AnyGenericTable ? Tables['name'] : never;
/** Just get the keys object in the Table type above */
export type TableKeyPartitionSortRaw<Tables, TN extends string> = Tables extends AnyGenericTable ? TN extends Tables['name'] ? Tables['keys'] : never : never;
/** Produce the union of keys that corresponds to the Table with name TN */
export type TableKey<Tables, TN extends string> = Tables extends AnyGenericTable ? TN extends Tables['name'] ? PickAcrossUnionOfRecords<TableItem<Tables, TN>, Values<Tables['keys']>> : never : never;
/** Produce the union of item types that corresponds to the Table with name TN */
export type TableItem<Tables, TN extends string> = Tables extends AnyGenericTable ? TN extends Tables['name'] ? Tables['types'] : never : never;
/** Extract the type of item that contains the type of Key */
export type ExtractTableItemForKey<T extends Record<string, any>, Key extends Record<string, any>> =
  T extends Record<string, any>
  ? (
    keyof Key extends keyof T
    ? Key extends Pick<T, keyof Key>
    ? T
    : never
    : never
  )
  : never;
export type ExtractTableItemForKeys<T extends Record<string, any>, Keys extends readonly Record<string, any>[]> = {
  [Key in keyof Keys]: ExtractTableItemForKey<T, Keys[Key]>;
}[number];

/** Extract a union of all indices[string] IndexFromValue objects */
export type TableInidicesUnion<Tables, TN extends string> =
  Tables extends AnyGenericTable
  ? TN extends Tables['name']
  ? (
    Tables['indices'] extends infer indicesForTable
    ? indicesForTable[keyof indicesForTable] extends (infer indicesUnion extends IndexFromValue)
    ? (
      indicesUnion
    )
    : never
    : never
  )
  : never
  : never;
/** Extract a union of IndexFromValue['name'] strings */
export type TableIndexName<Tables, TN extends string> = TableInidicesUnion<Tables, TN>['name'];
type _TableIndex<IndicesUnion, IndexName extends string> = IndicesUnion extends IndexFromValue ? IndexName extends IndicesUnion['name'] ? IndicesUnion : never : never;
/** Take a IndexFromValue['name'] string and find the indices[string] IndexFromValue it came from */
export type TableIndex<Tables, TN extends string, IndexName extends string> = _TableIndex<TableInidicesUnion<Tables, TN>, IndexName>;
/** Pick the Key object from a TableItem object */
export type TableItemKey<Tables, TN extends string, Item extends TableItem<Tables, TN>> = TableKey<Tables, TN> extends infer tKey ? [keyof tKey] extends [keyof Item] ? Pick<Item, keyof tKey> : never : never;

/** Correctly type the return value of put/delete depending whether the ReturnValues key is supplied */
export type PutAndDeleteReturnValues = 'NONE' | 'ALL_OLD';
export type PutAndDeleteOutputHelper<T extends Record<any, any>, RN extends PutAndDeleteReturnValues | undefined> = RN extends undefined ? undefined : RN extends 'NONE' ? undefined : RN extends 'ALL_OLD' ? TSDdbSet<T> | undefined : never;
/** Correctly type the return value of update depending whether the ReturnValues key is supplied */
export type UpdateReturnValues = 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW';
export type UpdateOutputHelper<T extends Record<any, any>, UE extends string, EAN extends AnyExpressionAttributeNames, RN extends UpdateReturnValues | undefined> = RN extends undefined ? undefined : RN extends 'NONE' ? undefined : RN extends 'ALL_OLD' | 'ALL_NEW' ? TSDdbSet<T> | undefined : RN extends 'UPDATED_OLD' | 'UPDATED_NEW' ? ProjectUpdateExpression<UE, T, EAN, RN> : never;
export type UpdateSimpleSETOutputHelper<Item extends Record<string, any>, TypeOfItem extends Record<string, any>, RN extends UpdateReturnValues | undefined> =
  RN extends undefined ? undefined
  : RN extends 'NONE' ? undefined
  : RN extends 'ALL_OLD' | 'ALL_NEW' ? TSDdbSet<TypeOfItem> /** The lack of undefined is predicated on the fact a CE with the Key is ALWAYS included */
  // below this, we add undefined because we are allowing a Partial of TypeOfItem, and if the Item doesn't actually contains any keys or all values are undefined, no UpdateExpression will be created, thus Attributes could be undefined.
  : RN extends 'UPDATED_OLD' ? (
    DeepSimplifyObject<TSDdbSet<{
      [K in keyof Item]: TypeOfItem[K & keyof TypeOfItem]
    }>> | undefined
  ) : RN extends 'UPDATED_NEW' ? DeepSimplifyObject<TSDdbSet<Item, true>> | undefined : never;

/** 
 * A barebones interface to replace the core DocumentClient methods (`get`, `put`, `update`, `delete`, `query`, and `scan`) with typesafe versions. Validate all `ExpressionAttribute*s` are used, deeply nested `ProjectionExpressions`, ensure updates are following your type contract _exactly_, extract the types returned in `query.Items` based on the `KeyConditionExpression`, and more.
 *
 * @example
 * ```ts
 export const tsDdbRaw = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1'
 }) as TypesafeDocumentClientRaw<MyTableType1 | MyTableType2>;
 * ```
 */
export interface TypesafeDocumentClientRawv2<TS extends AnyGenericTable> extends Omit<DocumentClient, 'get' | 'put' | 'update' | 'delete' | 'query' | 'scan'> {

  get<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    PE extends string,
    GAK extends GetAllKeys<TypeOfItem>,
    EANs extends ExtractEAsFromString<PE>['ean'],
    const EAN extends Record<EANs, GAK>,
    const DummyEAN extends undefined
  >(
    params: GetInput<TN, Key, PE, EANs, GAK, EAN, DummyEAN>,
    callback?: TypesafeCallback<
      GetOutput<
        PE, TypeOfItem, EAN
      >>
  ): TypesafeRequest<
    GetOutput<
      PE, TypeOfItem, EAN
    >
  >;

  put<
    TN extends TableName<TS>,
    Item extends TableItem<TS, TN>,
    // we must pick across if the Item is a union
    Key extends PickAcrossUnionOfRecords<Item, OnlyStrings<keyof TableKey<TS, TN>>>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    CE extends string,
    EAs extends ExtractEAsFromString<CE>,
    GAK extends GetAllKeys<TypeOfItem>,
    const EAN extends Record<EAs['ean'], GAK>,
    const DummyEAN extends undefined,
    const EAV extends Record<EAs['eav'], any>,
    const DummyEAV extends undefined,
    RN extends PutAndDeleteReturnValues = 'NONE'
  >(
    params: PutInput<TN, Item, TypeOfItem, CE, GAK, EAs['ean'], EAs['eav'], EAN, DummyEAN, EAV, DummyEAV, RN>,
    callback?: TypesafeCallback<
      PutOutput<
        TypeOfItem, RN
      >>
  ): TypesafeRequest<
    PutOutput<
      TypeOfItem, RN
    >
  >;

  update<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    UE extends string,
    CE extends string,
    UEEAs extends ExtractEAsFromString<UE>,
    CEEAs extends ExtractEAsFromString<CE>,
    GAK extends GetAllKeys<TypeOfItem>,
    const EAN extends Record<UEEAs['ean'] | CEEAs['ean'], GAK>,
    const EAV extends Record<UEEAs['eav'] | CEEAs['eav'], any>,
    RN extends UpdateReturnValues = 'NONE'
  >(
    params: UpdateInput<TN, Key, TypeOfItem, UE, CE, UEEAs['ean'] | CEEAs['ean'], UEEAs['eav'] | CEEAs['eav'], GAK, EAN, EAV, RN>,
    callback?: TypesafeCallback<
      UpdateOutput<
        TypeOfItem,
        UE, EAN, RN
      >>
  ): TypesafeRequest<
    UpdateOutput<
      TypeOfItem,
      UE, EAN, RN
    >
  >;

  delete<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    CE extends string,
    EAs extends ExtractEAsFromString<CE>,
    GAK extends GetAllKeys<TypeOfItem>,
    const EAN extends Record<EAs['ean'], GAK>,
    const DummyEAN extends undefined,
    const EAV extends Record<EAs['eav'], any>,
    const DummyEAV extends undefined,
    RN extends PutAndDeleteReturnValues = 'NONE'
  >(
    params: DeleteInput<TN, Key, CE, EAs['ean'], EAs['eav'], GAK, EAN, DummyEAN, EAV, DummyEAV, RN>,
    callback?: TypesafeCallback<
      DeleteOutput<
        TypeOfItem, RN
      >>
  ): TypesafeRequest<
    DeleteOutput<
      TypeOfItem, RN
    >
  >;

  query<
    TN extends TableName<TS>,
    KCE extends string,
    PE extends string,
    FE extends string,
    KCEEAs extends ExtractEAsFromString<KCE>,
    PEEAs extends ExtractEAsFromString<PE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<KCEEAs['eav'] | FEEAs['eav'], any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(
    params: QueryInput<TN, IndexName, KCE, PE, FE, KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], KCEEAs['eav'] | FEEAs['eav'], EAN, EAV>,
    callback?: TypesafeCallback<
      QueryOutput<
        TableItem<TS, TN>,
        TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
        // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
        NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
        EAN,
        EAV,
        TableIndex<TS, TN, IndexName>,
        KCE,
        PE
      >>
  ): TypesafeRequest<
    QueryOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      EAV,
      TableIndex<TS, TN, IndexName>,
      KCE,
      PE
    >
  >;

  scan<
    TN extends TableName<TS>,
    FE extends string,
    PE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    PEEAs extends ExtractEAsFromString<PE>,
    const EAN extends Record<FEEAs['ean'] | PEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(
    params: ScanInput<TN, IndexName, FE, PE, FEEAs['ean'] | PEEAs['ean'], FEEAs['eav'], EAN, EAV>,
    callback?: TypesafeCallback<
      ScanOutput<
        TableItem<TS, TN>,
        TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
        // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
        NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
        EAN,
        TableIndex<TS, TN, IndexName>,
        PE
      >>
  ): TypesafeRequest<
    ScanOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >
  >;

}

/**
 * A more fully featured typesafe `DocumentClient` experience. Using a `DocumentClient` of your creation, replaces the core methods (`get`, `put`, `update`, `delete`, `query`, and `scan`) with promise-less versions. Because it takes a `DocumentClient` as input, you can use one `DocumentClient` instance to use the methods `TypesafeDocumentClient` (currently 👀) does not support, such as `transactGet/Write` and `batchGet/Write`.
 * 
 * In addition to promise-less core methods, `queryAll` and `scanAll` are supported, to get all `Items` in your table for the given input parameters.
 * 
 * To make operations on commonly accessed types a little easier, `createStrict[put/get/update/delete]` methods are also available. Using these methods, you can, for example, create a function that only accepts a `Key` to `get` a `User` with the `TableName` parameter pre-filled. Unfortunately, due to TS' lack of partial type inference, currying has to be used, but it is a one time setup.
 * 
 * __IMPORTANT__: `DocumentClient.DocumentClientOptions` are NOT supported. Converting empty values to `null` and non-primitive number types may cause unexpected results.
 * 
 * Note: legacy parameters are not supported (at all).
 * 
 * @example
 * ```ts
 const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-1',
    endpoint: 'http://localhost:8001'
 });
 const tsDocClient = new TypesafeDocumentClient<Table1Type | Table2Type | ...>(docClient);
 * ```
 *
 * Highlight features:
 * - lets you know which ExpressionAttributeNames and Values are not defined/used _before_ runtime.
 * - deeply nested ProjectionExpressions supporting tuples and rest arrays.
 * - validate UpdateExpressions:
 *    - SET values to their correct types (including support for list_append, increment/decrement, if_not_exists, and combinations of the three!)
 *      - ex: `'SET myStringArray=list_append(if_not_exists(myStringArray, :emptyList), :myStringArray)'` or `'set countTotal=:newStuff+#countOtherStuff'`.
 *    - REMOVE fields that are optional or union'ed with undefined
 *    - ADD a number field and number value, and ADD like-kind elements to a DynamoDbSet (for more details on how to type these correctly, please see the docs)
 *    - DELETE like-kind elements from a DynamoDbSet
 * - Extract the types that will be returned based on a `query` KeyConditionExpression, understanding DynamoDB rules for Global and Local Secondary Indexes and which attributes are projected based on the index configuration: 'ALL', 'KEYS_ONLY', or 'INCLUDE'.
 */
export class TypesafeDocumentClientv2<TS extends AnyGenericTable> {

  constructor(private client: DocumentClient, private inspectOptions?: InspectOptions) { }

  async get<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    PE extends string,
    GAK extends GetAllKeys<TypeOfItem>,
    EANs extends ExtractEAsFromString<PE>['ean'],
    const EAN extends Record<EANs, GAK>,
    const DummyEAN extends undefined
  >(params: GetInput<TN, Key, PE, EANs, GAK, EAN, DummyEAN>) {
    const res = await this.client.get(params).promise();
    return res as unknown as TypesafePromiseResult<GetOutput<PE, TypeOfItem, EAN>>;
  }

  /** 
   * Provide a `TableName` parameter and call the function once, ___explicitly provide___ the `Item` generic and call the function a second time, and returns a function that can only get a certain type of `Item`. 
   * 
   * Pass optional `itemOnly` equal `true` to bypass the metadata DynamoDB returns and get the `Item` back directly.
   * 
   * Note: the currying is necessary to be able to use a dynamic `TableName` determined at runtime and work around the TS limitation on partial inference of generic parameters.
   */
  createStrictGetItem<TN extends TableName<TS>, IO extends boolean = false>(TableName: TN, itemOnly?: IO) {
    return <TypeOfItem extends TableItem<TS, TN> = never>() =>
      async <
        Key extends TableItemKey<TS, TN, TypeOfItem>,
        PE extends string,
        GAK extends GetAllKeys<TypeOfItem>,
        EANs extends ExtractEAsFromString<PE>['ean'],
        const EAN extends Record<EANs, GAK>,
        const DummyEAN extends undefined
      >(params: StrictGetItemInput<Key, PE, EANs, GAK, EAN, DummyEAN> | DoesKeyHaveAPropertyCalledKey<Key>): Promise<IO extends true ? GetOutput<PE, TypeOfItem, EAN>['Item'] : TypesafePromiseResult<GetOutput<PE, TypeOfItem, EAN>>> => {
        let res;
        if ("Key" in params) {
          res = await this.client.get({ TableName, ...params }).promise();
        } else {
          res = await this.client.get({ TableName, Key: params }).promise();
        }
        if (itemOnly) {
          return res.Item as any;
        }
        return res as any;
      };
  }

  /**
   * You may wish to abstract away the creation of params for the caller, but still allow passing a custom `ProjectionExpression`.
   * 
   * With `getPE`, you call the function with the `TableName` and `Key` params in the first parameter, and then pass an optional `ProjectionExpression` (without `ExpressionAttributeNames`) in the second parameter. If using `getPE` within another function, the `ProjectionExpression` ___must___ be generic. (This is so it isn't widened to type `string`. If the PE is of type `string`, the type returned is a DeepPartial of the entire `Item`. When passing no `ProjectionExpression`, the Item is not transformed with DeepPartial. For the best results, the generic parameter should default to `undefined`.) Please see the example.
   * 
   * ⚠️⚠️⚠️ To reiterate, `ProjectionExpression` should not contain any `ExpressionAttributeNames`. The `ProjectionExpression` is parsed and `ExpressionAttributeNames` are added automatically. 💡 If any of your attributes contain spaces, newlines, or tabs, this method will not work.
   * 
   * @see {@link _LogParams} to log the `get` input parameters
   * 
   * @example
   * ```ts
   const getThing = async <PE extends string | undefined = undefined>(Key: TypesafeDocumentClientv2.GetTableItemKey<MyTableType, Thing>, pe?: PE) => {
      return (await tsDdb.getPE({
          TableName: MyTable.name,
          Key,
          _logParams: {
              log: true,
              message: 'getting Thing'
          }
      }, pe)).Item;
  }
   * ```
   */
  async getPE<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    PE extends string | undefined = undefined
  >(params: GetPEInput<TN, Key>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const res = await this.client.get(p).promise();
    return res as unknown as TypesafePromiseResult<GetPEOutput<PE, TypeOfItem, {}>>;
  }

  async put<
    TN extends TableName<TS>,
    Item extends TableItem<TS, TN>,
    // we must pick across if the Item is a union
    Key extends PickAcrossUnionOfRecords<Item, OnlyStrings<keyof TableKey<TS, TN>>>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    CE extends string,
    EAs extends ExtractEAsFromString<CE>,
    GAK extends GetAllKeys<TypeOfItem>,
    const EAN extends Record<EAs['ean'], GAK>,
    const DummyEAN extends undefined,
    const EAV extends Record<EAs['eav'], any>,
    const DummyEAV extends undefined,
    RN extends PutAndDeleteReturnValues = 'NONE'
  >(params: PutInput<TN, Item, TypeOfItem, CE, GAK, EAs['ean'], EAs['eav'], EAN, DummyEAN, EAV, DummyEAV, RN>) {
    const res = await this.client.put(params).promise();
    return res as unknown as TypesafePromiseResult<PutOutput<TypeOfItem, RN>>;
  }

  /**
   * Provide a `TableName` parameter and call the function once, ___explicitly provide___ the `Item` generic and call the function a second time, and returns a function that can only put a certain type of `Item`. 
   * 
   * Pass optional `attributesOnly` equal `true` to bypass the metadata DynamoDB returns and get the `Attributes` back directly.
   * 
   * Note: the currying is necessary to be able to use a dynamic `TableName` determined at runtime and work around the TS limitation on partial inference of generic parameters.
   */
  createStrictPutItem<TN extends TableName<TS>, AO extends boolean = false>(TableName: TN, attributesOnly?: AO) {
    return <TypeOfItem extends TableItem<TS, TN> = never>() =>
      async <
        Item extends TypeOfItem,
        CE extends string,
        EAs extends ExtractEAsFromString<CE>,
        GAK extends GetAllKeys<TypeOfItem>,
        const EAN extends Record<EAs['ean'], GAK>,
        const DummyEAN extends undefined,
        const EAV extends Record<EAs['eav'], any>,
        const DummyEAV extends undefined,
        RN extends PutAndDeleteReturnValues = 'NONE'
      >(params: StrictPutItemInput<Item, TypeOfItem, CE, GAK, EAs['ean'], EAs['eav'], EAN, DummyEAN, EAV, DummyEAV, RN>): Promise<AO extends true ? PutOutput<TypeOfItem, RN>['Attributes'] : TypesafePromiseResult<PutOutput<TypeOfItem, RN>>> => {
        const res = await this.client.put({ TableName, ...params }).promise();
        if (attributesOnly) {
          return res.Attributes as any;
        }
        return res as any;
      };
  }

  async update<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    UE extends string,
    CE extends string,
    UEEAs extends ExtractEAsFromString<UE>,
    CEEAs extends ExtractEAsFromString<CE>,
    GAK extends GetAllKeys<TypeOfItem>,
    const EAN extends Record<UEEAs['ean'] | CEEAs['ean'], GAK>,
    const EAV extends Record<UEEAs['eav'] | CEEAs['eav'], any>,
    RN extends UpdateReturnValues = 'NONE'
  >(params: UpdateInput<TN, Key, TypeOfItem, UE, CE, UEEAs['ean'] | CEEAs['ean'], UEEAs['eav'] | CEEAs['eav'], GAK, EAN, EAV, RN>) {
    const res = await this.client.update(params).promise();
    return res as unknown as TypesafePromiseResult<UpdateOutput<TypeOfItem, UE, EAN, RN>>;
  }

  /**
   * Provide a `TableName` parameter and call the function once, ___explicitly provide___ the `Item` generic and call the function a second time, and returns a function that can only update a certain type of `Item`. 
   * 
   * Pass optional `attributesOnly` equal `true` to bypass the metadata DynamoDB returns and get the `Attributes` back directly.
   * 
   * Note: the currying is necessary to be able to use a dynamic `TableName` determined at runtime and work around the TS limitation on partial inference of generic parameters.
   */
  createStrictUpdateItem<TN extends TableName<TS>, AO extends boolean = false>(TableName: TN, attributesOnly?: AO) {
    return <TypeOfItem extends TableItem<TS, TN> = never>() =>
      async<
        Key extends TableItemKey<TS, TN, TypeOfItem>,
        UE extends string,
        CE extends string,
        UEEAs extends ExtractEAsFromString<UE>,
        CEEAs extends ExtractEAsFromString<CE>,
        GAK extends GetAllKeys<TypeOfItem>,
        const EAN extends Record<UEEAs['ean'] | CEEAs['ean'], GAK>,
        const EAV extends Record<UEEAs['eav'] | CEEAs['eav'], any>,
        RN extends UpdateReturnValues = 'NONE'
      >(params: StrictUpdateItemInput<Key, TypeOfItem, UE, CE, UEEAs['ean'] | CEEAs['ean'], UEEAs['eav'] | CEEAs['eav'], GAK, EAN, EAV, RN>): Promise<AO extends true ? UpdateOutput<TypeOfItem, UE, EAN, RN>['Attributes'] : TypesafePromiseResult<UpdateOutput<TypeOfItem, UE, EAN, RN>>> => {
        const res = await this.client.update({ TableName, ...params }).promise();
        if (attributesOnly) {
          return res.Attributes as any;
        }
        return res as any;
      };
  }

  /**
   * @summary
   * A convenience method to set top level properties of an object.
   * 
   * A common operation is to update an object with new top level properties, such as updating a User's role, i.e. `type User = { ..., role: 'admin' | 'user' };`.
   * This method accepts an `Partial` of the `Item` with the provided `Key` (omitting the key fields themselves), and creates an `UpdateExpression` to set the top level fields to a new value (only those that are not equal to `undefined`).
   * 
   * __IMPORTANT__: a `ConditionExpression` is also added using the `Key` fields and values. This method is intended to update _existing_ items only.
   * 
   * @see {@link extraConditions} for more options
   * @see {@link _LogParams} to log the `update` input parameters
   * 
   * @example 
   * An `Item` with `{ role: 'user' }` will create the following parameters for the `update` operation:
   * ```ts
  {
      TableName: ...,
      Key: { k1: ..., k2: ... },
      UpdateExpression: 'SET #role=:role',
      ExpressionAttributeNames: { '#role': 'role', '#k1': 'k1', '#k2': 'k2' },
      ExpressionAttributeValues: { ':role': 'user', ':k1': ..., ':k2': ... },
      ConditionExpression: '(#k1=:k1 AND #k2=:k2)'
  }
   * ```
   */
  async updateSimpleSET<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    NoKeysTypeOfItem extends DeepReadonly<Partial<Omit<TypeOfItem, keyof Key>>>,
    const Item extends NoKeysTypeOfItem,
    AS extends string,
    ASEAs extends ExtractEAsFromString<AS>,
    GAK extends GetAllKeys<TypeOfItem>,
    const EAN extends Record<ASEAs['ean'], GAK>,
    const DummyEAN extends undefined,
    const EAV extends Record<ASEAs['eav'], any>,
    const DummyEAV extends undefined,
    RN extends UpdateReturnValues = 'NONE'
  >(params: UpdateSimpleSETInput<TN, Key, NoKeysTypeOfItem, Item, AS, ASEAs['ean'], ASEAs['eav'], GAK, EAN, DummyEAN, EAV, DummyEAV, RN>) {
    const { TableName, Key, Item, ReturnValues, extraConditions, _logParams } = params;
    const updateParams = this.getUpdateSimpleSETParams(Key, Item, extraConditions);
    const finalParams = {
      TableName,
      Key,
      ...updateParams,
      ReturnValues: ReturnValues ?? 'NONE'
    };
    if (_logParams?.log) {
      console.log(_logParams.message ?? '', this.myInspect(finalParams));
    }
    const res = await this.client.update(finalParams).promise();
    return res as unknown as TypesafePromiseResult<UpdateSimpleSETOutput<DeepWriteable<Item>, TypeOfItem, RN>>;
  }

  /**
   * Similar to `updateSimpleSet`, but only allow updating one type of Item.
   * 
   * Provide a `TableName` parameter and call the function once, ___explicitly provide___ the `Item` generic and call the function a second time, and returns a function that can only update a certain type of `Item`. 
   * 
   * Pass optional `attributesOnly` equal `true` to bypass the metadata DynamoDB returns and get the `Attributes` back directly.
   * 
   * Note: the currying is necessary to be able to use a dynamic `TableName` determined at runtime and work around the TS limitation on partial inference of generic parameters.
   *
   * @example
   * ```ts
   * const updateUser = createStrictUpdateSimpleSET(SingleTable.name)<User>();
   * await updateUser({ Key: { p0: '' as UserID, s0: 'user' }, Item: { role: 'admin' } });
   * ```
   */
  createStrictUpdateSimpleSET<TN extends TableName<TS>, AO extends boolean = false>(TableName: TN, attributesOnly?: AO) {
    return <TypeOfItem extends TableItem<TS, TN> = never>() =>
      async<
        Key extends TableItemKey<TS, TN, TypeOfItem>,
        NoKeysTypeOfItem extends DeepReadonly<Partial<Omit<TypeOfItem, keyof Key>>>,
        const Item extends NoKeysTypeOfItem,
        AS extends string,
        ASEAs extends ExtractEAsFromString<AS>,
        GAK extends GetAllKeys<TypeOfItem>,
        const EAN extends Record<ASEAs['ean'], GAK>,
        const DummyEAN extends undefined,
        const EAV extends Record<ASEAs['eav'], any>,
        const DummyEAV extends undefined,
        RN extends UpdateReturnValues = 'NONE'
      >(params: StrictUpdateSimpleSETInput<Key, NoKeysTypeOfItem, Item, AS, ASEAs['ean'], ASEAs['eav'], GAK, EAN, DummyEAN, EAV, DummyEAV, RN>): Promise<AO extends true ? UpdateSimpleSETOutput<DeepWriteable<Item>, TypeOfItem, RN>['Attributes'] : TypesafePromiseResult<UpdateSimpleSETOutput<DeepWriteable<Item>, TypeOfItem, RN>>> => {
        const { Key, Item, ReturnValues, extraConditions, _logParams } = params;
        const updateParams = this.getUpdateSimpleSETParams(Key, Item, extraConditions);
        const finalParams = {
          TableName,
          Key,
          ...updateParams,
          ReturnValues: ReturnValues ?? 'NONE'
        };
        if (_logParams?.log) {
          console.log(_logParams.message ?? '', this.myInspect(finalParams));
        }
        const res = await this.client.update(finalParams).promise();
        if (attributesOnly) {
          return res.Attributes as any;
        }
        return res as any;
      };
  }

  async delete<
    TN extends TableName<TS>,
    Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    CE extends string,
    EAs extends ExtractEAsFromString<CE>,
    GAK extends GetAllKeys<TypeOfItem>,
    const EAN extends Record<EAs['ean'], GAK>,
    const DummyEAN extends undefined,
    const EAV extends Record<EAs['eav'], any>,
    const DummyEAV extends undefined,
    RN extends PutAndDeleteReturnValues = 'NONE'
  >(params: DeleteInput<TN, Key, CE, EAs['ean'], EAs['eav'], GAK, EAN, DummyEAN, EAV, DummyEAV, RN>) {
    const res = await this.client.delete(params).promise();
    return res as unknown as TypesafePromiseResult<DeleteOutput<TypeOfItem, RN>>;
  }

  /**
   * Provide a `TableName` parameter and call the function once, ___explicitly provide___ the `Item` generic and call the function a second time, and returns a function that can only delete a certain type of `Item`. 
   * 
   * Pass optional `attributesOnly` equal `true` to bypass the metadata DynamoDB returns and get the `Attributes` back directly.
   * 
   * Note: the currying is necessary to be able to use a dynamic `TableName` determined at runtime and work around the TS limitation on partial inference of generic parameters.
   * 
   * @example
   * ```ts
   * const deleteUser = createStrictDeleteItem(SingleTable.name)<User>();
   * await deleteUser({ Key: { p0: UserID, s0: 'user' } });
   * ```
   */
  createStrictDeleteItem<TN extends TableName<TS>, AO extends boolean = false>(TableName: TN, attributesOnly?: AO) {
    return <TypeOfItem extends TableItem<TS, TN> = never>() =>
      async<
        Key extends TableItemKey<TS, TN, TypeOfItem>,
        CE extends string,
        EAs extends ExtractEAsFromString<CE>,
        GAK extends GetAllKeys<TypeOfItem>,
        const EAN extends Record<EAs['ean'], GAK>,
        const DummyEAN extends undefined,
        const EAV extends Record<EAs['eav'], any>,
        const DummyEAV extends undefined,
        RN extends PutAndDeleteReturnValues = 'NONE'
      >(params: StrictDeleteItemInput<Key, CE, EAs['ean'], EAs['eav'], GAK, EAN, DummyEAN, EAV, DummyEAV, RN> | DoesKeyHaveAPropertyCalledKey<Key>): Promise<AO extends true ? DeleteOutput<TypeOfItem, RN>['Attributes'] : TypesafePromiseResult<DeleteOutput<TypeOfItem, RN>>> => {
        let res;
        if ("Key" in params) {
          res = await this.client.delete({ TableName, ...params }).promise();
        } else {
          res = await this.client.delete({ TableName, Key: params }).promise();
        }
        if (attributesOnly) {
          return res.Attributes as any;
        }
        return res as any;
      };
  }

  async query<
    TN extends TableName<TS>,
    KCE extends string,
    PE extends string,
    FE extends string,
    KCEEAs extends ExtractEAsFromString<KCE>,
    PEEAs extends ExtractEAsFromString<PE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<KCEEAs['eav'] | FEEAs['eav'], any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryInput<TN, IndexName, KCE, PE, FE, KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], KCEEAs['eav'] | FEEAs['eav'], EAN, EAV>) {
    const res = await this.client.query(params).promise();
    return res as unknown as TypesafePromiseResult<QueryOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      EAV,
      TableIndex<TS, TN, IndexName>,
      KCE,
      PE
    >>;
  }

  /**
   * You may wish to abstract away the creation of params for the caller, but still allow passing a custom `ProjectionExpression`.
   * 
   * With `queryPE`, you call the function with the query params in the first parameter, minus `ProjectionExpression`, and then pass an optional `ProjectionExpression` (without `ExpressionAttributeNames`) in the second parameter. If using `queryPE` within another function, the `ProjectionExpression` ___must___ be generic. (This is so it isn't widened to type `string`. If the PE is of type `string`, the types returned are a DeepPartial of the entire `Items`. When passing no `ProjectionExpression`, the Items are not transformed with DeepPartial. For the best results, the generic parameter should default to `undefined`.) Please see the example.
   * 
   * ⚠️⚠️⚠️ To reiterate, `ProjectionExpression` should not contain any `ExpressionAttributeNames`. The `ProjectionExpression` is parsed and `ExpressionAttributeNames` are added automatically. 💡 If any of your attributes contain spaces, newlines, or tabs, this method will not work.
   * 
   * @see {@link _LogParams} to log the `query` input parameters
   * 
   * @example
   * ```ts
   const queryThingsLessThanOrEqualToK2 = async <PE extends string | undefined = undefined>(k1: string, k2: number, pe?: PE) => {
      return (await tsDdb.queryPE({
          TableName: MyTable.name,
          KeyConditionExpression: 'k1 = :k1 AND k2 <= :k2',
          ExpressionAttributeValues: { ':k1': k1, ':k2': k2 },
          _logParams: {
              log: true,
              message: 'getting Thing'
          }
      }, pe)).Items;
  }
   * ```
   */
  async queryPE<
    TN extends TableName<TS>,
    KCE extends string,
    FE extends string,
    KCEEAs extends ExtractEAsFromString<KCE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<KCEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<KCEEAs['eav'] | FEEAs['eav'], any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryPEInput<TN, IndexName, KCE, FE, KCEEAs['ean'] | FEEAs['ean'], KCEEAs['eav'] | FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const res = await this.client.query(p).promise();
    return res as unknown as TypesafePromiseResult<QueryPEOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      EAV,
      TableIndex<TS, TN, IndexName>,
      KCE,
      PE
    >>;
  }

  /**
   * Convenience method to create the KeyConditionExpression as an `AND`ed combination of one or both of the keys provided in the `Key` property.
   */
  async queryKey<
    TN extends TableName<TS>,
    PE extends string,
    FE extends string,
    PEEAs extends ExtractEAsFromString<PE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<PEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    tableItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    IndexName extends TableIndexName<TS, TN> = never,
    QKK extends QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField> = QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField>,
    const Key extends QKK = QKK
  >(params: QueryKeyInput<TN, Key, IndexName, PE, FE, PEEAs['ean'] | FEEAs['ean'], FEEAs['eav'], EAN, EAV>) {
    const finalParams = this.getKCEFromQueryKey(params);
    if (finalParams._logParams?.log) {
      console.log(finalParams._logParams.message ?? '', this.myInspect(finalParams));
    }
    const res = await this.client.query(finalParams).promise();
    return res as QueryKeyOutput<
      Key,
      tableItem,
      PartitionKeyField,
      SortKeyField,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >;
  }


  /**
   * Convenience method to create the KeyConditionExpression as an `AND`ed combination of one or both of the keys provided in the `Key` property.
   * 
   * Please @see {@link queryPE} for details on this method. It works much the same way. 
   */
  async queryKeyPE<
    TN extends TableName<TS>,
    FE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    tableItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never,
    QKK extends QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField> = QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField>,
    const Key extends QKK = QKK
  >(params: QueryKeyPEInput<TN, Key, IndexName, FE, FEEAs['ean'], FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const queryParams = this.getKCEFromQueryKey(params);
    const finalParams = this.parsePEConstructedParamsAndLog(queryParams, ProjectionExpression);
    const res = await this.client.query(finalParams).promise();
    return res as QueryKeyPEOutput<
      Key,
      tableItem,
      PartitionKeyField,
      SortKeyField,
      TableIndex<TS, TN, IndexName>,
      PE
    >;
  }

  /**
   * Convenience method to query the entire table. Does not return `ConsumedCapacity`, `Count`, etc..., simply an array of all Items.
   */
  async queryAll<
    TN extends TableName<TS>,
    KCE extends string,
    PE extends string,
    FE extends string,
    KCEEAs extends ExtractEAsFromString<KCE>,
    PEEAs extends ExtractEAsFromString<PE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<KCEEAs['eav'] | FEEAs['eav'], any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryInput<TN, IndexName, KCE, PE, FE, KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], KCEEAs['eav'] | FEEAs['eav'], EAN, EAV>) {
    const items: unknown[] = await this.whileLastEvaluatedKey({ method: 'query', params });
    return items as unknown as NoUndefined<QueryOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      EAV,
      TableIndex<TS, TN, IndexName>,
      KCE,
      PE
    >['Items']>;

  }

  /**
   * You may wish to abstract away the creation of params for the caller, but still allow passing a custom `ProjectionExpression`.
   * 
   * With `queryAllPE`, you call the function with the query params in the first parameter, minus `ProjectionExpression`, and then pass an optional `ProjectionExpression` (without `ExpressionAttributeNames`) in the second parameter. If using `queryAllPE` within another function, the `ProjectionExpression` ___must___ be generic. (This is so it isn't widened to type `string`. If the PE is of type `string`, the types returned are a DeepPartial of the entire `Items`. When passing no `ProjectionExpression`, the Items are not transformed with DeepPartial. For the best results, the generic parameter should default to `undefined`.) Please see the example.
   * 
   * Convenience method to query the entire table. Does not return `ConsumedCapacity`, `Count`, etc..., simply an array of all Items.
   * 
   * ⚠️⚠️⚠️ To reiterate, `ProjectionExpression` should not contain any `ExpressionAttributeNames`. The `ProjectionExpression` is parsed and `ExpressionAttributeNames` are added automatically. 💡 If any of your attributes contain spaces, newlines, or tabs, this method will not work.
   * 
   * @see {@link _LogParams} to log the `query` input parameters
   * 
   * @example
   * ```ts
   const queryAllThingsLessThanOrEqualToK2 = async <PE extends string | undefined = undefined>(k1: string, k2: number, pe?: PE) => {
      return await tsDdb.queryAllPE({
          TableName: MyTable.name,
          KeyConditionExpression: 'k1 = :k1 AND k2 <= :k2',
          ExpressionAttributeValues: { ':k1': k1, ':k2': k2 },
          _logParams: {
              log: true,
              message: 'getting Thing'
          }
      }, pe);
  }
   * ```
   */
  async queryAllPE<
    TN extends TableName<TS>,
    KCE extends string,
    FE extends string,
    KCEEAs extends ExtractEAsFromString<KCE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<KCEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<KCEEAs['eav'] | FEEAs['eav'], any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryPEInput<TN, IndexName, KCE, FE, KCEEAs['ean'] | FEEAs['ean'], KCEEAs['eav'] | FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const items: unknown[] = await this.whileLastEvaluatedKey({ method: 'query', params: p });
    return items as unknown as NoUndefined<QueryPEOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      EAV,
      TableIndex<TS, TN, IndexName>,
      KCE,
      PE
    >['Items']>;
  }

  /**
   * Convenience method to create the KeyConditionExpression as an `AND`ed combination of one or both of the keys provided in the `Key` property.
   * 
   * Convenience method to query the entire table. Does not return `ConsumedCapacity`, `Count`, etc..., simply an array of all Items.
   */
  async queryAllKey<
    TN extends TableName<TS>,
    PE extends string,
    FE extends string,
    PEEAs extends ExtractEAsFromString<PE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<PEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    tableItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    IndexName extends TableIndexName<TS, TN> = never,
    QKK extends QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField> = QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField>,
    const Key extends QKK = QKK
  >(params: QueryKeyInput<TN, Key, IndexName, PE, FE, PEEAs['ean'] | FEEAs['ean'], FEEAs['eav'], EAN, EAV>) {
    const finalParams = this.getKCEFromQueryKey(params);
    if (finalParams._logParams?.log) {
      console.log(finalParams._logParams.message ?? '', this.myInspect(finalParams));
    }
    const res = await this.whileLastEvaluatedKey({ method: 'query', params: finalParams });
    return res as NoUndefined<QueryKeyOutput<
      Key,
      tableItem,
      PartitionKeyField,
      SortKeyField,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >['Items']>;
  }

  /**
   * Convenience method to create the KeyConditionExpression as an `AND`ed combination of one or both of the keys provided in the `Key` property.
   * 
   * Convenience method to query the entire table. Does not return `ConsumedCapacity`, `Count`, etc..., simply an array of all Items.
   * 
   * Please @see {@link queryPE} for details on this method. It works much the same way. 
   */
  async queryAllKeyPE<
    TN extends TableName<TS>,
    FE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    tableItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never,
    QKK extends QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField> = QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField>,
    const Key extends QKK = QKK
  >(params: QueryKeyPEInput<TN, Key, IndexName, FE, FEEAs['ean'], FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const queryParams = this.getKCEFromQueryKey(params);
    const finalParams = this.parsePEConstructedParamsAndLog(queryParams, ProjectionExpression);
    const res = await this.whileLastEvaluatedKey({ method: 'query', params: finalParams });
    return res as NoUndefined<QueryKeyPEOutput<
      Key,
      tableItem,
      PartitionKeyField,
      SortKeyField,
      TableIndex<TS, TN, IndexName>,
      PE
    >['Items']>;
  }

  /**
   * Convenience method to query for the first Item returned in the Items array in a single query operation. Does not return `ConsumedCapacity`, `Count`, etc....
   */
  async queryItem<
    TN extends TableName<TS>,
    KCE extends string,
    PE extends string,
    FE extends string,
    KCEEAs extends ExtractEAsFromString<KCE>,
    PEEAs extends ExtractEAsFromString<PE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<KCEEAs['eav'] | FEEAs['eav'], any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryInput<TN, IndexName, KCE, PE, FE, KCEEAs['ean'] | PEEAs['ean'] | FEEAs['ean'], KCEEAs['eav'] | FEEAs['eav'], EAN, EAV>) {
    const { Items = [] } = await this.client.query(params).promise();
    const Item = Items[0];
    if (!Item) {
      return undefined;
    }
    return Item as unknown as QueryItemOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      EAV,
      TableIndex<TS, TN, IndexName>,
      KCE,
      PE
    >;
  }

  /**
   * You may wish to abstract away the creation of params for the caller, but still allow passing a custom `ProjectionExpression`.
   * 
   * With `queryItemPE`, you call the function with the query params in the first parameter, minus `ProjectionExpression`, and then pass an optional `ProjectionExpression` (without `ExpressionAttributeNames`) in the second parameter. If using `queryItemPE` within another function, the `ProjectionExpression` ___must___ be generic. (This is so it isn't widened to type `string`. If the PE is of type `string`, the types returned are a DeepPartial of the entire `Items`. When passing no `ProjectionExpression`, the Items are not transformed with DeepPartial. For the best results, the generic parameter should default to `undefined`.) Please see the example.
   * 
   * Convenience method to query for the first Item returned in the Items array in a single query operation. Does not return `ConsumedCapacity`, `Count`, etc....
   * 
   * ⚠️⚠️⚠️ To reiterate, `ProjectionExpression` should not contain any `ExpressionAttributeNames`. The `ProjectionExpression` is parsed and `ExpressionAttributeNames` are added automatically. 💡 If any of your attributes contain spaces, newlines, or tabs, this method will not work.
   * 
   * @see {@link _LogParams} to log the `query` input parameters
   * 
   * @example
   * ```ts
   const queryTheFirstThingLessThanOrEqualToK2 = async <PE extends string | undefined = undefined>(k1: string, k2: number, pe?: PE) => {
      return await tsDdb.queryItemPE({
          TableName: MyTable.name,
          KeyConditionExpression: 'k1 = :k1 AND k2 <= :k2',
          ExpressionAttributeValues: { ':k1': k1, ':k2': k2 },
          _logParams: {
              log: true,
              message: 'getting Thing'
          }
      }, pe);
  }
   * ```
   */
  async queryItemPE<
    TN extends TableName<TS>,
    KCE extends string,
    FE extends string,
    KCEEAs extends ExtractEAsFromString<KCE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<KCEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<KCEEAs['eav'] | FEEAs['eav'], any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryPEInput<TN, IndexName, KCE, FE, KCEEAs['ean'] | FEEAs['ean'], KCEEAs['eav'] | FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const { Items = [] } = await this.client.query(p).promise();
    const Item = Items[0];
    if (!Item) {
      return undefined;
    }
    return Item as unknown as QueryItemPEOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      EAV,
      TableIndex<TS, TN, IndexName>,
      KCE,
      PE
    >;
  }

  /**
   * Convenience method to create the KeyConditionExpression as an `AND`ed combination of one or both of the keys provided in the `Key` property.
   * 
   * Convenience method to query for the first Item returned in the Items array in a single query operation. Does not return `ConsumedCapacity`, `Count`, etc....
   */
  async queryItemKey<
    TN extends TableName<TS>,
    PE extends string,
    FE extends string,
    PEEAs extends ExtractEAsFromString<PE>,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<PEEAs['ean'] | FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    tableItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    IndexName extends TableIndexName<TS, TN> = never,
    QKK extends QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField> = QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField>,
    const Key extends QKK = QKK
  >(params: QueryKeyInput<TN, Key, IndexName, PE, FE, PEEAs['ean'] | FEEAs['ean'], FEEAs['eav'], EAN, EAV>) {
    const finalParams = this.getKCEFromQueryKey(params);
    if (finalParams._logParams?.log) {
      console.log(finalParams._logParams.message ?? '', this.myInspect(finalParams));
    }
    const { Items = [] } = await this.client.query(finalParams).promise();
    const Item = Items[0];
    if (!Item) {
      return undefined;
    }
    return Item as NoUndefined<QueryKeyOutput<
      Key,
      tableItem,
      PartitionKeyField,
      SortKeyField,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >['Items']>[number];
  }

  /**
   * Convenience method to create the KeyConditionExpression as an `AND`ed combination of one or both of the keys provided in the `Key` property.
   * 
   * Convenience method to query for the first Item returned in the Items array in a single query operation. Does not return `ConsumedCapacity`, `Count`, etc....
   * 
   * Please @see {@link queryPE} for details on this method. It works much the same way. 
   */
  async queryItemKeyPE<
    TN extends TableName<TS>,
    FE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    tableItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never,
    QKK extends QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField> = QueryKeyKey<tableItem, IndexName, TableIndex<TS, TN, IndexName>, TableKey<TS, TN>, PartitionKeyField>,
    const Key extends QKK = QKK
  >(params: QueryKeyPEInput<TN, Key, IndexName, FE, FEEAs['ean'], FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const queryParams = this.getKCEFromQueryKey(params);
    const finalParams = this.parsePEConstructedParamsAndLog(queryParams, ProjectionExpression);
    const { Items = [] } = await this.client.query(finalParams).promise();
    const Item = Items[0];
    if (!Item) {
      return undefined;
    }
    return Item as NoUndefined<QueryKeyPEOutput<
      Key,
      tableItem,
      PartitionKeyField,
      SortKeyField,
      TableIndex<TS, TN, IndexName>,
      PE
    >['Items']>[number];
  }

  async scan<
    TN extends TableName<TS>,
    FE extends string,
    PE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    PEEAs extends ExtractEAsFromString<PE>,
    const EAN extends Record<FEEAs['ean'] | PEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanInput<TN, IndexName, FE, PE, FEEAs['ean'] | PEEAs['ean'], FEEAs['eav'], EAN, EAV>) {
    const res = await this.client.scan(params).promise();
    return res as unknown as TypesafePromiseResult<ScanOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >>;
  }

  /** 
   * Please see `queryPE` for details on this method. It works much the same way. 
   */
  async scanPE<
    TN extends TableName<TS>,
    FE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanPEInput<TN, IndexName, FE, FEEAs['ean'], FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const res = await this.client.scan(p).promise();
    return res as unknown as TypesafePromiseResult<ScanPEOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >>;

  }

  /**
   * Convenience method to scan the entire table. Does not return `ConsumedCapacity`, `Count`, etc..., simply an array of all Items.
   */
  async scanAll<
    TN extends TableName<TS>,
    FE extends string,
    PE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    PEEAs extends ExtractEAsFromString<PE>,
    const EAN extends Record<FEEAs['ean'] | PEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanInput<TN, IndexName, FE, PE, FEEAs['ean'] | PEEAs['ean'], FEEAs['eav'], EAN, EAV>) {
    const items: unknown[] = await this.whileLastEvaluatedKey({ method: 'scan', params });
    return items as unknown as NoUndefined<ScanOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >['Items']>;

  }

  /**
   * Convenience method to scan the entire table. Does not return `ConsumedCapacity`, `Count`, etc..., simply an array of all Items.
   * 
   * Please see `queryAllPE` for details on this method. It works much the same way. 
   */
  async scanAllPE<
    TN extends TableName<TS>,
    FE extends string,
    FEEAs extends ExtractEAsFromString<FE>,
    const EAN extends Record<FEEAs['ean'], string>, // we can't do GAK here because that requires the type of the item, which is the whole point of what we're trying to find with query
    const EAV extends Record<FEEAs['eav'], any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanPEInput<TN, IndexName, FE, FEEAs['ean'], FEEAs['eav'], EAN, EAV>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const items: unknown[] = await this.whileLastEvaluatedKey({ method: 'scan', params: p });
    return items as unknown as NoUndefined<ScanPEOutput<
      TableItem<TS, TN>,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >['Items']>;
  }

  createBatchGetAllRequest({
    maxFailedAttempts = 10,
    base = 2,
    baseDelayMs = 100,
    jitter = false,
    showProvisionedThroughputExceededExceptionError
  }: {
    maxFailedAttempts?: number;
    base?: number;
    baseDelayMs?: number;
    jitter?: boolean;
    /**
     * If `undefined` or `false`, `ProvisionedThroughputExceededException` errors are not printed.
     * 
     * If `true`, `ProvisionedThroughputExceededException` errors are printed to `stderr`.
     * 
     * If a function, `ProvisionedThroughputExceededException` errors are provided to your function and the return value printed to `stderr`.
     * 
     * {@link console.error} is used to print to `stderr`.
     */
    showProvisionedThroughputExceededExceptionError?: boolean | ((error: AWSError) => unknown);
  } = {}) {
    if (maxFailedAttempts < 1) {
      throw Error("maxFailedAttempts must be >= 1!");
    }
    if (baseDelayMs < 0) {
      throw Error("baseDelayMs must be >= 0!");
    }
    return new BatchGetAllRequest<TS, [], never>({
      client: this.client,
      incomingRequests: [],
      maxFailedAttempts,
      base,
      baseDelayMs,
      jitter,
      showProvisionedThroughputExceededExceptionError: showProvisionedThroughputExceededExceptionError ?? false,
      id: Symbol()
    });
  }

  /** Convenience helper to create and return a DynamoDB.DocumentClient.StringSet set */
  createStringSet<L extends [string, ...string[]]>(list: L, options?: DocumentClient.CreateSetOptions) {
    return this.client.createSet(list, options) as DocumentClient.StringSet;
  }
  /** Convenience helper to create and return a DynamoDB.DocumentClient.NumberSet set */
  createNumberSet<L extends [number, ...number[]]>(list: L, options?: DocumentClient.CreateSetOptions) {
    return this.client.createSet(list, options) as DocumentClient.NumberSet;
  }
  /** Convenience helper to create and return a DynamoDB.DocumentClient.BinarySet set */
  createBinarySet<L extends [DocumentClient.binaryType, ...DocumentClient.binaryType[]]>(list: L, options?: DocumentClient.CreateSetOptions) {
    return this.client.createSet(list, options) as DocumentClient.BinarySet;
  }

  private getUpdateSimpleSETParams(Key: Record<string, unknown>, Item: Record<string, unknown>, extraConditions?: ExtraConditions<any, any, any, any, any, undefined, any, undefined>) {
    const { ANDSuffix, extraExpressionAttributeNames = {}, extraExpressionAttributeValues = {} } = extraConditions ?? {};

    let index = 0;
    const ExpressionAttributeNames: Record<`#_${number}_`, string> = {};
    const ExpressionAttributeValues: Record<`:_${number}_`, any> = {};
    const UpdateExpressionFields: `#_${number}_=:_${number}_`[] = [];
    for (const key in Item) {
      const value = Item[key];
      if (value !== undefined) {
        let ean = `#_${index}_` as const;
        let eav = `:_${index}_` as const;
        while (extraExpressionAttributeNames[ean] || extraExpressionAttributeValues[eav]) {
          index++;
          ean = `#_${index}_`;
          eav = `:_${index}_`;
        }
        index++;
        ExpressionAttributeNames[ean] = key;
        ExpressionAttributeValues[eav] = value;
        const field = `${ean}=${eav}` as const;
        UpdateExpressionFields.push(field);
      }
    }

    const ConditionExpressionFields: `#_${number}_=:_${number}_`[] = [];
    for (const key in Key) {
      const value = Key[key];
      let ean = `#_${index}_` as const;
      let eav = `:_${index}_` as const;
      while (extraExpressionAttributeNames[ean] || extraExpressionAttributeValues[eav]) {
        index++;
        ean = `#_${index}_`;
        eav = `:_${index}_`;
      }
      index++;
      ExpressionAttributeNames[ean] = key;
      ExpressionAttributeValues[eav] = value;
      const field = `${ean}=${eav}` as const;
      ConditionExpressionFields.push(field);
    }

    return {
      ExpressionAttributeNames: { ...ExpressionAttributeNames, ...extraExpressionAttributeNames },
      ExpressionAttributeValues: { ...ExpressionAttributeValues, ...extraExpressionAttributeValues },
      ...(UpdateExpressionFields.length ? { UpdateExpression: `SET ${UpdateExpressionFields.join(",")}` } : undefined),
      ConditionExpression: `(${ConditionExpressionFields.join(" AND ")})${ANDSuffix ? ` AND ${ANDSuffix}` : ''}`
    };
  }

  private getKCEFromQueryKey<RawParams extends { Key: Record<string, unknown>; ExpressionAttributeNames?: AnyExpressionAttributeNames; ExpressionAttributeValues?: ExpressionAttributeValues }>(params: RawParams) {
    let index = 0;
    const ExpressionAttributeNames: Record<`#_${number}_`, string> = {};
    const ExpressionAttributeValues: Record<`:_${number}_`, any> = {};
    const KeyConditionExpressionFields: `#_${number}_=:_${number}_`[] = [];
    for (const key in params.Key) {
      const value = params.Key[key];
      if (value !== undefined) {
        let ean = `#_${index}_` as const;
        let eav = `:_${index}_` as const;
        while (params.ExpressionAttributeNames?.[ean] || params.ExpressionAttributeValues?.[eav]) {
          index++;
          ean = `#_${index}_`;
          eav = `:_${index}_`;
        }
        index++;
        ExpressionAttributeNames[ean] = key;
        ExpressionAttributeValues[eav] = value;
        const field = `${ean}=${eav}` as const;
        KeyConditionExpressionFields.push(field);
      }
    }
    return {
      ...params,
      ExpressionAttributeNames: { ...params.ExpressionAttributeNames, ...ExpressionAttributeNames },
      ExpressionAttributeValues: { ...params.ExpressionAttributeValues, ...ExpressionAttributeValues },
      ...(KeyConditionExpressionFields.length ? { KeyConditionExpression: KeyConditionExpressionFields.join(" AND ") } : undefined)
    };
  }

  private mapFlip<K, V extends PropertyKey>(map: Map<K, V>) {
    return [...map.entries()].reduce<Record<V, K>>((acc, [key, value]) => {
      acc[value] = key;
      return acc;
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    }, {} as Record<V, K>);
  }

  private parsePEConstructedParamsAndLog<RawParams extends { ExpressionAttributeNames?: AnyExpressionAttributeNames; _logParams?: _LogParams }>(params: RawParams, peRaw: string | undefined) {
    let p;
    let i = 0;
    if (peRaw) {
      const ExpressionAttributeNamesMap: Map<string, `#_${number}_`> = new Map;
      const ProjectionExpression = peRaw
        .replace(/\s/g, '') // squish the whole thing
        .split(",") // split the big parts
        .map(peElement => {
          return peElement
            .split(".") // split the small parts
            .map(rawPePart => {
              let pePart, indexPart;
              if (rawPePart.includes("[")) {
                [pePart = '', ...indexPart] = rawPePart.split("[");
                indexPart = `[${indexPart.join('[')}`;
              } else {
                pePart = rawPePart;
                indexPart = '';
              }
              const get = ExpressionAttributeNamesMap.get(pePart);
              if (get) {
                return `${get}${indexPart}` as const;
              } else {
                let compoundEAN = `#_${i}_` as const;
                while (params.ExpressionAttributeNames?.[compoundEAN]) {
                  i++;
                  compoundEAN = `#_${i}_`;
                }
                i++;
                ExpressionAttributeNamesMap.set(pePart, compoundEAN);
                return `${compoundEAN}${indexPart}`;
              }
            })
            .join("."); // rejoin the small parts
        })
        .join(","); // rejoin the big parts
      p = {
        ...params,
        ProjectionExpression,
        ExpressionAttributeNames: {
          ...params.ExpressionAttributeNames,
          ...this.mapFlip(ExpressionAttributeNamesMap)
        }
      };
    } else {
      p = params;
    }
    if (params._logParams?.log) {
      console.log(params._logParams.message ?? '', this.myInspect(p));
    }
    return p;
  }

  private async whileLastEvaluatedKey(mp: { method: 'scan'; params: DocumentClient.ScanInput } | { method: 'query'; params: DocumentClient.QueryInput }) {
    const items: unknown[] = [];
    do {
      const { Items, LastEvaluatedKey } = await (async () => {
        if (mp.method === 'query') {
          return await this.client.query(mp.params).promise();
        } else {
          return await this.client.scan(mp.params).promise();
        }
      })();
      items.push(...Items ?? []);
      mp.params.ExclusiveStartKey = LastEvaluatedKey;
    } while (mp.params.ExclusiveStartKey);
    return items;
  }

  private myInspect(object: any) {
    return inspect(object, this.inspectOptions ?? {});
  }

}

export class BatchGetAllMaxFailedAttemptsExceededError<TS extends AnyGenericTable, Requests extends BatchGetAllRequestRequests> extends Error {
  override name = "BatchGetAllMaxFailedAttemptsExceededError" as const;
  constructor(public id: symbol, public partialResponse: BatchGetAllRequestOutput<TS, Requests>) {
    super();
  }
}
const binaryExponentialBackoff = (base: number, numFailedAttempts: number, baseDelayMs: number, jitter: boolean) => {
  let delayMs = (base ** numFailedAttempts) * baseDelayMs;
  if (jitter) {
    delayMs *= Math.random();
  }
  return new Promise(resolve => setTimeout(resolve, delayMs));
};
const isAWSError = (error: unknown): error is AWSError => error instanceof Error && "code" in error && "time" in error && error.time instanceof Date;
class BatchGetAllRequest<TS extends AnyGenericTable, Requests extends BatchGetAllRequestRequests, TableNamesAlreadySet extends string> {

  readonly #client: DocumentClient;
  readonly #requests: BatchGetAllRequestRequests;
  readonly #maxFailedAttempts: number;
  readonly #base: number;
  readonly #baseDelayMs: number;
  readonly #jitter: boolean;
  readonly #showPTEEE: boolean | ((error: AWSError) => unknown);
  readonly #id: symbol;
  constructor({
    client,
    incomingRequests,
    maxFailedAttempts,
    base,
    baseDelayMs,
    jitter,
    showProvisionedThroughputExceededExceptionError,
    id
  }: {
    client: DocumentClient;
    incomingRequests: Requests;
    maxFailedAttempts: number;
    base: number;
    baseDelayMs: number;
    jitter: boolean;
    showProvisionedThroughputExceededExceptionError: boolean | ((error: AWSError) => unknown);
    id: symbol;
  }) {
    this.#client = client;
    this.#requests = incomingRequests;
    this.#maxFailedAttempts = maxFailedAttempts;
    this.#base = base;
    this.#baseDelayMs = baseDelayMs;
    this.#jitter = jitter;
    this.#showPTEEE = showProvisionedThroughputExceededExceptionError;
    this.#id = id;
  }

  addTable<
    TN extends Exclude<TableName<TS>, TableNamesAlreadySet>,
    Keys extends readonly TableKey<TS, TN>[],
    TypeOfItem extends ExtractTableItemForKeys<TableItem<TS, TN>, Keys>,
    PE extends string,
    GAK extends GetAllKeys<TypeOfItem>,
    EANs extends ExtractEAsFromString<PE>['ean'],
    const EAN extends Record<EANs, GAK>,
    const DummyEAN extends undefined
  >(TableName: TN, request: CreateBatchGetAllRequestAddTableInput<Keys, PE, EANs, GAK, EAN, DummyEAN>) {
    const requestWithTableName = {
      ...request,
      TableName
    };
    type NewRequests = [...Requests, typeof requestWithTableName];
    const newRequests = [...this.#requests, requestWithTableName] satisfies BatchGetAllRequestRequests;
    return new BatchGetAllRequest<TS, NewRequests, TableNamesAlreadySet | TN>({
      client: this.#client,
      incomingRequests: newRequests as NewRequests,
      maxFailedAttempts: this.#maxFailedAttempts,
      base: this.#base,
      baseDelayMs: this.#baseDelayMs,
      jitter: this.#jitter,
      showProvisionedThroughputExceededExceptionError: this.#showPTEEE,
      id: this.#id
    });
  }

  addKeys<
    TN extends TableNamesAlreadySet,
    Keys extends readonly TableKey<TS, TN>[],
  >(TableName: TN, { Keys }: { Keys: Keys }) {
    type NewRequests = {
      [K in keyof Requests]:
      Requests[K]['TableName'] extends TN
      ? Omit<Requests[K], 'Keys'> & { Keys: [...Requests[K]['Keys'], ...Keys] }
      : Requests[K]
    };
    const newRequests = this.#requests.map(request => {
      if (request.TableName === TableName) {
        request.Keys = [...request.Keys, ...Keys];
      }
      return request;
    });
    return new BatchGetAllRequest<TS, NewRequests, TableNamesAlreadySet>({
      client: this.#client,
      incomingRequests: newRequests as NewRequests,
      maxFailedAttempts: this.#maxFailedAttempts,
      base: this.#base,
      baseDelayMs: this.#baseDelayMs,
      jitter: this.#jitter,
      showProvisionedThroughputExceededExceptionError: this.#showPTEEE,
      id: this.#id
    });
  }

  async execute() {
    const tableNamesToRequests: Record<string, Omit<DocumentClient.KeysAndAttributes, 'Keys'>> = {};
    const tableNamesAndKeys: { TableName: string; Key: DocumentClient.Key }[] = [];
    const tableNamesToResponses: DocumentClient.BatchGetResponseMap = {};
    for (const { TableName, Keys, ...restOfRequest } of this.#requests) {
      tableNamesToRequests[TableName] = restOfRequest;
      tableNamesToResponses[TableName] = [];
      tableNamesAndKeys.push(...Keys.map(Key => ({
        TableName,
        Key
      })));
    }

    let numFailedAttempts = -1;
    while (tableNamesAndKeys.length) {
      const keysForThisBatch = tableNamesAndKeys.splice(0, 100);
      const RequestItems: DocumentClient.BatchGetRequestMap = {};
      for (const { TableName, Key } of keysForThisBatch) {
        let tableEntry = RequestItems[TableName];
        if (!tableEntry) {
          tableEntry = RequestItems[TableName] = {
            ...tableNamesToRequests[TableName],
            Keys: []
          };
        }
        tableEntry.Keys.push(Key);
      }
      try {
        const { Responses, UnprocessedKeys } = await this.#client.batchGet({ RequestItems }).promise();
        if (Responses) {
          // TODO: should attemptNum be reset here? _If_ it should be reset, should it only be reset if UnprocessedKeys is entirely empty?
          // Regardless, if I decide I want to reset it here, make sure to change condition in if statement above to include " && Object.keys(Responses).length"!!!
          Object.entries(Responses).forEach(([TableName, Response]) => tableNamesToResponses[TableName]?.push(...Response));
        }
        if (UnprocessedKeys && Object.keys(UnprocessedKeys).length) {
          numFailedAttempts++;
          const unprocessedKeysEntries = Object.entries(UnprocessedKeys);
          for (const [TableName, { Keys }] of unprocessedKeysEntries) {
            tableNamesAndKeys.push(...Keys.map(Key => ({
              TableName,
              Key
            })));
          }
        }
      } catch (error) {
        if (isAWSError(error) && error.code === "ProvisionedThroughputExceededException") {
          if (this.#showPTEEE instanceof Function) {
            console.error(this.#showPTEEE(error));
          } else if (this.#showPTEEE) {
            console.error(error);
          }

          numFailedAttempts++;
          tableNamesAndKeys.push(...keysForThisBatch);
        } else {
          throw error;
        }
      }
      if (numFailedAttempts === this.#maxFailedAttempts - 1) {
        throw new BatchGetAllMaxFailedAttemptsExceededError(this.#id, tableNamesToResponses as BatchGetAllRequestOutput<TS, Requests>);
      }
      if (numFailedAttempts !== -1) {
        await binaryExponentialBackoff(this.#base, numFailedAttempts, this.#baseDelayMs, this.#jitter);
      }
    }
    return tableNamesToResponses as BatchGetAllRequestOutput<TS, Requests>;
  }

  get maxFailedAttempts() {
    return this.#maxFailedAttempts;
  }

  get base() {
    return this.#base;
  }

  get baseDelayMs() {
    return this.#baseDelayMs;
  }

  get jitter() {
    return this.#jitter;
  }

  isMaxFailedAttemptsExceededErrorFromThisRequest(error: unknown): error is BatchGetAllMaxFailedAttemptsExceededError<TS, Requests> {
    return error instanceof BatchGetAllMaxFailedAttemptsExceededError && error.id === this.#id;
  }

}

export declare namespace TypesafeDocumentClientv2 {

  /**
   * For convenience, returns the Key type for an Item in a Table.
   * @example
   * ```ts
   * type ThingKey = TypesafeDocumentClient.GetTableItemKey<MyTableType, Thing>;
   * ```
   */
  export type GetTableItemKey<Table extends AnyGenericTable, TypeOfItem extends TableItem<Table, Table['name']>> = TableItemKey<Table, Table['name'], TypeOfItem>;

  /**
   * For convenience, returns the type of Item that is valid for a given `createStrictUpdateSimpleSET`.
   * @example
   * ```ts
      const updateThing = tsDdb.createStrictUpdateSimpleSET(MyTable.name)<Thing>();
      type UpdateThingItem = TypesafeDocumentClient.StrictSimpleUpdateSETItem<MyTableType, Thing>;
      const Item: UpdateThingItem = { ... };
      await updateThing({ Key, Item });
   * ```
   */
  export type StrictSimpleUpdateSETItem<Table extends AnyGenericTable, TypeOfItem extends TableItem<Table, Table['name']>> =
    TableItemKey<Table, Table['name'], TypeOfItem> extends infer Key
    ? Omit<TypeOfItem, keyof Key> extends infer I
    ? Partial<I> | DeepReadonly<Partial<I>>
    : never
    : never;

}