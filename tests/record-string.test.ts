import { expectTypeOf } from "expect-type";
import { tsDdb, tsDdbRaw } from "./lib/lib";
import { MyTable } from "./lib/tables";
import { A } from "./lib/types";
import { DeepValidateShapev2WithBinaryResult } from "../src/type-helpers/deep-validate";

const Key = {
  p0: `---${Math.random()}`,
  s0: 'a'
} as const;
const Item = {
  ...Key,
  obj: {
    prop1: [],
    prop2: 0,
    prop3: {}
  },
  prop1: [],
  record: {},
  record1: {}
} satisfies A;

test('put with a record', async () => {
  await tsDdb.put({
    TableName: MyTable.name,
    Item
  });
});

test('get and query PE with a record', async () => {
  const { Item: got } = await tsDdbRaw.get({
    TableName: MyTable.name,
    Key,
    ProjectionExpression: `
record1.blah.foo[1],
record1.blah.bar.baz.#4,
#record.blah.#1.has,
record1.#2.bar.baz.#100,
record1.#2.bar.baz.#1,
record1.blah.foo[0],
record1.blah.foo[2],
obj.prop3.#ahh,
recordWithSet.prop.#1.#2,
recordWithTuple.hmm[0],
recordWithTuple.hmm[2]
`,
    ExpressionAttributeNames: {
      '#2': '2',
      '#4': '4',
      '#ahh': 'ahh',
      '#1': '1',
      '#100': '100',
      '#record': 'record'
    }
  }).promise();

  expect(got?.obj?.prop3?.ahh?.foo).toBeUndefined();
  expect(got?.obj?.prop3?.ahh?.bar.foo).toBeUndefined();
  expect(got?.record?.blah?.[1]).toBeUndefined();
  expect(got?.record1?.blah?.foo[2]).toBeUndefined();
  expect(got?.record1?.blah?.bar?.baz?.[4]).toBeUndefined();

  const foo = got?.record1?.blah?.foo;
  type fooT = typeof foo;
  expectTypeOf<fooT>().toEqualTypeOf<undefined | [string, number, string]>();

  const hundo = got?.record1?.[2]?.bar?.baz?.[100];
  type hundoT = typeof hundo;
  expectTypeOf<hundoT>().toBeUnknown();

  const uno = got?.record?.blah?.[1];
  type unoT = typeof uno;
  expectTypeOf<unoT>().toBeAny();

  const item = await tsDdb.queryItemPE({
    TableName: MyTable.name,
    KeyConditionExpression: 'p0 = :p0 AND s0 = :s0',
    ExpressionAttributeValues: {
      ':p0': Key.p0,
      ':s0': Key.s0
    },
    _logParams: {
      log: true
    }
  }, `
record1.blah.foo[1], 
record1.blah.bar.baz.4, 
record.blah.1.has, 
record1.2.bar.baz.100, 
record1.2.bar.baz.1, 
record1.blah.foo[0], 
record1.blah.foo[2],
obj.prop3.ahh,
recordWithSet.prop.1.2,
recordWithTuple.hmm[0],
recordWithTuple.hmm[2]`);
  type validated = DeepValidateShapev2WithBinaryResult<typeof got, typeof item>;
  expectTypeOf<validated>().toEqualTypeOf<1>();

  const { Items: scanned = [] } = await tsDdbRaw.scan({
    TableName: MyTable.name,
    ProjectionExpression: `
record1.blah.foo[1], 
record1.blah.bar.baz.#4, 
#record.blah.#1.has, 
record1.#2.bar.baz.#100, 
record1.#2.bar.baz.#1, 
record1.blah.foo[0], 
record1.blah.foo[2],
obj.prop3.#ahh,
recordWithSet.prop.#1.#2,
recordWithTuple.hmm[0],
recordWithTuple.hmm[2]
`,
    ExpressionAttributeNames: {
      '#2': '2',
      '#4': '4',
      '#ahh': 'ahh',
      '#1': '1',
      '#100': '100',
      '#record': 'record'
    }
  }).promise();
  expectTypeOf<(typeof scanned)[number]>().toEqualTypeOf<NonNullable<typeof got> | {
    obj: {
      prop3?: undefined;
    } | undefined;
    record?: undefined;
    record1?: undefined;
    recordWithSet?: undefined;
    recordWithTuple?: undefined;
  }>();
});

