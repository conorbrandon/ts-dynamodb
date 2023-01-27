import { MyTable, SiteID, tsDdb, UserID } from ".";

const userID = '12345' as UserID;
const siteID = 'abcde' as SiteID;
const { Item } = await tsDdb.get({
  TableName: MyTable.name,
  Key: {
    hashKey: userID,
    rangeKey: 'user'
  }
} as const);

type u = typeof Item;
//   ^?