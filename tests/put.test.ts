import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { expectTypeOf } from "expect-type";
import { DeepValidateShapev2, DeepValidateShapev2WithBinaryResult } from "../src/type-helpers/deep-validate";
import { A, B, CICDMini, CICDSmaller } from "./lib/types";

type Item = {
  hashKey: '---',
  rangeKey: 'small-cicd',
  datum: 5,
  map: { hi: { exists: 0 }, howdy: { hola: 7 } },
  prop: [
    {
      weird: {
        wack: { even: 'string' } | { odd: 0 },
        peculiar: ["💯", null]
      },
      strange: ["this is the end!"]
    },
    "funky",
    "last"
  ],
  final: 'const',
  nest: [null, [true, false]],
  pure: [[0], [1], [2]],
  rest: [true, [{ x: 0, y: false }], [{ x: 1, y: true }]],
  finaler: 1_000,
  thebig: {
    hashKey: "---",
    rangeKey: 'big-cicd',
    data: {
      myRestArray: [5, "1", { moo: 'moo', boo: 44 }],
      relatedItems: [{ hi: '', bye: 0 }, 99],
      myTuple: [{ tup1: null }, { tup2: 'string', myBinarySet: DocumentClient.BinarySet }],
      bar: 'bar',
      foo: 0,
      price: undefined,
      quantity: 78,
      myStringSet: DocumentClient.StringSet
    }
  },
  myNumberSet: DocumentClient.NumberSet
};

type ItemAllUnionMembers = {
  hashKey: '---',
  rangeKey: 'small-cicd',
  datum: 5,
  map: { hi: { exists: 0 }, howdy: { hola: 7 } },
  prop: [
    {
      weird: {
        wack: { even: 'string', odd: 0 },
        peculiar: ["💯", null]
      },
      strange: ["this is the end!"]
    },
    "funky",
    "last"
  ],
  final: 'const',
  nest: [null, [true, false]],
  pure: [[0], [1], [2]],
  rest: [true, [{ x: 0, y: false }], [{ x: 1, y: true }]],
  finaler: 1_000,
  thebig: {
    hashKey: "---",
    rangeKey: 'big-cicd',
    data: {
      myRestArray: [5, "1", { moo: 'moo', boo: 44 }],
      relatedItems: [{ hi: '', bye: 0 }, 99],
      myTuple: [{ tup1: null }, { tup2: 'string', myBinarySet: DocumentClient.BinarySet }],
      bar: 'bar',
      foo: 0,
      price: undefined,
      quantity: 78,
      myStringSet: DocumentClient.StringSet
    }
  },
  myNumberSet: DocumentClient.NumberSet
};

const Item2: A = {
  p0: '---',
  s0: 'a',
  obj: {
    prop1: [''],
    prop2: 0,
    prop3: {
      '': { foo: "bar", bar: { foo: "", } }
    },
  },
  prop1: ["blah"],
  record: {},
  record1: {}
};

const Item4 = {
  hashKey: '--', // Error is here
  rangeKey: 0,
  finaler: 99,
  datum: 0
} as const;

test('DeepValidateShapeForPutItem', () => {

  expectTypeOf<DeepValidateShapev2<Item, CICDSmaller>>().toEqualTypeOf<Item>();

  expectTypeOf<DeepValidateShapev2WithBinaryResult<ItemAllUnionMembers, CICDSmaller>>().toEqualTypeOf<1>();

  expectTypeOf<DeepValidateShapev2<typeof Item2, A>>().toEqualTypeOf<A>();

  expectTypeOf<DeepValidateShapev2<B, B>>().toEqualTypeOf<B>();

  expectTypeOf<DeepValidateShapev2<typeof Item4, CICDMini>>().toBeNever();

});
