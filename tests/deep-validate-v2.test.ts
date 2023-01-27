import { expectTypeOf } from "expect-type";
import { DeepValidateShapev2, DeepValidateShapev2WithBinaryResult } from "../src/type-helpers/deep-validate";
import { C, CICD, CICDSmaller, Type3 } from "./lib/types";

test('DeepValidateShapev2', () => {

  expectTypeOf<DeepValidateShapev2<{
    more: "mas" & { __brand: 'hi' };
    hehe: [{ blah: string }, { mah?: number }]
  }, {
    more: "mas" & { __brand: 'hi' };
    hehe: [{ blah: string }, { mah?: number }]
  } | {
    mas: "more"
  }>>().toEqualTypeOf<{
    more: "mas" & { __brand: 'hi' };
    hehe: [{ blah: string }, { mah?: number }]
  }>();

  expectTypeOf<DeepValidateShapev2<CICDSmaller, Partial<CICDSmaller>>>().toEqualTypeOf<CICDSmaller>();

  expectTypeOf<DeepValidateShapev2<{
    map: {
      hi: {
        hello: number;
        exists: number
      };
      howdy?: string[];
    }
  }, {
    map: {
      hi: {
        hello: number;
        exists: number
      };
      howdy?: string[];
    }
  }>>().toEqualTypeOf<{
    map: {
      hi: {
        hello: number;
        exists: number
      };
      howdy?: string[];
    }
  }>();

  expectTypeOf<DeepValidateShapev2<{
    map: {
      hi: {
        hello: number;
        exists: number
      };
      howdy?: string[];
      illegalAndMore: 'illegal';
    }
  }, {
    map: {
      hi: {
        hello: number;
        exists: number
      };
      howdy?: string[];
    }
  }>>().toEqualTypeOf<{ map: never }>();

  expectTypeOf<DeepValidateShapev2<{
    zod: {
      thing: 'random';
      more: {
        more: 'mas';
      };
    };
  }, {
    zod: {
      thing: "random";
      more: {
        more: "mas";
      } | {
        mas: "more"
      };
    };
  }>>().toEqualTypeOf<{
    zod: {
      thing: 'random';
      more: {
        more: 'mas';
      };
    };
  }>();

  expectTypeOf<DeepValidateShapev2<{
    zod: {
      thing: 'random';
      more: {
        more: 'mas';
        evenMore: '';
      };
    };
  }, {
    zod: {
      thing: "random";
      more: {
        more: "mas";
      } | {
        mas: "more"
      };
    };
  }>>().toEqualTypeOf<{
    zod: {
      thing: 'random';
      more: never;
    };
  }>();

  expectTypeOf<DeepValidateShapev2<{
    prop: [{ nah: 'fam'; extra: 'stuff' }]
  }, {
    prop: [{ nah: 'fam'; extra: 'stuff' }]
  }>>().toEqualTypeOf<{
    prop: [{ nah: 'fam'; extra: 'stuff' }]
  }>();

  expectTypeOf<DeepValidateShapev2<{
    prop: [{ nah: 'fam'; extra: 'stuff' }]
  }, {
    prop: [{ nah: 'fam'; }]
  } | {
    'this is totally unrelated'?: number;
  }>>().toEqualTypeOf<{ prop: [never] }>;

  expectTypeOf<DeepValidateShapev2WithBinaryResult<{
    prop: [{ nah: 'fam'; extra: 'stuff' }]
  }, {
    prop: [{ nah: 'fam'; }]
  } | {
    'this is totally unrelated'?: number;
  }>>().toEqualTypeOf<0>();

  expectTypeOf<DeepValidateShapev2WithBinaryResult<{
    prop: [{ nah: 'fam'; }]
  }, {
    prop: [{ nah: 'fam'; }]
  } | {
    'this is totally unrelated'?: number;
  }>>().toEqualTypeOf<1>();

  expectTypeOf<DeepValidateShapev2<CICDSmaller, CICD | Type3 | C>>().toEqualTypeOf<CICDSmaller>();

  expectTypeOf<DeepValidateShapev2<Record<string, any>, Record<string, any>>>().toBeObject();

  expectTypeOf<DeepValidateShapev2<CICD, CICD>>().toEqualTypeOf<CICD>();

  expectTypeOf<DeepValidateShapev2<CICD, Type3>>().toBeNever();

  expectTypeOf<DeepValidateShapev2<Partial<CICDSmaller>, CICDSmaller>>().toBeNever();

  expectTypeOf<DeepValidateShapev2<{}, Partial<CICDSmaller>>>().toEqualTypeOf<{}>();

  expectTypeOf<DeepValidateShapev2<{ datum?: string }, Partial<CICDSmaller>>>().toBeNever();

  expectTypeOf<DeepValidateShapev2<{}, {}>>().toEqualTypeOf<{}>();

  expectTypeOf<DeepValidateShapev2<{ a: { b: { c: true } } }, { a?: { b?: { c?: true; d?: false } } }>>().toEqualTypeOf<{ a: { b: { c: true } } }>();

  expectTypeOf<DeepValidateShapev2<{ a: { b: { c: true; d: true } } }, { a?: { b?: { c?: true; d?: false } } }>>().toBeNever();

  expectTypeOf<DeepValidateShapev2<{ a: { b: { c: true; d: false; e: null } } }, { a?: { b?: { c?: true; d?: false } } }>>().toEqualTypeOf<{
    a: {
      b: never;
    };
  }>();

  expectTypeOf<DeepValidateShapev2<[string], { "0": string }>>().toEqualTypeOf<never>();

  expectTypeOf<DeepValidateShapev2<{ even: 'string' } | { odd: 0 }, {
    even: 'string' | 'str'
  } | {
    odd: number
  }>>().toEqualTypeOf<{ even: 'string' } | { odd: 0 }>();

  // this cannot be validated because it's not a union
  expectTypeOf<DeepValidateShapev2WithBinaryResult<{ even: 'string' } | { odd: { deep: 0 } }, {
    even: 'string' | 'str'
  } | {
    odd: number
  }>>().toEqualTypeOf<0 | 1>();

});