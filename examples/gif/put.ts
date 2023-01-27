import { MyTable, PositiveNumber, tsDdb, User, UserID } from ".";

const userID = '12345' as UserID;
const user = {
  hashKey: userID,
  rangeKey: 'user',
  created: Date.now(),
  username: 'ts-ddb',
  email: 'ts-ddb@example.com',
  name: 'ts-dynamodb',
  role: 'user',
  lastLogin: Date.now(),
  numLogins: 1 as PositiveNumber
} as const satisfies User;

const { Attributes } = await tsDdb.put({
  TableName: MyTable.name,
  Item: user,
  ReturnValues: 'ALL_OLD'
} as const);
type u = typeof Attributes;
//   ^?