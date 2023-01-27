import { MyTable, tsDdb } from ".";

const { Items } = await tsDdb.scan({
  TableName: MyTable.name
} as const);
type u = typeof Items;
//   ^?