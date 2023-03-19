import { MyTable, tsDdb } from ".";

const { Items } = await tsDdb.scan({
  TableName: MyTable.name
});
type u = typeof Items;
//   ^?