test('update with a record', async () => {
  let error;
  try {
    const _any = null as any;
    const { Attributes: updated } = await tsDdb.update({
      TableName: MyTable.name,
      Key,
      UpdateExpression: `
  SET 
    obj.prop3.thing.bar.foo = :empty,
    #record.thing.#fifty = :any,
    record1.#1.foo[1] = :num,
    record1.#1.bar.baz.#fifty = :num,
    obj.prop1[99] = :empty
  ADD recordWithSet.prop.1.2 :numberSet
  DELETE recordWithSet.prop.2.1 :numberSet
  REMOVE recordWithSet.prop.3.3
  `,
      ExpressionAttributeValues: {
        ':empty': '',
        ':any': _any,
        ':num': 0,
        ':numberSet': tsDdb.createNumberSet([100])
      },
      ExpressionAttributeNames: {
        '#fifty': '50',
        '#1': '1',
        '#record': 'record'
      },
      ReturnValues: 'UPDATED_NEW'
    });
    console.log(updated);
    if (updated) {
      const { obj, record, record1 } = updated;
      expectTypeOf<typeof obj>().toEqualTypeOf<{
        prop1: string[];
        prop3: {
          thing: {
            bar: {
              foo: "";
            };
          };
        };
      }>();
      const { thing } = record;
      const thingAny = thing[50];
      expectTypeOf<typeof thingAny>().toBeAny();
      const record11 = record1[1];
      const { foo, bar: { baz } } = record11;
      expectTypeOf<typeof foo>().toEqualTypeOf<[number]>();
      const baz50 = baz[50];
      expectTypeOf<typeof baz50>().toBeUnknown();
    }
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
});
test('updateSimpleSET with a record', async () => {
  const { Attributes: updatedNew } = await tsDdb.updateSimpleSET({
    TableName: MyTable.name,
    Key,
    Item: {
      prop1: ["huh"],
      recordWithTuple: {
        blah: ["", 0, ""]
      },
      record: {
        prop: {
          1: {}
        }
      },
      record1: {
        thing: {
          foo: ["hi", 99, "bye"],
          bar: {
            baz: ''
          }
        }
      }
    },
    ReturnValues: 'UPDATED_NEW'
  });
  expectTypeOf<typeof updatedNew>().toEqualTypeOf<{
    prop1: ["huh"];
    recordWithTuple: {
      blah: ["", 0, ""];
    };
    record: {
      prop: {
        1: {};
      };
    };
    record1: {
      thing: {
        foo: ["hi", 99, "bye"];
        bar: {
          baz: "";
        };
      };
    };
  } | undefined>();

  const { Attributes: updatedOld } = await tsDdb.updateSimpleSET({
    TableName: MyTable.name,
    Key,
    Item: {
      prop1: ["huh"],
      recordWithTuple: {
        blah: ["", 0, ""]
      },
      record: {
        prop: {
          1: {}
        }
      },
      record1: {
        thing: {
          foo: ["hi", 99, "bye"],
          bar: {
            baz: ''
          }
        }
      }
    },
    ReturnValues: 'UPDATED_OLD'
  });
  expectTypeOf<typeof updatedOld>().toEqualTypeOf<(Pick<A, 'prop1' | 'record' | 'record1'> & { recordWithTuple: A['recordWithTuple'] }) | undefined>();
});

test('delete with a record', async () => {
  const { Attributes: deleted } = await tsDdb.delete({
    TableName: MyTable.name,
    Key,
    ReturnValues: 'ALL_OLD'
  });
  expectTypeOf<typeof deleted>().toEqualTypeOf<A | undefined>();
});