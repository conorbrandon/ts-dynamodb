import { expectTypeOf } from "expect-type";
import { GetAllKeys } from "../src/type-helpers/record";
import { CICDBigger, Type3Zod } from "./lib/types";

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