import { MyTable, PositiveNumber, SiteID, tsDdb, UserID } from ".";

const userID = '12345' as UserID;
const siteID = 'abc' as SiteID;
const { Attributes } = await tsDdb.update({
  TableName: MyTable.name,
  Key: {
    hashKey: siteID,
    rangeKey: 'site'
  },
  UpdateExpression: 'SET categories = list_append(if_not_exists(categories, :empty), :c)',
  ExpressionAttributeValues: {
    ':c': ['aws', 'dynamodb'],
    ':empty': []
  },
  ReturnValues: 'UPDATED_OLD'
});
type u = typeof Attributes;
//   ^?

const Item = {
  role: 'admin',
  lastLogin: Date.now()
} as const;
const { Attributes: updatedUser } = await tsDdb.updateSimpleSET({
  TableName: MyTable.name,
  Key: {
    hashKey: userID,
    rangeKey: 'user'
  },
  Item,
  ReturnValues: 'UPDATED_OLD',
  extraConditions: {
    ANDSuffix: '#role = :user',
    extraExpressionAttributeNames: { '#role': 'role' },
    extraExpressionAttributeValues: { ':user': 'user' }
  },
  _logParams: {
    log: true,
    message: 'hello world'
  }
});
type u2 = typeof updatedUser;
//   ^?