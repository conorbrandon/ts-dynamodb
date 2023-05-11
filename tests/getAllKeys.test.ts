import { expectTypeOf } from "expect-type";
import { GetAllKeys } from "../src/type-helpers/record";
import { CICDBigger, Type3Zod } from "./lib/types";
import { Branded } from "../src/type-helpers/utils";

test('GetAllKeys', () => {
  expectTypeOf<GetAllKeys<CICDBigger>>().toEqualTypeOf<
    'hashKey' | 'rangeKey' | 'datum' | 'data' | 'myRestArray'
    | 'myTuple' | 'relatedItems' | 'bar' | 'baz' | 'foo' | 'product'
    | 'price' | 'quantity' | 'final' | 'finale' | 'set'
    | 'boo' | 'moo' | 'tup1' | 'tup2' | 'tup3' | 'hi' | 'bye' | 'myStringSet' | 'myBinarySet'
  >();

  expectTypeOf<GetAllKeys<{ a: Record<string, unknown> }>>().toEqualTypeOf<
    string
  >();

  // this is for the pesky branded types that extend object
  expectTypeOf<GetAllKeys<Type3Zod & { brandedNumber: number & { __brand: 'Num' } }>>().toEqualTypeOf<'threeID' | 'otherID' | 'zod' | 'thing' | 'more' | 'brandedNumber'>();

});

test('symbol (branded) objects', () => {

  type T = Branded<"RAW", {
    foo: string;
    nums: Record<number, string>;
    specificNums: Record<1 | 2 | 3, boolean>;
  }>;
  type test = GetAllKeys<T>;
  expectTypeOf<test>().toEqualTypeOf<"foo" | "nums" | `${number}` | "specificNums">();

  type test2 = GetAllKeys<Omit<T, "nums">>;
  expectTypeOf<test2>().toEqualTypeOf<"foo" | "1" | "specificNums" | "2" | "3">();

});