import { expectTypeOf } from "expect-type";
import { CommonExtractTypeForKCEKey, ExtractKeyFromKCE } from "../src/type-helpers/query/common";

type T = {
  p0: string;
  s0: `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
  foo: number;
};

test('try to extract T using between expression', () => {

  type GetKey<EAV extends { ':s': string, ':e': string }> = ExtractKeyFromKCE<
    'p0 = :p0 AND s0 between :s AND :e',
    {},
    { ':p0': string } & EAV,
    'p0'
  >;
  type GetItem<EAV extends { ':s': string, ':e': string }> = CommonExtractTypeForKCEKey<T, GetKey<EAV>>;

  expectTypeOf<GetItem<{ ':s': `1111`, ':e': `0` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s': ``, ':e': `` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s': `${number}`, ':e': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s': `${number}`, ':e': `a` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s': `123-`, ':e': `${number}${number}${number}${number}` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s': `1234`, ':e': `0000` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s': `1234-56-78`, ':e': `` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s': T['s0'], ':e': T['s0'] }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s': "a", ':e': "b" }>>().toBeNever();

});

test('try to extract T using <', () => {

  type GetKey<EAV extends { ':s0': string }> = ExtractKeyFromKCE<
    'p0 = :p0 AND s0 < :s0',
    {},
    { ':p0': string } & EAV,
    'p0'
  >;
  type GetItem<EAV extends { ':s0': string }> = CommonExtractTypeForKCEKey<T, GetKey<EAV>>;

  expectTypeOf<GetItem<{ ':s0': "1" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': "" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `a` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `123-` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `1234` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `1234-56-78` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': T['s0'] }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}${number}${number}${number}` }>>().toEqualTypeOf<T>();

});

test('try to extract T using <=', () => {

  type GetKey<EAV extends { ':s0': string }> = ExtractKeyFromKCE<
    'p0 = :p0 AND s0 <= :s0',
    {},
    { ':p0': string } & EAV,
    'p0'
  >;
  type GetItem<EAV extends { ':s0': string }> = CommonExtractTypeForKCEKey<T, GetKey<EAV>>;

  expectTypeOf<GetItem<{ ':s0': "1" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': "" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `a` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `123-` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `1234` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `1234-56-78` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': T['s0'] }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}${number}${number}${number}` }>>().toEqualTypeOf<T>();

});

test('try to extract T using >', () => {

  type GetKey<EAV extends { ':s0': string }> = ExtractKeyFromKCE<
    'p0 = :p0 AND s0 > :s0',
    {},
    { ':p0': string } & EAV,
    'p0'
  >;
  type GetItem<EAV extends { ':s0': string }> = CommonExtractTypeForKCEKey<T, GetKey<EAV>>;

  expectTypeOf<GetItem<{ ':s0': "1" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': "" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `a` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `123-` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `1234` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `1234-56-78` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': T['s0'] }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}${number}${number}${number}` }>>().toEqualTypeOf<T>();

});

test('try to extract T using >=', () => {

  type GetKey<EAV extends { ':s0': string }> = ExtractKeyFromKCE<
    'p0 = :p0 AND s0 >= :s0',
    {},
    { ':p0': string } & EAV,
    'p0'
  >;
  type GetItem<EAV extends { ':s0': string }> = CommonExtractTypeForKCEKey<T, GetKey<EAV>>;

  expectTypeOf<GetItem<{ ':s0': "1" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': "" }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `a` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `123-` }>>().toBeNever();

  expectTypeOf<GetItem<{ ':s0': `1234` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `1234-56-78` }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': T['s0'] }>>().toEqualTypeOf<T>();

  expectTypeOf<GetItem<{ ':s0': `${number}${number}${number}${number}` }>>().toEqualTypeOf<T>();

});