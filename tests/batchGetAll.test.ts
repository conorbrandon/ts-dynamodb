import { randomUUID } from "crypto";
import { tsDdb } from "./lib/lib";
import { CiCdTable, MyTable, Table3 } from "./lib/tables";
import { C, CICD, Type3b } from "./lib/types";
import { inspect } from "util";

jest.setTimeout(100_000);

let myTableItems: C[];
let ciCdTableItems: CICD[];
let table3TableItems: Type3b[];

beforeAll(async () => {
  myTableItems = [
    ...new Array(100).fill(0).map((): C => {
      return {
        p0: randomUUID(),
        s0: 'a',
        obj: {
          prop1: new Array(100).fill(`${Math.random()}`),
          prop2: Math.random(),
          prop3: {}
        },
        prop1: new Array(10000).fill(`${Math.random()}`),
        record: {},
        record1: {}
      };
    }),
    ...new Array(100).fill(0).map((): C => {
      return {
        p0: randomUUID(),
        s0: 'b'
      };
    })
  ];
  ciCdTableItems = [
    ...new Array(100).fill(0).map((): CICD => {
      return {
        hashKey: randomUUID(),
        rangeKey: 'mini-cicd',
        finaler: Math.random(),
        datum: Math.random(),
        datumStr: undefined
      };
    }),
    ...new Array(100).fill(0).map((): CICD => {
      return {
        hashKey: randomUUID(),
        rangeKey: 'big-cicd',
        data: {
          myRestArray: [0, ...new Array(10000).fill(`${Math.random()}`)],
          myTuple: [{ tup1: null }, { tup2: randomUUID(), myBinarySet: tsDdb.createBinarySet([Buffer.from(new Array(100).fill(`${Math.random()}`))]) }],
          relatedItems: [],
          bar: randomUUID(),
          foo: Math.random(),
          price: undefined,
          quantity: Math.random(),
          myStringSet: tsDdb.createStringSet(["", ...new Set(new Array(100).fill(`${Math.random()}`))])
        }
      };
    })
  ];
  table3TableItems = [
    ...new Array(100).fill(0).map((_, i): Type3b => {
      return {
        threeID: 0,
        otherID: `id_${i}`,
        obj: {
          nah: 'fam',
          duck: 'goose',
          '💀': 'RIP'
        },
        record: {}
      };
    }),
    ...new Array(100).fill(0).map((_, i): Type3b => {
      return {
        threeID: 1,
        otherID: `id_${i}`,
        obj: {
          nah: 'fam',
          duck: 'goose',
          '💀': 'RIP'
        },
        record: {}
      };
    })
  ];
  await Promise.all([
    ...myTableItems.map(Item => tsDdb.put({ TableName: MyTable.name, Item })),
    ...ciCdTableItems.map(Item => tsDdb.put({ TableName: CiCdTable.name, Item })),
    ...table3TableItems.map(Item => tsDdb.put({ TableName: Table3.name, Item }))
  ]);
});
afterAll(async () => {
  await Promise.all([
    ...myTableItems.map(({ p0, s0 }) => tsDdb.delete({ TableName: MyTable.name, Key: { p0, s0 } })),
    ...ciCdTableItems.map(({ hashKey, rangeKey }) => tsDdb.delete({ TableName: CiCdTable.name, Key: { hashKey, rangeKey } })),
    ...table3TableItems.map(({ threeID, otherID }) => tsDdb.delete({ TableName: Table3.name, Key: { threeID, otherID } }))
  ]);
});

test('invalid args', () => {
  expect(() => tsDdb.createBatchGetAllRequest({ maxFailedAttempts: 0 })).toThrow(new Error("maxFailedAttempts must be >= 1!"));
  expect(() => tsDdb.createBatchGetAllRequest({ maxFailedAttempts: 1 })).not.toThrow();
  expect(() => tsDdb.createBatchGetAllRequest({ baseDelayMs: -1 })).toThrow(new Error("baseDelayMs must be >= 0!"));
  expect(() => tsDdb.createBatchGetAllRequest({ baseDelayMs: 0 })).not.toThrow();
});

test('', async () => {

  const request = tsDdb.createBatchGetAllRequest({ showProvisionedThroughputExceededExceptionError: (error) => error.message })
    .addTable(MyTable.name, {
      Keys: [
        {
          p0: '---',
          s0: 'b'
        }
      ],
      ProjectionExpression: '#p0, #obj, s0',
      ExpressionAttributeNames: {
        '#p0': 'p0',
        '#obj': 'obj'
      }
    })
    .addTable(CiCdTable.name, {
      Keys: [
        {
          hashKey: '---',
          rangeKey: 'mini-cicd'
        },
        {
          hashKey: '---',
          rangeKey: 'small-cicd'
        },
      ],
      ProjectionExpression: '#datum, #thebig.#datum, rangeKey',
      ExpressionAttributeNames: {
        '#datum': 'datum',
        '#thebig': 'thebig'
      }
    })
    .addKeys(CiCdTable.name, {
      Keys: [
        {
          hashKey: '---',
          rangeKey: 'big-cicd'
        }
      ]
    })
    .addKeys(MyTable.name, {
      Keys: myTableItems.map(({ p0, s0 }) => ({ p0, s0 }))
    })
    .addKeys(CiCdTable.name, {
      Keys: ciCdTableItems.map(({ hashKey, rangeKey }) => ({ hashKey, rangeKey }))
    })
    .addTable(Table3.name, {
      Keys: table3TableItems.map(({ threeID, otherID }) => ({ threeID, otherID })),
      ProjectionExpression: 'threeID, #otherID',
      ExpressionAttributeNames: {
        '#otherID': 'otherID'
      }
    });
  try {
    const response = await request.execute();
    const { [MyTable.name]: myTableItems = [], [CiCdTable.name]: ciCdTableItems = [], [Table3.name]: table3Items = [] } = response;
    const shouldInspect = false;
    if (shouldInspect) {
      console.log(inspect({ myTableItems, ciCdTableItems, table3Items }, { maxArrayLength: null }));
    }
    expect(myTableItems).toHaveLength(200);
    expect(ciCdTableItems).toHaveLength(200);
    expect(table3Items).toHaveLength(200);
  } catch (error) {
    if (request.isMaxFailedAttemptsExceededErrorFromThisRequest(error)) {
      console.log(error.partialResponse);
    }
  }

});
