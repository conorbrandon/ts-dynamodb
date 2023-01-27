import { tsDdbRaw } from "./lib/lib";
import { CiCdTable, MyTable } from "./lib/tables";

test('expect errors', () => {

  if (false) {
    tsDdbRaw.get({
      TableName: CiCdTable.name,
      Key: {
        // @ts-expect-error invalid key, should be 'a' or 'b'
        p0: '---',
        s0: 'c'
      },
      // @ts-expect-error PE not a string
      ProjectionExpression: ["key"],
      // @ts-expect-error empty EANs
      ExpressionAttributeNames: {

      }
    });

    tsDdbRaw.get({
      TableName: MyTable.name,
      Key: {
        p0: '---',
        s0: 'b'
      },
      ExpressionAttributeNames: {
        // @ts-expect-error invalid EAN value
        '#p0': '',
        '#p1': 'obj'
      },
      ProjectionExpression: '#p0, p1'
    });

    tsDdbRaw.get({
      TableName: MyTable.name,
      Key: {
        p0: '---',
        s0: 'b'
      },
      ExpressionAttributeNames: {
        // @ts-expect-error EAN key not in PE
        '#p1': 'obj'
      },
      ProjectionExpression: '#p0, p1'
    });
  }

});