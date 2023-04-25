import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { z } from 'zod';

export type UUIDSparse = `${string}-${string}-${string}-${string}`;

export type A = {
  p0: UUIDSparse;
  s0: 'a';
  obj: {
    prop1: string[];
    prop2: number;
    prop3: Record<string, {
      foo: 'bar',
      bar: {
        foo: ''
      };
    }>;
  };
  prop1: string[];
  record: Record<string, Record<number, any>>;
  record1: Record<string, {
    foo: [string, number, string];
    bar: {
      baz: Record<number, unknown>;
    };
  }>;
  recordWithSet?: {
    prop: Record<string, Record<number, DocumentClient.NumberSet>>;
  };
  recordWithTuple?: Record<string, [string, number, string]>;
};

export type B = {
  p0: UUIDSparse;
  s0: 'b';
  obj?: {
    prop4: number;
    prop5: [number];
    prop6: string[];
  };
};

export type C = A | B;

export type CICDBigger = {
  hashKey: UUIDSparse;
  rangeKey: "big-cicd";
  datum?: string; // used as a comparision to extract according to the type of value in the KCE
  data?: {
    myRestArray: [number, ...({ boo: number; moo: "moo" } | string)[]] | null;
    myTuple: [{ tup1: null }, { tup2: string; tup3?: number; myBinarySet: DynamoDB.DocumentClient.BinarySet }] | null;
    relatedItems: ({ hi: string; bye: number } | number)[];
    bar: string;
    baz?: null;
    foo: number;
    product?: string;
    price: undefined;
    quantity: number;
    final?: "oops";
    finale?: "ahhh";
    set?: "set";
    myStringSet: DynamoDB.DocumentClient.StringSet;
  };
};
export type CICDSmaller = {
  hashKey: UUIDSparse;
  rangeKey: "small-cicd";
  datum: number;
  datumStr?: `datum_${string}` | `blah_${number}`;
  map?: {
    hi: {
      hello?: number;
      exists: number
    },
    howdy: {
      hola: 7
    } | null
  };
  prop:
  [
    {
      weird: {
        wack: {
          even: 'string' | 'str'
        } | {
          odd: number
        } | {
          modulo: '%';
        } | null;
        peculiar: [string, (number | null)]
      };
      strange?: [string];
    },
    "funky",
    "last" | null
  ];
  final: "const" | null;
  finaler?: number;
  nest: [null, [true, false]];
  pure: number[][];
  rest: [boolean, ...{ x: number; y: boolean }[][]]
  thebig?: CICDBigger;
  // recurse?: CICDSmaller[]; // GetAllNonIndexKeys makes this impossible, look into supporting this...
  myNumberSet: DynamoDB.DocumentClient.NumberSet;
  myWackySet?: DynamoDB.DocumentClient.StringSet;
};
export type CICDMini = {
  hashKey: UUIDSparse;
  rangeKey: "mini-cicd";
  finaler: number;
  datum: number;
  datumStr: `blah_${number}` | undefined;
}
export type CICD = CICDBigger | CICDSmaller | CICDMini;

export type Type3a = {
  threeID: number;
  otherID: `other_${UUIDSparse}`;
  woo: string;
  hoo?: `999${number}`;
  boo: null;
  nowItExists: string[] | { hi: string };
};
export type Type3b = {
  threeID: number;
  otherID: `id_${number}`;
  obj: {
    nah: 'fam';
    duck: 'goose';
    '💀': 'RIP';
  };
  record: Record<string, any>;
};
export const otherZodID = z.string().brand('otherID');
export type Type3Zod = {
  threeID: number;
  otherID: z.infer<typeof otherZodID>;
  zod: {
    thing: 'random' | 'stringz';
    more: {
      more: 'mas' | 'zodIsGoodZodIsGreat';
    }
  };
};
export type Type3 = Type3a | Type3b | Type3Zod;