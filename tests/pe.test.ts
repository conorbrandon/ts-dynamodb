import { CICDSmaller } from "./lib/types";
import { expectTypeOf } from 'expect-type';
import { DynamoDB } from "aws-sdk";
import { ProjectProjectionExpressionStruct } from "../src/type-helpers/PE2/pe-lib";
import { DeepValidateShapev2WithBinaryResult } from "../src/type-helpers/deep-validate";
import { CreatePropPickArrayFromDocPath } from "../src/type-helpers/PE2/parse-pe-to-object-lib";

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
          even: undefined;
        }
        | {
          even: undefined;
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

type Actual = ProjectProjectionExpressionStruct<CICDSmaller, `
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
myWackySet.values`, {
  '#rangeKey': 'rangeKey',
  '#prop': 'prop',
  '#data': 'data',
  '#weird': 'weird',
  '#final': 'final',
  '#map': 'map',
  '#exists': 'exists',
  '#datumStr': 'datumStr'
}>;

test('ProjectProjectionExpression', () => {

  type test = DeepValidateShapev2WithBinaryResult<Expected, Actual>;
  expectTypeOf<test>().toEqualTypeOf<1>();

  expectTypeOf<CreatePropPickArrayFromDocPath<"blahHaHa.#nahNahNah[0][1][2].boo", { '#nahNahNah': 'nahNahNah' }>>().toEqualTypeOf<["blahHaHa", "nahNahNah", "[0]", "[1]", "[2]", "boo"]>();

});
