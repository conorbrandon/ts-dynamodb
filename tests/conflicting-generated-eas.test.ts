import { expectTypeOf } from "expect-type";
import { tsDdb } from "./lib/lib";
import { MyTable } from "./lib/tables";
import { B } from "./lib/types";
import { DeepWriteable } from "../src/type-helpers/record";

const Key = {
  p0: `${Math.random()}-${Math.random()}-${Math.random()}-${Math.random()}`,
  s0: 'b'
} as const;
const Item: B = {
  ...Key
};
const updateItem: Pick<B, 'obj'> = {
  obj: {
    prop4: 0,
    prop5: [0],
    prop6: []
  }
};

const TableName = MyTable.name;

test('conflict in eas for updateSimpleSET', async () => {
  await tsDdb.put({ TableName: MyTable.name, Item });

  const { Attributes } = await tsDdb.updateSimpleSET({
    TableName,
    Key,
    Item: updateItem,
    extraConditions: {
      ANDSuffix: 'attribute_not_exists(#_0_) AND #_1_ = :_0_',
      extraExpressionAttributeNames: {
        '#_0_': 'obj',
        '#_1_': 'p0'
      },
      extraExpressionAttributeValues: {
        ':_0_': Key.p0
      }
    },
    _logParams: {
      log: true
    },
    ReturnValues: 'UPDATED_NEW'
  });
  expectTypeOf<typeof Attributes>().toEqualTypeOf<Pick<B, 'obj'> | undefined>();

  const { Attributes: deleted } = await tsDdb.delete({ TableName, Key, ReturnValues: 'ALL_OLD' });
  expect(deleted).toStrictEqual({ ...Item, ...updateItem });

});

test('conflict in eas for queryKeyPE in Key first, then generated KCE causes conflict in parsePE', async () => {
  const fullItem: B = { ...Item, ...(updateItem as DeepWriteable<typeof updateItem>) };
  await tsDdb.put({ TableName, Item: fullItem });

  const item = await tsDdb.queryItemKeyPE({
    TableName,
    Key,
    _logParams: {
      log: true
    },
    FilterExpression: '#_0_.#_1_ = :_0_',
    ExpressionAttributeNames: {
      '#_0_': 'obj',
      '#_1_': 'prop4'
    },
    ExpressionAttributeValues: {
      ':_0_': 0
    }
  }, 'obj.prop5[1], obj.prop5[0]');
  console.log(item);
  expectTypeOf<typeof item>().toEqualTypeOf<{
    obj: {
      prop5: [number];
    } | undefined;
  } | undefined>();

});