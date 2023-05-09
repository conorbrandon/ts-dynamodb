import { DeepSimplifyObject } from "../src/type-helpers/utils";
import { ArrayIndicesStruct, ConstructPEStruct, PEStruct, ProjectProjectionExpressionStruct } from "../src/type-helpers/PE2/pe-lib";
import { expectTypeOf } from "expect-type";
import { DeepValidateShapev2WithBinaryResult } from "../src/type-helpers/deep-validate";
import { CICDSmaller, Type3a } from "./lib/types";
import { DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

type pe = `
#prop[0].#weird.peculiar[1],
#prop[0].strange,
#prop[2],
datum,
thebig.#data.relatedItems[100],
thebig.#data.relatedItems[0].bye,
thebig.#data.relatedItems[0].hi,
datum.oops,
rest[0],
thebig.#data.myRestArray[2].moo,
rest[2][0].x,
thebig.hashKey,
thebig.#data.finale,
finaler,
hashKey,
nest[1][1],
pure[0][0],
#final,
#prop[0].#weird.wack.even,
nest[1][0],
#map.howdy.hola,
thebig.#data.price,
thebig.#rangeKey,
#rangeKey,
doh,
thebig.#data.relatedItems[1].hi,
thebig.#data.foo,
#map.hi.#exists,
thebig.#data.bar,
thebig.#data.quantity,
thebig.#data.baz,
#prop[0].#weird.peculiar[0],
thebig.#data.myRestArray[1].boo,
thebig.#data.product,
thebig.#data.myRestArray[0],
#map.hi.hello,
#prop[1],
thebig.#data.myTuple[1].tup2,
thebig.#data.#final,
thebig.#data.myTuple[0],
#datumStr,
#myNumberSet,
thebig.#data.myStringSet,
thebig.#data.myTuple[1].myBinarySet,
myWackySet.nonsense
`;
type ean = {
  '#rangeKey': 'rangeKey';
  '#prop': 'prop';
  '#data': 'data';
  '#weird': 'weird';
  '#final': 'final';
  '#map': 'map';
  '#exists': 'exists';
  '#datumStr': 'datumStr';
  '#myNumberSet': 'myNumberSet';
};
type peStruct = ConstructPEStruct<
  pe,
  ean
>;
test('ConstructPEStruct', () => {
  type peStructSimplified = DeepSimplifyObject<peStruct>;
  type peStructExpectation = {
    myWackySet: {
      nonsense: true;
    };
    myNumberSet: true;
    datumStr: true;
    doh: true;
    rangeKey: true;
    map: {
      hi: {
        hello: true;
        exists: true;
      };
      howdy: {
        hola: true;
      };
    };
    final: true;
    pure: {
      "0": {
        "0": true;
      } & ArrayIndicesStruct;
    } & ArrayIndicesStruct;
    nest: {
      "1": {
        "0": true;
        "1": true;
      } & ArrayIndicesStruct;
    } & ArrayIndicesStruct;
    hashKey: true;
    finaler: true;
    rest: {
      "2": {
        "0": {
          x: true;
        };
      } & ArrayIndicesStruct;
      "0": true;
    } & ArrayIndicesStruct;
    thebig: {
      rangeKey: true;
      hashKey: true;
      data: {
        myStringSet: true;
        final: true;
        myTuple: {
          "0": true;
          "1": {
            myBinarySet: true;
            tup2: true;
          };
        } & ArrayIndicesStruct;
        product: true;
        baz: true;
        quantity: true;
        bar: true;
        foo: true;
        price: true;
        finale: true;
        myRestArray: {
          "0": true;
          "1": {
            boo: true;
          };
          "2": {
            moo: true;
          };
        } & ArrayIndicesStruct;
        relatedItems: {
          "1": {
            hi: true;
          };
          "0": {
            hi: true;
            bye: true;
          };
          "100": true;
        } & ArrayIndicesStruct;
      };
    };
    datum: true;
    prop: {
      "1": true;
      "2": true;
      "0": {
        strange: true;
        weird: {
          wack: {
            even: true;
          };
          peculiar: {
            "0": true;
            "1": true;
          } & ArrayIndicesStruct;
        };
      };
    } & ArrayIndicesStruct;
  };
  type val = DeepValidateShapev2WithBinaryResult<peStructSimplified, peStructExpectation>;
  expectTypeOf<val>().toEqualTypeOf<1>();

  type shortCircuit = ConstructPEStruct<'thing[0], thing[0][0], prop, prop.hi', {}>;
  expectTypeOf<shortCircuit>().toEqualTypeOf<{
    thing: {
      "0": true;
    } & ArrayIndicesStruct;
    prop: true;
  }>();

});

test('PEStruct type', () => {
  type val = DeepValidateShapev2WithBinaryResult<peStruct, PEStruct>;
  expectTypeOf<val>().toEqualTypeOf<1>();
});

describe('ProjectPEStruct', () => {
  test('big projection', () => {
    type Expected = {
      map:
      | {
        hi: {
          hello: number | undefined;
          exists: number;
        };
        howdy:
        | {
          hola: 7;
        }
        | undefined;
      }
      | undefined;
      pure: (number[] | undefined)[] | undefined;
      nest: [[true, false]];
      prop: [
        {
          strange: [string] | undefined;
          weird: {
            wack:
            | {
              even: "string" | "str";
            }
            | {
              even?: undefined;
            }
            | {
              even?: undefined;
            }
            | undefined;
            peculiar: [string, number | null];
          };
        },
        "funky",
        "last" | null
      ];
      rest: [
        boolean,
        ...(
          | {
            x: number;
          }[]
          | undefined
        )[]
      ];
      thebig:
      | {
        rangeKey: "big-cicd";
        hashKey: `${string}-${string}-${string}-${string}`;
        data:
        | {
          final: "oops" | undefined;
          myTuple:
          | [
            {
              tup1: null;
            },
            {
              tup2: string;
              myBinarySet: ({ wrapperName: 'Set' } & DynamoDB.DocumentClient.BinarySet) | undefined;
            }
          ]
          | undefined;
          product: string | undefined;
          baz: null | undefined;
          quantity: number;
          bar: string;
          foo: number;
          price: undefined;
          relatedItems:
          | (
            | number
            | {
              hi: string;

              bye: number;
            }
            | {
              bye: number;
            }
            | {
              hi: string;
            }
            | undefined
          )[]
          | undefined;
          finale: "ahhh" | undefined;
          myRestArray:
          | [
            number,
            ...(
              | {
                moo: "moo";
              }
              | {
                boo: number;
              }
              | undefined
            )[]
          ]
          | undefined;
          myStringSet: ({ wrapperName: 'Set' } & DynamoDB.DocumentClient.StringSet) | undefined;
        }
        | undefined;
      }
      | undefined;
      datumStr: `datum_${string}` | `blah_${number}` | undefined;
      finaler: number | undefined;
      hashKey: `${string}-${string}-${string}-${string}`;
      datum: number;
      doh: undefined;
      final: "const" | null;
      rangeKey: "small-cicd";
      myNumberSet: ({ wrapperName: 'Set' } & DynamoDB.DocumentClient.NumberSet) | undefined;
      myWackySet: undefined;
    };
    type pe = `
thebig.#data.myRestArray[2].moo,
rest[2][0].x,
thebig.hashKey,
#prop[0].#weird.peculiar[1],
thebig.#data.finale,
finaler,
hashKey,
nest[1][1],
#prop[0].strange,
pure[0][0],
#final,
thebig.#data.relatedItems[0].bye,
#prop[0].#weird.wack.even,
thebig.#data.relatedItems[100],
datum,
rest[0],
#prop[2],
nest[1][0],
#map.howdy.hola,
thebig.#data.price,
thebig.#rangeKey,
#rangeKey,
doh,
thebig.#data.relatedItems[1].hi,
thebig.#data.foo,
#map.hi.#exists,
thebig.#data.bar,
thebig.#data.quantity,
thebig.#data.baz,
#prop[0].#weird.peculiar[0],
thebig.#data.myRestArray[1].boo,
thebig.#data.product,
thebig.#data.myRestArray[0],
#map.hi.hello,
#prop[1],
thebig.#data.myTuple[1].tup2,
thebig.#data.#final,
thebig.#data.myTuple[0],
#datumStr,
myNumberSet,
thebig.#data.myStringSet,
thebig.#data.myTuple[1].myBinarySet,
myWackySet.values`;
    type ean = {
      '#rangeKey': 'rangeKey',
      '#prop': 'prop',
      '#data': 'data',
      '#weird': 'weird',
      '#final': 'final',
      '#map': 'map',
      '#exists': 'exists',
      '#datumStr': 'datumStr'
    };
    type out = ProjectProjectionExpressionStruct<CICDSmaller, pe, ean>;
    type test = DeepValidateShapev2WithBinaryResult<Expected, out>;
    type test2 = DeepValidateShapev2WithBinaryResult<out, Expected>;
    expectTypeOf<test>().toEqualTypeOf<1>();
    expectTypeOf<test2>().toEqualTypeOf<1>();

  });
  test('Record with required intersected property', () => {

    type test2 = ProjectProjectionExpressionStruct<Record<string | number, string> & { default: true }, 'default, #0, foo', { '#0': '0' }>;
    expectTypeOf<test2>().toEqualTypeOf<{
      0: string | undefined;
      default: true;
      foo: string | undefined;
    }>();

    type test = ProjectProjectionExpressionStruct<{
      foo?: string;
      bar: number | undefined;
    } & Record<string, boolean>, 'foo, bar, baz', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      foo: string | undefined;
      bar: number | undefined;
      baz: boolean | undefined;
    }>();


  });
  test('number records', () => {

    type test = ProjectProjectionExpressionStruct<Record<1 | 2, boolean>, '#1, #3', { '#1': '1'; '#3': '3' }>;
    expectTypeOf<test>().toEqualTypeOf<{
      1: boolean;
      "3": undefined;
    }>();

    type test2 = ProjectProjectionExpressionStruct<{
      foo?: Record<number, boolean>;
    }, 'foo.#1', { '#1': '1' }>;
    expectTypeOf<test2>().toEqualTypeOf<{
      foo: {
        1: boolean | undefined;
      } | undefined;
    }>();

    type test3 = ProjectProjectionExpressionStruct<{
      foo?: Record<1 | "2" | 3, boolean>;
    }, 'foo.#1, foo.#2', { '#1': '1'; '#2': '2' }>;
    expectTypeOf<test3>().toEqualTypeOf<{
      foo: {
        1: boolean;
        "2": boolean;
      } | undefined;
    }>();
    // @ts-expect-error 2 should be "2" per the type above
    expectTypeOf<test3>().toEqualTypeOf<{
      foo: {
        1: boolean;
        2: boolean;
      } | undefined;
    }>();

  });
  test('remove UnsetTupleIndex in rest arrays', () => {

    type test3 = ProjectProjectionExpressionStruct<{ rest: [string, number, boolean, ...null[]] }, 'rest[1], rest[100]', {}>;
    expectTypeOf<test3>().toEqualTypeOf<{
      rest: [number, ...null[]];
    }>();

  });
  test('add wrapper name and undefined to ddb set', () => {

    type test4 = ProjectProjectionExpressionStruct<{ set: DocumentClient.NumberSet }, 'set', {}>;
    expectTypeOf<test4>().toEqualTypeOf<{
      set: {
        type: "Number";
        values: number[];
        wrapperName: "Set";
      } | undefined;
    }>();

  });
  test('unknown[] | undefined', () => {

    type test = ProjectProjectionExpressionStruct<{ tup: [{ foo?: string }, number] }, 'tup[0].foo', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      tup: unknown[] | undefined;
    }>();

  });
  test('conflicting tuples', () => {

    type test = ProjectProjectionExpressionStruct<{ tup: [string, string, string] | [boolean, number, ...null[]] }, 'tup[0], tup[4]', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      tup: [string] | [boolean, ...null[]];
    }>();

  });
  test('array index access on a union obj/array type', () => {

    type test = ProjectProjectionExpressionStruct<Type3a, 'nowItExists[0], nowItExists[1]', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      nowItExists: string[] | undefined;
    }>();


  });
  test('out of bounds tuple access', () => {

    type test = ProjectProjectionExpressionStruct<{ tup: [number] }, 'tup[1]', {}>;
    expectTypeOf<test>().toEqualTypeOf<{ tup: undefined }>();

  });
  test('record', () => {

    type r = ProjectProjectionExpressionStruct<{ record: Record<string, string> }, 'record.hi', {}>;
    expectTypeOf<r>().toEqualTypeOf<{ record: { hi: string | undefined } | undefined }>();

  });
  test('multi-dimensional array', () => {

    type test = ProjectProjectionExpressionStruct<{ arr: string[][][] }, 'arr[0][0][0]', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      arr: ((string[] | undefined)[] | undefined)[] | undefined;
    }>();

  });
  test('projecting both fields in a union', () => {

    type test = ProjectProjectionExpressionStruct<{ foo: string } | { bar: { baz: string; fizz: number } }, 'foo, bar.baz', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      foo: string;
      bar: undefined;
    } | {
      bar: {
        baz: string;
      };
      foo: undefined;
    }>();

  });
  test('another record one', () => {

    type test = ProjectProjectionExpressionStruct<{ foo: boolean; bar: Record<string, number>; nums: Record<number, string> }, 'foo, bar.baz, nope, nums.1', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      foo: boolean;
      bar: {
        baz: number | undefined;
      } | undefined;
      nums: {
        1: string | undefined;
      } | undefined;
      nope: undefined;
    }>();

  });
  test('index into __brand and Ddb Set', () => {

    type test = ProjectProjectionExpressionStruct<{ ID: string & { __brand: "ID" } }, 'ID.__brand', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      ID: undefined;
    }>();

    type test2 = ProjectProjectionExpressionStruct<{ set: DocumentClient.BinarySet }, 'set.values, set.type', {}>;
    expectTypeOf<test2>().toEqualTypeOf<{
      set: undefined;
    }>();

  });
  test('top level discriminated union', () => {

    type test = ProjectProjectionExpressionStruct<{ type: 'a'; foo: string } | { type: 'b'; bar: number }, 'type, foo, bar', {}>;
    expectTypeOf<test>().toEqualTypeOf<{
      foo: string;
      type: "a";
      bar: undefined;
    } | {
      bar: number;
      type: "b";
      foo: undefined;
    }>();

  });

  describe('errors', () => {

    test('invalid index access into an object', () => {

      type test = ProjectProjectionExpressionStruct<{ foo: { bar: string } }, 'foo[0], foo.bar', {}>;
      expectTypeOf<test>().toEqualTypeOf<{ foo: undefined }>();

    });

  });
});