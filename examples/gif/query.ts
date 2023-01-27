import { MyTable, tsDdb, UserID } from ".";

const userID = '12345' as UserID;
const { Items } = await tsDdb.query({
  TableName: MyTable.name,
  IndexName: MyTable.indices["lastLogin-index"].name,
  KeyConditionExpression: '#hashKey = :userID and #lastLogin >= :five',
  ExpressionAttributeNames: {
    '#hashKey': 'hashKey',
    '#lastLogin': 'lastLogin'
  },
  ExpressionAttributeValues: {
    ':userID': userID,
    ':five': Date.now() - (5 * 60000)
  }
} as const);
type u = typeof Items;
//   ^?

