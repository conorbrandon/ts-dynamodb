import { TypesafePromiseResult, TypesafeCallback, TypesafeRequest, _LogParams } from "./defs-override/defs-helpers";
import { DeleteInput, DeleteOutput } from "./defs-override/delete";
import { GetInput, GetOutput, GetPEInput, GetPEOutput } from "./defs-override/get";
import { PutInput, PutOutput } from "./defs-override/put";
import { UpdateInput, UpdateOutput, UpdateSimpleSETInput, UpdateSimpleSETOutput } from "./defs-override/update";
import { ValidateInputTypesForTable } from "./type-helpers/lib/validate-input-types";
import { DeepReadonly, PickAcrossUnionOfRecords, Values } from "./type-helpers/record";
import DynamoDB, { DocumentClient } from "aws-sdk/clients/dynamodb";
import { QueryInput, QueryItemOutput, QueryItemPEOutput, QueryKeyInput, QueryKeyKey, QueryKeyOutput, QueryKeyPEInput, QueryKeyPEOutput, QueryOutput, QueryPEInput, QueryPEOutput } from "./defs-override/query";
import { NoUndefined } from "./type-helpers/utils";
import { ScanInput, ScanOutput, ScanPEInput, ScanPEOutput } from "./defs-override/scan";
import { inspect, InspectOptions } from 'util';
import { BatchGetAllRequestOutput, BatchGetAllRequestRequests, CreateBatchGetAllRequestAddTableInputBase, ValidateCreateBatchGetAllRequestAddTableInput } from "./defs-override/batchGet";
import { AWSError } from "aws-sdk";
import { CancellationReasons, TwiResponse } from "./defs-override/transactWrite/output";
import { GetNewVariadicTwiReturnValues, ValidateVariadicTwiInputs, VariadicTwiBase } from "./defs-override/transactWrite/input";

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
export type AnyGenericTable = Table<TableFromValue, Record<string, any>, string, string | undefined>;

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
  T extends T
  ? keyof Key extends keyof T
  ? Key extends Pick<T, keyof Key>
  ? T
  : never
  : never
  : never;
export type ExtractTableItemForKeys<T extends Record<string, any>, Keys extends readonly Record<string, any>[]> = {
  [Key in keyof Keys]: ExtractTableItemForKey<T, Keys[Key]>;
}[number];
export type ExtractTableItemForItem<T extends Record<string, any>, Item extends Record<string, any>> =
  T extends T
  ? Item extends T
  ? T
  : never
  : never;

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
type TableItemKey<Tables, TN extends string, Item extends TableItem<Tables, TN>> = TableKey<Tables, TN> extends infer tKey ? [keyof tKey] extends [keyof Item] ? Pick<Item, keyof tKey> : never : never;

