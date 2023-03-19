import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { TableFromValue, Table, TypesafeDocumentClientv2, TypesafeDocumentClientRawv2 } from "ts-dynamodb";

// Step 1: define your table types
type DBUser = {
  userID: string;
  username: string;
  email: string;
  name: string;
  created: number;
  updated: number;
};

// Step 2: create a readonly table object
// satisfies is not necessary, but may provide some type hints if adding indices
// Make sure to add `as const` to tables.
export const UserTable = {
  name: `users`
} as const satisfies TableFromValue;

// Step 3: create a table type
// the Table type takes 3 (or 4) arguments: 
// 1. a TableFromValue
// 2. a union of types in the table
// 3. the primary key
// 4. optionally, sort key
export type UserTableType = Table<typeof UserTable, DBUser, 'userID'>;

// Step 4: create the client
// the client takes one type argument:
// 1. a union of table types (one client can handle all of your tables!)
export const tsDdb = new TypesafeDocumentClientv2<UserTableType>(
  new DocumentClient({ region: 'us-east-1' })
);

// Use it as you normally would (but without having to call `.promise()`)

const { Item: userDetails } = await tsDdb.get({
  TableName: UserTable.name, // 'users'
  Key: {
    userID: '123' // string
  },
  ProjectionExpression: 'username, email, name'
});
/**
  typeof userDetails = {
    username: string;
    email: string;
    name: string;
  } | undefined
 */

// To use the raw client instead, replace Step 4 with the following:
// assert the DocumentClient as TypesafeDocumentClientRawv2, passing a union of table types as the only argument
export const tsDdbRaw = new DocumentClient({
  region: 'us-east-1'
}) as TypesafeDocumentClientRawv2<UserTableType>;

const { Item: user } = await tsDdbRaw.get({
  TableName: UserTable.name, // 'users'
  Key: {
    userID: '123' // string
  },
}).promise();
/**
  typeof user = TSDdbSet<DBUser, false> | undefined
 */