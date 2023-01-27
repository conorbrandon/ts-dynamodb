import { MyTable, tsDdb, UserID } from ".";

const userID = '12345' as UserID;
const { Attributes } = await tsDdb.delete({
  TableName: MyTable.name,
  Key: {
    hashKey: userID,
    rangeKey: 'user'
  },
  ConditionExpression: 'size(#f) = :zero',
  ExpressionAttributeNames: {
    '#f': 'favoriteSites'
  },
  ExpressionAttributeValues: {
    ':zero': 0
  },
  ReturnValues: 'NONE'
} as const);
type u = typeof Attributes;
//   ^?