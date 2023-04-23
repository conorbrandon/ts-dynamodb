import { expectTypeOf } from "expect-type";
import { tsDdb, tsDdbRaw } from "./lib/lib";
import { Table3 } from "./lib/tables";
import { Type3Zod, Type3a, otherZodID } from "./lib/types";

const queryKey1 = {
  threeID: Math.random(),
  hoo: `999${Math.random()}`
} as const;
const Item1: Type3a = {
  ...queryKey1,
  otherID: 'other_---',
  woo: "WOO!",
  boo: null,
  nowItExists: []
};
beforeAll(async () => {
  await tsDdbRaw.put({ TableName: Table3.name, Item: Item1 }).promise();
});

test('queryKey', async () => {

  const { Items: [item] = [] } = await tsDdb.queryKey({
    TableName: Table3.name,
    Key: queryKey1,
    IndexName: Table3.indices['hooAll-index'].name,
    ProjectionExpression: 'nowItExists, #woo, moo, hoo',
    ExpressionAttributeNames: {
      '#woo': 'woo'
    }
  });
  console.log(item);
  expectTypeOf<typeof item>().toEqualTypeOf<{
    hoo: `999${number}`;
    nowItExists: string[];
    woo: string;
    moo?: undefined;
  } | undefined>();
  expect(item).toStrictEqual({
    hoo: Item1.hoo,
    nowItExists: Item1.nowItExists,
    woo: Item1.woo
  });

});
test('queryKeyPE', async () => {

  const { Items: peItems = [] } = await tsDdb.queryKeyPE({
    TableName: Table3.name,
    Key: queryKey1,
    IndexName: Table3.indices['hooAll-index'].name
  }, 'nowItExists, woo, moo, hoo');
  console.log(peItems);
  expectTypeOf<typeof peItems>().toEqualTypeOf<{
    hoo: `999${number}`;
    nowItExists: string[];
    woo: string;
    moo?: undefined;
  }[]>();
  expect(peItems).toStrictEqual([{
    hoo: Item1.hoo,
    nowItExists: Item1.nowItExists,
    woo: Item1.woo
  }]);

});
test('queryAllKeyPE', async () => {

  const peItems = await tsDdb.queryAllKeyPE({
    TableName: Table3.name,
    Key: queryKey1,
    IndexName: Table3.indices['hooAll-index'].name
  }, 'nowItExists, woo, moo, hoo');
  console.log(peItems);
  expectTypeOf<typeof peItems>().toEqualTypeOf<{
    hoo: `999${number}`;
    nowItExists: string[];
    woo: string;
    moo?: undefined;
  }[]>();
  expect(peItems).toStrictEqual([{
    hoo: Item1.hoo,
    nowItExists: Item1.nowItExists,
    woo: Item1.woo
  }]);

});
test('queryItemKeyPE', async () => {

  const item = await tsDdb.queryItemKeyPE({
    TableName: Table3.name,
    Key: {
      threeID: queryKey1.threeID
    },
    IndexName: Table3.indices['hooAll-index'].name
  }, 'nowItExists, woo, moo, hoo');
  console.log(item);
  expectTypeOf<typeof item>().toEqualTypeOf<{
    hoo?: `999${number}` | undefined;
    nowItExists: string[];
    woo: string;
    moo?: undefined;
  } | {
    hoo?: undefined;
    nowItExists?: undefined;
    woo?: undefined;
    moo?: undefined;
  } | {
    hoo?: undefined;
    nowItExists?: undefined;
    woo?: undefined;
    moo?: undefined;
  } | undefined>();
  expect(item).toStrictEqual({
    hoo: Item1.hoo,
    nowItExists: Item1.nowItExists,
    woo: Item1.woo
  });

});
test('queryItemKey', async () => {
  const otherID = otherZodID.parse(`${Math.random()}`);
  const Item: Type3Zod = {
    threeID: Math.random(),
    otherID,
    zod: {
      thing: 'random',
      more: {
        more: 'mas'
      }
    }
  };
  await tsDdb.put({ TableName: Table3.name, Item });

  const item = await tsDdb.queryItemKey({
    TableName: Table3.name,
    Key: {
      otherID
    },
    IndexName: Table3.indices["otherID-all-index"].name
  });
  expectTypeOf<typeof item>().toEqualTypeOf<Type3Zod | undefined>();

});