export type PutAndDeleteReturnValues = 'NONE' | 'ALL_OLD';
export type UpdateReturnValues = 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW';
export type ReturnValuesOnConditionCheckFailureValues = 'NONE' | 'ALL_OLD';

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
    const Key extends TableKey<TS, TN>,
    PE extends string,
    const EAN extends Record<string, string>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>
  >(
    params: GetInput<TS, TN, Key, PE, EAN>,
    callback?: TypesafeCallback<
      GetOutput<PE, EAN, TypeOfItem>
    >
  ): TypesafeRequest<
    GetOutput<PE, EAN, TypeOfItem>
  >;

  put<
    TN extends TableName<TS>,
    const Item extends TableItem<TS, TN>,
    TypeOfItem extends ExtractTableItemForItem<TableItem<TS, TN>, Item>,
    CE extends string,
    RV extends PutAndDeleteReturnValues = 'NONE'
  >(
    params: PutInput<TN, Item, TypeOfItem, CE, RV>,
    callback?: TypesafeCallback<
      PutOutput<TypeOfItem, RV>
    >
  ): TypesafeRequest<
    PutOutput<TypeOfItem, RV>
  >;

  update<
    TN extends TableName<TS>,
    const Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    UE extends string,
    CE extends string,
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    RV extends UpdateReturnValues = 'NONE'
  >(
    params: UpdateInput<TN, Key, TypeOfItem, UE, CE, EAN, EAV, RV>,
    callback?: TypesafeCallback<
      UpdateOutput<TypeOfItem, UE, EAN, RV>
    >
  ): TypesafeRequest<
    UpdateOutput<TypeOfItem, UE, EAN, RV>
  >;

  delete<
    TN extends TableName<TS>,
    const Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    CE extends string,
    RV extends PutAndDeleteReturnValues = 'NONE'
  >(
    params: DeleteInput<TN, Key, TypeOfItem, CE, RV>,
    callback?: TypesafeCallback<
      DeleteOutput<TypeOfItem, RV>
    >
  ): TypesafeRequest<
    DeleteOutput<TypeOfItem, RV>
  >;

  query<
    TN extends TableName<TS>,
    KCE extends string,
    PE extends string,
    FE extends string,
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(
    params: QueryInput<TN, IndexName, KCE, PE, FE, EAN, EAV>,
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
    TypeOfItem extends TableItem<TS, TN>,
    FE extends string,
    PE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never
  >(
    params: ScanInput<TN, TypeOfItem, IndexName, FE, PE, EAN>,
    callback?: TypesafeCallback<
      ScanOutput<
        TypeOfItem,
        TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
        // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
        NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
        EAN,
        TableIndex<TS, TN, IndexName>,
        PE
      >
    >
  ): TypesafeRequest<
    ScanOutput<
      TypeOfItem,
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
    const Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    PE extends string,
    const EAN extends Record<string, string>
  >(params: GetInput<TS, TN, Key, PE, EAN>) {
    const res = await this.client.get(params).promise();
    return res as unknown as TypesafePromiseResult<GetOutput<PE, EAN, TypeOfItem>>;
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
    const Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    PE extends string | undefined = undefined
  >(params: GetPEInput<TN, Key>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const res = await this.client.get(p).promise();
    return res as unknown as TypesafePromiseResult<GetPEOutput<PE, TypeOfItem>>;
  }

  async put<
    TN extends TableName<TS>,
    const Item extends TableItem<TS, TN>,
    TypeOfItem extends ExtractTableItemForItem<TableItem<TS, TN>, Item>,
    CE extends string,
    RV extends PutAndDeleteReturnValues = 'NONE'
  >(params: PutInput<TN, Item, TypeOfItem, CE, RV>) {
    const res = await this.client.put(params).promise();
    return res as unknown as TypesafePromiseResult<PutOutput<TypeOfItem, RV>>;
  }

  async update<
    TN extends TableName<TS>,
    const Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    UE extends string,
    CE extends string,
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    RV extends UpdateReturnValues = 'NONE'
  >(params: UpdateInput<TN, Key, TypeOfItem, UE, CE, EAN, EAV, RV>) {
    const res = await this.client.update(params).promise();
    return res as unknown as TypesafePromiseResult<UpdateOutput<TypeOfItem, UE, EAN, RV>>;
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
    const Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    const Item extends Record<string, any>,
    UpdateKeys extends Exclude<keyof TypeOfItem, keyof Key>,
    AS extends string,
    RV extends UpdateReturnValues = 'NONE'
  >(params: UpdateSimpleSETInput<TN, Key, TypeOfItem, Item, UpdateKeys, AS, RV>) {
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
    return res as unknown as TypesafePromiseResult<UpdateSimpleSETOutput<Item, TypeOfItem, RV>>;
  }

  async delete<
    TN extends TableName<TS>,
    const Key extends TableKey<TS, TN>,
    TypeOfItem extends ExtractTableItemForKey<TableItem<TS, TN>, Key>,
    CE extends string,
    RV extends PutAndDeleteReturnValues = 'NONE'
  >(params: DeleteInput<TN, Key, TypeOfItem, CE, RV>) {
    const res = await this.client.delete(params).promise();
    return res as unknown as TypesafePromiseResult<DeleteOutput<TypeOfItem, RV>>;
  }

  async query<
    TN extends TableName<TS>,
    KCE extends string,
    PE extends string,
    FE extends string,
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryInput<TN, IndexName, KCE, PE, FE, EAN, EAV>) {
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
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryPEInput<TN, IndexName, KCE, FE, EAN, EAV>, ProjectionExpression?: PE) {
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
    TypeOfItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    TypeOfIndex extends TableIndex<TS, TN, IndexName>,
    const Key extends QueryKeyKey<TypeOfItem, IndexName, TypeOfIndex, TableKey<TS, TN>, PartitionKeyField>,
    PE extends string,
    FE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryKeyInput<TN, Key, IndexName, PE, FE, EAN>) {
    const finalParams = this.getKCEFromQueryKey(params);
    if (finalParams._logParams?.log) {
      console.log(finalParams._logParams.message ?? '', this.myInspect(finalParams));
    }
    const res = await this.client.query(finalParams).promise();
    return res as QueryKeyOutput<
      Key,
      TypeOfItem,
      PartitionKeyField,
      SortKeyField,
      EAN,
      TypeOfIndex,
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
    TypeOfItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    TypeOfIndex extends TableIndex<TS, TN, IndexName>,
    const Key extends QueryKeyKey<TypeOfItem, IndexName, TypeOfIndex, TableKey<TS, TN>, PartitionKeyField>,
    FE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never,
    PE extends string | undefined = undefined
  >(params: QueryKeyPEInput<TN, Key, IndexName, FE, EAN>, ProjectionExpression?: PE) {
    const queryParams = this.getKCEFromQueryKey(params);
    const finalParams = this.parsePEConstructedParamsAndLog(queryParams, ProjectionExpression);
    const res = await this.client.query(finalParams).promise();
    return res as QueryKeyPEOutput<
      Key,
      TypeOfItem,
      PartitionKeyField,
      SortKeyField,
      TypeOfIndex,
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
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryInput<TN, IndexName, KCE, PE, FE, EAN, EAV>) {
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
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryPEInput<TN, IndexName, KCE, FE, EAN, EAV>, ProjectionExpression?: PE) {
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
    TypeOfItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    TypeOfIndex extends TableIndex<TS, TN, IndexName>,
    const Key extends QueryKeyKey<TypeOfItem, IndexName, TypeOfIndex, TableKey<TS, TN>, PartitionKeyField>,
    PE extends string,
    FE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryKeyInput<TN, Key, IndexName, PE, FE, EAN>) {
    const finalParams = this.getKCEFromQueryKey(params);
    if (finalParams._logParams?.log) {
      console.log(finalParams._logParams.message ?? '', this.myInspect(finalParams));
    }
    const res = await this.whileLastEvaluatedKey({ method: 'query', params: finalParams });
    return res as NoUndefined<QueryKeyOutput<
      Key,
      TypeOfItem,
      PartitionKeyField,
      SortKeyField,
      EAN,
      TypeOfIndex,
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
    TypeOfItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    TypeOfIndex extends TableIndex<TS, TN, IndexName>,
    const Key extends QueryKeyKey<TypeOfItem, IndexName, TypeOfIndex, TableKey<TS, TN>, PartitionKeyField>,
    FE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never,
    PE extends string | undefined = undefined
  >(params: QueryKeyPEInput<TN, Key, IndexName, FE, EAN>, ProjectionExpression?: PE) {
    const queryParams = this.getKCEFromQueryKey(params);
    const finalParams = this.parsePEConstructedParamsAndLog(queryParams, ProjectionExpression);
    const res = await this.whileLastEvaluatedKey({ method: 'query', params: finalParams });
    return res as NoUndefined<QueryKeyPEOutput<
      Key,
      TypeOfItem,
      PartitionKeyField,
      SortKeyField,
      TypeOfIndex,
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
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryInput<TN, IndexName, KCE, PE, FE, EAN, EAV>) {
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
    const EAN extends Record<string, string>,
    const EAV extends Record<string, any>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryPEInput<TN, IndexName, KCE, FE, EAN, EAV>, ProjectionExpression?: PE) {
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
    TypeOfItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    TypeOfIndex extends TableIndex<TS, TN, IndexName>,
    const Key extends QueryKeyKey<TypeOfItem, IndexName, TypeOfIndex, TableKey<TS, TN>, PartitionKeyField>,
    PE extends string,
    FE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: QueryKeyInput<TN, Key, IndexName, PE, FE, EAN>) {
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
      TypeOfItem,
      PartitionKeyField,
      SortKeyField,
      EAN,
      TypeOfIndex,
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
    TypeOfItem extends TableItem<TS, TN>,
    PartitionKeyField extends TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
    SortKeyField extends NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
    TypeOfIndex extends TableIndex<TS, TN, IndexName>,
    const Key extends QueryKeyKey<TypeOfItem, IndexName, TypeOfIndex, TableKey<TS, TN>, PartitionKeyField>,
    FE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never,
    PE extends string | undefined = undefined
  >(params: QueryKeyPEInput<TN, Key, IndexName, FE, EAN>, ProjectionExpression?: PE) {
    const queryParams = this.getKCEFromQueryKey(params);
    const finalParams = this.parsePEConstructedParamsAndLog(queryParams, ProjectionExpression);
    const { Items = [] } = await this.client.query(finalParams).promise();
    const Item = Items[0];
    if (!Item) {
      return undefined;
    }
    return Item as NoUndefined<QueryKeyPEOutput<
      Key,
      TypeOfItem,
      PartitionKeyField,
      SortKeyField,
      TypeOfIndex,
      PE
    >['Items']>[number];
  }

  async scan<
    TN extends TableName<TS>,
    TypeOfItem extends TableItem<TS, TN>,
    FE extends string,
    PE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanInput<TN, TypeOfItem, IndexName, FE, PE, EAN>) {
    const res = await this.client.scan(params).promise();
    return res as unknown as TypesafePromiseResult<ScanOutput<
      TypeOfItem,
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
    TypeOfItem extends TableItem<TS, TN>,
    FE extends string,
    const EAN extends Record<string, string>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanPEInput<TN, TypeOfItem, IndexName, FE, EAN>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const res = await this.client.scan(p).promise();
    return res as unknown as TypesafePromiseResult<ScanPEOutput<
      TypeOfItem,
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
    TypeOfItem extends TableItem<TS, TN>,
    FE extends string,
    PE extends string,
    const EAN extends Record<string, string>,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanInput<TN, TypeOfItem, IndexName, FE, PE, EAN>) {
    const items: unknown[] = await this.whileLastEvaluatedKey({ method: 'scan', params });
    return items as unknown as NoUndefined<ScanOutput<
      TypeOfItem,
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
    TypeOfItem extends TableItem<TS, TN>,
    FE extends string,
    const EAN extends Record<string, string>,
    PE extends string | undefined = undefined,
    IndexName extends TableIndexName<TS, TN> = never
  >(params: ScanPEInput<TN, TypeOfItem, IndexName, FE, EAN>, ProjectionExpression?: PE) {
    const p = this.parsePEConstructedParamsAndLog(params, ProjectionExpression);
    const items: unknown[] = await this.whileLastEvaluatedKey({ method: 'scan', params: p });
    return items as unknown as NoUndefined<ScanPEOutput<
      TypeOfItem,
      TableKeyPartitionSortRaw<TS, TN>['partitionKey'],
      // This is a little dodgy, sortKey must be defined on the table IF an LSI is used, and if I can't find a way to enforce that above, this'll have to do. 
      NoUndefined<TableKeyPartitionSortRaw<TS, TN>['sortKey']>,
      EAN,
      TableIndex<TS, TN, IndexName>,
      PE
    >['Items']>;
  }

  /**
   * Creates a `BatchGetAllRequest`. A `BatchGetAllRequest` iterates through all `Keys` across all tables a maximum of
   * {@link batchSize} (defaults to 100) at a time (so you can add as many `Keys` as you want!)
   * and calls {@link DocumentClient.batchGet} on each batch of `Keys`.
   * 
   * `Keys` and `ProjectionExpressions` for a table can be added using `addTable`.
   * `Keys` can still be added after a table is added using `addKeys`. When you are ready to send the request, call `execute`.
   * 
   * Please note the request is _immutable_. Each method call returns a new instance. This means you can chain method calls, or if not chaining,
   * you must assign the request to a new variable or reassign the request back to itself after each method call.
   * 
   * If `batchGet` returns {@link DocumentClient.BatchGetItemOutput.UnprocessedKeys} or a `ProvisionedThroughputExceededException` is thrown 
   * (both of which are considered a "failed attempt"), exponential backoff with {@link base} is used to retry up to {@link maxFailedAttempts}. 
   * Note that the number of failed attempts is decremented after a "successful attempt" 
   * (defined as a `batchGet` call that does not return `UnprocessedKeys` __and__ does not throw a `ProvisionedThroughputExceededException`).
   * 
   * For example (assuming `base` = 2 and {@link baseDelayMs} = 100), if the first attempt fails, the number of failed attempts is now 1.
   * The function will sleep for 100 milliseconds. If the second attempt also fails,
   * the number of failed attempts is 2. The function will sleep for 200 milliseconds.
   * If the third attempt succeeds, the number of failed attempts is 1 again, and the function will sleep for 100 milliseconds before trying
   * the fourth attempt. If the fourth attempt succeeds, the function will immediately try the fifth attempt.
   * This flow can be monitored by using {@link preBackoffCb}. (Note: `preBackoffCb` is only called if the function actually needs to back off, i.e., `preBackoffCb` will never be called with `numFailedAttempts` equal to 0.)
   * 
   * By default, `UnprocessedKeys` are pushed (i.e., retried later). This behavior can be customized by providing {@link unprocessedKeysRetryBehavior}
   * to instead unshift (i.e. retried immediately in the next batch).
   */
  createBatchGetAllRequest({
    maxFailedAttempts = 10,
    base = 2,
    baseDelayMs = 100,
    jitter = false,
    unprocessedKeysRetryBehavior = 'push',
    batchSize = 100,
    preBackoffCb,
    showProvisionedThroughputExceededExceptionError = false
  }: {
    maxFailedAttempts?: number;
    base?: number;
    baseDelayMs?: number;
    jitter?: boolean;
    unprocessedKeysRetryBehavior?: 'push' | 'unshift';
    batchSize?: number;
    /** A function that takes configured backoff parameters and the actual delayMs and logs them (or even performs some other side effect). */
    preBackoffCb?: PreBackoffCb;
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
    if (base < 0) {
      throw Error("base must be >= 0!");
    }
    if (baseDelayMs < 0) {
      throw Error("baseDelayMs must be >= 0!");
    }
    if (batchSize < 1 || batchSize > 100) {
      throw Error("batchSize must be >= 1 and <= 100!");
    }
    return new BatchGetAllRequest<TS, [], never, "NONE">({
      client: this.client,
      incomingRequests: [],
      maxFailedAttempts,
      base,
      baseDelayMs,
      jitter,
      unprocessedKeysRetryBehavior,
      batchSize,
      preBackoffCb,
      showProvisionedThroughputExceededExceptionError,
      id: Symbol(),
      ReturnConsumedCapacity: "NONE"
    });
  }

  /**
   * Creates a `TransactWriteItemsRequest`. Add items to the internal {@link DocumentClient.TransactWriteItemList} with `push`.
   * `push` allows adding multiple items through rest parameters. Conditionally add items with `$push`
   * (please hover over or refer to the JS doc for `$push` for more details).
   * 
   * Other request options can be set using `setClientRequestToken`, `setReturnConsumedCapacity`, and `setReturnItemCollectionMetrics`.
   * When you are ready to send the request, call `execute`.
   * 
   * Please note the request is _mutable_. Each method call returns the same instance (i.e. itself). This means you can chain method calls,
   * but you don't have to. This is a consideration for logic that needs to conditionally push items onto the request 
   * (although the recommended flow is to use `$push`), as it would be burdensome
   * to have to assign the request back to a variable after each push. (Note: upon transaction failure, if you wish to process the `CancellationReasons` array in a `TransactWriteItemsParsedError` 
   * in a strongly typed fashion wherein it includes _all_ possible items that set `ReturnValuesOnConditionCheckFailure`,
   * you _must_ assign the request back to a new variable given the absence of [microsoft/TypeScript#10421](https://github.com/microsoft/TypeScript/issues/10421).)
   * 
   * If the transaction succeeds, the response is simply {@link DocumentClient.TransactWriteItemsOutput}.
   * 
   * If the transaction fails, a {@link TransactWriteItemsParsedError} is thrown. 
   * You can strongly type this error by using {@link TransactWriteItemsRequest.isParsedErrorFromThisRequest} on the `TransactWriteItemsRequest` instance.
   * `CancellationReasons` will contain reasons for all items, and is strongly typed such that only items that specified a
   * `ConditionExpression` and `ReturnValuesOnConditionCheckFailure == 'ALL_OLD'` will appear on the `Item` property of a reason.
   * However, `CancellationReasons` is not _typed_ such that the reasons are guaranteed to appear 
   * in the order of items in the internal `TransactWriteItemList` (i.e., a tuple), however at runtime they _should_ technically be in the same order
   * (of course with the items passed to `$push` that did not result in them _actually_ getting pushed omitted).
   */
  createTransactWriteItemsRequest() {
    return new TransactWriteItemsRequest<TS, 'NONE', 'NONE', never>({
      client: this.client,
      ClientRequestToken: undefined,
      ReturnConsumedCapacity: "NONE",
      ReturnItemCollectionMetrics: "NONE",
      id: Symbol(),
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

  private getUpdateSimpleSETParams(Key: Record<string, unknown>, Item: Record<string, unknown>, extraConditions?: { ANDSuffix: string; extraExpressionAttributeNames?: Record<string, string>; extraExpressionAttributeValues?: Record<string, unknown> }) {
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

  private getKCEFromQueryKey<RawParams extends { Key: Record<string, unknown>; ExpressionAttributeNames?: Record<string, string>; ExpressionAttributeValues?: Record<string, unknown> }>(params: RawParams) {
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

  private parsePEConstructedParamsAndLog<RawParams extends { ExpressionAttributeNames?: Record<string, string>; _logParams?: _LogParams }>(params: RawParams, peRaw: string | undefined) {
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

class BatchGetAllMaxFailedAttemptsExceededError<TS extends AnyGenericTable, Requests extends BatchGetAllRequestRequests, RCC extends "INDEXES" | "TOTAL" | "NONE"> extends Error {
  override name = "BatchGetAllMaxFailedAttemptsExceededError" as const;
  constructor(public readonly id: symbol, public readonly partialResponse: BatchGetAllRequestOutput<TS, Requests, RCC>) {
    super();
  }
}
type BackoffCbArgs = {
  numFailedAttempts: number;
  base: number;
  baseDelayMs: number;
  jitter: boolean;
  delayMs: number;
};
type PreBackoffCb = (args: BackoffCbArgs) => void;
const exponentialBackoff = ({
  base,
  numFailedAttempts,
  baseDelayMs,
  jitter,
  preBackoffCb
}: {
  base: number;
  numFailedAttempts: number;
  baseDelayMs: number;
  jitter: boolean;
  preBackoffCb: PreBackoffCb | undefined;
}) => {
  let delayMs = (base ** numFailedAttempts) * baseDelayMs;
  if (jitter) {
    delayMs *= Math.random();
  }
  if (preBackoffCb) {
    preBackoffCb({
      numFailedAttempts: numFailedAttempts + 1,
      base,
      baseDelayMs,
      jitter,
      delayMs
    });
  }
  return new Promise(resolve => setTimeout(resolve, delayMs));
};
const isAWSError = (error: unknown): error is AWSError => error instanceof Error && "code" in error && "time" in error && error.time instanceof Date;
class BatchGetAllRequest<TS extends AnyGenericTable, Requests extends BatchGetAllRequestRequests, TableNamesAlreadySet extends string, RCC extends "INDEXES" | "TOTAL" | "NONE"> {

  readonly #client: DocumentClient;
  readonly #requests: Requests;
  readonly #maxFailedAttempts: number;
  readonly #base: number;
  readonly #baseDelayMs: number;
  readonly #jitter: boolean;
  readonly #unprocessedKeysRetryBehavior: 'push' | 'unshift';
  readonly #batchSize: number;
  readonly #preBackoffCb: PreBackoffCb | undefined;
  readonly #showPTEEE: boolean | ((error: AWSError) => unknown);
  readonly #id: symbol;
  readonly #ReturnConsumedCapacity: RCC;
  constructor({
    client,
    incomingRequests,
    maxFailedAttempts,
    base,
    baseDelayMs,
    jitter,
    unprocessedKeysRetryBehavior,
    batchSize,
    preBackoffCb,
    showProvisionedThroughputExceededExceptionError,
    id,
    ReturnConsumedCapacity
  }: {
    client: DocumentClient;
    incomingRequests: Requests;
    maxFailedAttempts: number;
    base: number;
    baseDelayMs: number;
    jitter: boolean;
    unprocessedKeysRetryBehavior: 'push' | 'unshift';
    batchSize: number;
    preBackoffCb: PreBackoffCb | undefined;
    showProvisionedThroughputExceededExceptionError: boolean | ((error: AWSError) => unknown);
    id: symbol;
    ReturnConsumedCapacity: RCC;
  }) {
    this.#client = client;
    this.#requests = incomingRequests;
    this.#maxFailedAttempts = maxFailedAttempts;
    this.#base = base;
    this.#baseDelayMs = baseDelayMs;
    this.#jitter = jitter;
    this.#preBackoffCb = preBackoffCb;
    this.#unprocessedKeysRetryBehavior = unprocessedKeysRetryBehavior;
    this.#batchSize = batchSize;
    this.#showPTEEE = showProvisionedThroughputExceededExceptionError;
    this.#id = id;
    this.#ReturnConsumedCapacity = ReturnConsumedCapacity;
  }

  addTable<
    TN extends Exclude<TableName<TS>, TableNamesAlreadySet>,
    const Params extends CreateBatchGetAllRequestAddTableInputBase<TS, TN>
  >(TableName: TN, request: ValidateCreateBatchGetAllRequestAddTableInput<TS, TN, Params>) {
    const requestWithTableName = {
      ...request,
      TableName
    };
    type NewRequests = [...Requests, Params & { TableName: TN }];
    const newRequests = [...this.#requests, requestWithTableName] satisfies BatchGetAllRequestRequests;
    return new BatchGetAllRequest<TS, NewRequests, TableNamesAlreadySet | TN, RCC>({
      client: this.#client,
      incomingRequests: newRequests as NewRequests,
      maxFailedAttempts: this.#maxFailedAttempts,
      base: this.#base,
      baseDelayMs: this.#baseDelayMs,
      jitter: this.#jitter,
      unprocessedKeysRetryBehavior: this.#unprocessedKeysRetryBehavior,
      batchSize: this.#batchSize,
      preBackoffCb: this.#preBackoffCb,
      showProvisionedThroughputExceededExceptionError: this.#showPTEEE,
      id: this.#id,
      ReturnConsumedCapacity: this.#ReturnConsumedCapacity
    });
  }

  addKeys<
    TN extends TableNamesAlreadySet,
    const Keys extends readonly TableKey<TS, TN>[],
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
    return new BatchGetAllRequest<TS, NewRequests, TableNamesAlreadySet, RCC>({
      client: this.#client,
      incomingRequests: newRequests as NewRequests,
      maxFailedAttempts: this.#maxFailedAttempts,
      base: this.#base,
      baseDelayMs: this.#baseDelayMs,
      jitter: this.#jitter,
      unprocessedKeysRetryBehavior: this.#unprocessedKeysRetryBehavior,
      batchSize: this.#batchSize,
      preBackoffCb: this.#preBackoffCb,
      showProvisionedThroughputExceededExceptionError: this.#showPTEEE,
      id: this.#id,
      ReturnConsumedCapacity: this.#ReturnConsumedCapacity
    });
  }

  setReturnConsumedCapacity<RCC extends "INDEXES" | "TOTAL" | "NONE">(ReturnConsumedCapacity: RCC) {
    return new BatchGetAllRequest<TS, Requests, TableNamesAlreadySet, RCC>({
      client: this.#client,
      incomingRequests: this.#requests,
      maxFailedAttempts: this.#maxFailedAttempts,
      base: this.#base,
      baseDelayMs: this.#baseDelayMs,
      jitter: this.#jitter,
      unprocessedKeysRetryBehavior: this.#unprocessedKeysRetryBehavior,
      batchSize: this.#batchSize,
      preBackoffCb: this.#preBackoffCb,
      showProvisionedThroughputExceededExceptionError: this.#showPTEEE,
      id: this.#id,
      ReturnConsumedCapacity
    });
  }

  async execute() {
    const tableNamesToRequests: Record<string, Omit<DocumentClient.KeysAndAttributes, 'Keys'>> = {};
    const tableNamesAndKeys: { TableName: string; Key: DocumentClient.Key }[] = [];
    const tableNamesToResponses: DocumentClient.BatchGetResponseMap = {};
    const allConsumedCapacity: DocumentClient.ConsumedCapacityMultiple | undefined = this.#ReturnConsumedCapacity !== 'NONE' ? [] : undefined;
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
      const keysForThisBatch = tableNamesAndKeys.splice(0, this.#batchSize);
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
        const { Responses, UnprocessedKeys, ConsumedCapacity } = await this.#client.batchGet({ RequestItems, ReturnConsumedCapacity: this.#ReturnConsumedCapacity }).promise();
        allConsumedCapacity?.push(...ConsumedCapacity ?? []);
        if (Responses) {
          Object.entries(Responses).forEach(([TableName, Response]) => tableNamesToResponses[TableName]?.push(...Response));
        }
        let gotUnprocessedKeys = false;
        if (UnprocessedKeys && Object.keys(UnprocessedKeys).length) {
          gotUnprocessedKeys = true;
          const unprocessedKeysEntries = Object.entries(UnprocessedKeys);
          for (const [TableName, { Keys }] of unprocessedKeysEntries) {
            tableNamesAndKeys[this.#unprocessedKeysRetryBehavior](...Keys.map(Key => ({
              TableName,
              Key
            })));
          }
        }
        if (gotUnprocessedKeys) {
          numFailedAttempts++;
        } else if (numFailedAttempts > -1) {
          numFailedAttempts--;
        }
      } catch (error) {
        if (isAWSError(error) && error.code === "ProvisionedThroughputExceededException") {
          if (this.#showPTEEE instanceof Function) {
            console.error(this.#showPTEEE(error));
          } else if (this.#showPTEEE) {
            console.error(error);
          }

          numFailedAttempts++;
          tableNamesAndKeys[this.#unprocessedKeysRetryBehavior](...keysForThisBatch);
        } else {
          throw error;
        }
      }
      if (numFailedAttempts === this.#maxFailedAttempts - 1) {
        const partialResponse = {
          Responses: tableNamesToResponses,
          ConsumedCapacity: allConsumedCapacity
        } satisfies { Responses: DocumentClient.BatchGetResponseMap; ConsumedCapacity: DocumentClient.ConsumedCapacityMultiple | undefined };
        throw new BatchGetAllMaxFailedAttemptsExceededError(this.#id, partialResponse as unknown as BatchGetAllRequestOutput<TS, Requests, RCC>);
      }
      if (numFailedAttempts !== -1) {
        await exponentialBackoff({
          base: this.#base,
          numFailedAttempts,
          baseDelayMs: this.#baseDelayMs,
          jitter: this.#jitter,
          preBackoffCb: this.#preBackoffCb
        });
      }
    }
    const response = {
      Responses: tableNamesToResponses,
      ConsumedCapacity: allConsumedCapacity
    } satisfies { Responses: DocumentClient.BatchGetResponseMap; ConsumedCapacity: DocumentClient.ConsumedCapacityMultiple | undefined };
    return response as unknown as BatchGetAllRequestOutput<TS, Requests, RCC>;
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

  get unprocessedKeysRetryBehavior() {
    return this.#unprocessedKeysRetryBehavior;
  }

  get batchSize() {
    return this.#batchSize;
  }

  get ReturnConsumedCapacity() {
    return this.#ReturnConsumedCapacity;
  }

  isMaxFailedAttemptsExceededErrorFromThisRequest(error: unknown): error is BatchGetAllMaxFailedAttemptsExceededError<TS, Requests, RCC> {
    return error instanceof BatchGetAllMaxFailedAttemptsExceededError && error.id === this.#id;
  }

}

const converter = DynamoDB.Converter;

const reasonHasCode = (reason: unknown): reason is Record<string, unknown> & { Code: string } => {
  return typeof reason === 'object' && !!reason && "Code" in reason && typeof reason.Code === 'string';
};
const isConditionalCheckFailedReason = (reason: Record<string, unknown> & { Code: string }): reason is Record<string, unknown> & { Code: "ConditionalCheckFailed" } => {
  return reason.Code === "ConditionalCheckFailed";
};
const conditionalCheckFailedReasonHasItem = (reason: Record<string, unknown> & { Code: "ConditionalCheckFailed" }): reason is Record<string, unknown> & { Code: "ConditionalCheckFailed"; Item: Record<string, any> } => {
  return "Item" in reason && typeof reason['Item'] === 'object' && !!reason['Item'];
};
class TransactWriteItemsParsedError<ReturnValues extends Record<string, unknown>> extends Error {
  override name = "TransactWriteItemsParsedError" as const;
  constructor(public readonly id: symbol, public readonly transactWriteError: unknown, public readonly CancellationReasons: CancellationReasons<ReturnValues>) {
    super();
  }
}
type ShouldPush = {
  shouldPush: boolean;
  inputs: readonly DocumentClient.TransactWriteItem[];
};
class TransactWriteItemsRequest<TS extends AnyGenericTable, RCC extends "INDEXES" | "TOTAL" | "NONE", RICM extends "SIZE" | "NONE", ReturnValues extends Record<string, unknown>> {

  readonly #client: DocumentClient;
  #ClientRequestToken: string | undefined;
  #ReturnConsumedCapacity: RCC;
  #ReturnItemCollectionMetrics: RICM;
  readonly #id: symbol;
  readonly #shouldPushPromises: (ShouldPush | Promise<ShouldPush>)[] = [];
  #minLength: number = 0;
  #maxPossibleLength: number = 0;
  constructor({
    client,
    ClientRequestToken,
    ReturnConsumedCapacity,
    ReturnItemCollectionMetrics,
    id
  }: {
    client: DocumentClient;
    ClientRequestToken: string | undefined;
    ReturnConsumedCapacity: RCC;
    ReturnItemCollectionMetrics: RICM;
    id: symbol;
  }) {
    this.#client = client;
    this.#ClientRequestToken = ClientRequestToken;
    this.#ReturnConsumedCapacity = ReturnConsumedCapacity;
    this.#ReturnItemCollectionMetrics = ReturnItemCollectionMetrics;
    this.#id = id;
  }

  push<const Inputs extends readonly VariadicTwiBase<TS>[]>(...inputs: ValidateVariadicTwiInputs<TS, Inputs>) {
    this.#minLength += inputs.length;
    this.#maxPossibleLength += inputs.length;
    this.#shouldPushPromises.push({
      shouldPush: true,
      inputs
    });
    type newReturnValues = GetNewVariadicTwiReturnValues<TS, Inputs>;
    return this as TransactWriteItemsRequest<TS, RCC, RICM, ReturnValues | newReturnValues>;
  }

  /** 
   * Conditionally add items to the `TransactWriteItemList`. Pass a `boolean` or a `Promise` that resolves to a `boolean`.
   * Items are pushed if it is `true` or resolves to `true`.
   * 
   * Please note: if passing a `Promise`, it - in fact, all `Promises` passed to this method throughout the request's construction -
   * are `await`ed upon calling {@link execute}, but before the `transactWrite` call to the SDK. `Promise`s are awaited with a simple
   * `Promise.all`. Internally, `Promise`s are managed such that `CancellationReasons` will still be in order
   * (of course with the items passed to `$push` that did not result in them _actually_ getting pushed omitted).
   * 
   * The number of unresolved `shouldPush` promises is currently not customizable. If you wish to add many `shouldPush` promises but don't
   * want them to be all be unresolved at once, you should keep a reference to them and `await` them separately as you are constructing
   * the request.
   */
  $push<const Inputs extends readonly VariadicTwiBase<TS>[]>(shouldPush: boolean | Promise<boolean>, ...inputs: ValidateVariadicTwiInputs<TS, Inputs>) {
    if (shouldPush instanceof Promise) {
      this.#maxPossibleLength += inputs.length;
      const awaitableShouldPush = shouldPush
        .then(shouldActuallyPush => {
          if (shouldActuallyPush) {
            this.#minLength += inputs.length;
          }
          return {
            shouldPush: shouldActuallyPush,
            inputs
          };
        });
      this.#shouldPushPromises.push(awaitableShouldPush);
    } else if (shouldPush) {
      this.#minLength += inputs.length;
      this.#maxPossibleLength += inputs.length;
      this.#shouldPushPromises.push({
        shouldPush,
        inputs
      });
    }
    type newReturnValues = GetNewVariadicTwiReturnValues<TS, Inputs>;
    return this as TransactWriteItemsRequest<TS, RCC, RICM, ReturnValues | newReturnValues>;
  }

  async execute(): Promise<TwiResponse<RCC, RICM>> {
    const TransactItems: DynamoDB.DocumentClient.TransactWriteItem[] = [];
    const shouldPushes = await Promise.all(this.#shouldPushPromises);
    shouldPushes.forEach(item => item.shouldPush && TransactItems.push(...item.inputs));
    const transactionRequest = this.#client.transactWrite({
      TransactItems,
      ClientRequestToken: this.#ClientRequestToken,
      ReturnConsumedCapacity: this.#ReturnConsumedCapacity,
      ReturnItemCollectionMetrics: this.#ReturnItemCollectionMetrics
    });
    let CancellationReasons: CancellationReasons;
    transactionRequest.on('extractError', response => {
      let maybeCancellationReasons;
      try {
        maybeCancellationReasons = (JSON.parse(response.httpResponse.body.toString()) as Record<string, unknown>)['CancellationReasons'];
      } catch (error) { }
      if (!Array.isArray(maybeCancellationReasons)) {
        return;
      }
      CancellationReasons = maybeCancellationReasons
        .map((reason: unknown) => {
          if (!reasonHasCode(reason)) {
            return undefined;
          }
          if (!isConditionalCheckFailedReason(reason)) {
            return reason as { Code: string; Message?: string };
          }
          if (!conditionalCheckFailedReasonHasItem(reason)) {
            return reason;
          }
          try {
            const convertedItem = converter.unmarshall(reason.Item);
            return {
              ...reason,
              Item: convertedItem
            };
          } catch (error) {
            return {
              ...reason,
              // If we can't unmarshall an Item, don't return it at all. 
              // This is because a "marshalled" Item will pass "in" checks (for example), 
              // but because it is still marshalled, the narrowed type will be inaccurate.
              Item: undefined
            };
          }
        })
        .filter((reason): reason is NonNullable<typeof reason> => !!reason);
    });
    const p = new Promise<DocumentClient.TransactWriteItemsOutput>((resolve, reject) => {
      transactionRequest.send((error, response) => {
        if (error) {
          reject(error);
        }
        resolve(response);
      });
    });
    try {
      return await p;
    } catch (error) {
      throw new TransactWriteItemsParsedError(this.#id, error, CancellationReasons);
    }
  }

  get ClientRequestToken() {
    return this.#ClientRequestToken;
  }
  setClientRequestToken(ClientRequestToken: string) {
    this.#ClientRequestToken = ClientRequestToken;
    return this;
  }

  get ReturnConsumedCapacity() {
    return this.#ReturnConsumedCapacity;
  }
  setReturnConsumedCapacity<RCC extends "INDEXES" | "TOTAL" | "NONE">(ReturnConsumedCapacity: RCC) {
    this.#ReturnConsumedCapacity = ReturnConsumedCapacity as any;
    return this as unknown as TransactWriteItemsRequest<TS, RCC, RICM, ReturnValues>;
  }

  get ReturnItemCollectionMetrics() {
    return this.#ReturnItemCollectionMetrics;
  }
  setReturnItemCollectionMetrics<RICM extends "SIZE" | "NONE">(ReturnItemCollectionMetrics: RICM) {
    this.#ReturnItemCollectionMetrics = ReturnItemCollectionMetrics as any;
    return this as unknown as TransactWriteItemsRequest<TS, RCC, RICM, ReturnValues>;
  }

  /** 
   * Returns the length of the internal {@link DocumentClient.TransactWriteItemList} array.
   * 
   * `minLength` is the number of items that are certain to be in the `TransactWriteItemList`. This value is updated
   * upon every call to `push`, when `shouldPush` is passed to `$push` as `true`, and when `shouldPush` is passed
   * as a `Promise` to `$push` and resolves to `true`.
   * 
   * `maxPossibleLength` is the number of items that _could_ be in the `TransactWriteItemsList`. This value is updated
   * upon every call to `push`, when `shouldPush` is passed to `$push` as `true`, and when `shouldPush` is passed
   * as a `Promise` to `$push` but _BEFORE_ the `Promise` resolves.
   */
  get length(): { minLength: number; maxPossibleLength: number } {
    return {
      minLength: this.#minLength,
      maxPossibleLength: this.#maxPossibleLength
    };
  }

  isParsedErrorFromThisRequest(error: unknown): error is TransactWriteItemsParsedError<ReturnValues> {
    return error instanceof TransactWriteItemsParsedError && error.id === this.#id;
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
   * For convenience, returns the type of Item that is valid for a given `updateSimpleSET`.
   */
  export type GetUpdateSimpleSETItem<Table extends AnyGenericTable, TypeOfItem extends TableItem<Table, Table['name']>> =
    TableItemKey<Table, Table['name'], TypeOfItem> extends infer Key
    ? Omit<TypeOfItem, keyof Key> extends infer I
    ? Partial<I> | DeepReadonly<Partial<I>>
    : never
    : never;

}