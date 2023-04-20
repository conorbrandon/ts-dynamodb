import { expectTypeOf } from "expect-type";
import { DeepValidateShapev2, DeepValidateShapev2WithBinaryResult } from "../src/type-helpers/deep-validate";
import { C, CICD, CICDSmaller, Type3 } from "./lib/types";
import { DeepReadonly, DeepWriteable } from "../src/type-helpers/record";

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
  }>>().toEqualTypeOf<{
    map: {
      hi: {
        hello: number;
        exists: number
      };
      howdy?: string[];
      illegalAndMore: never;
    }
  }>();

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
      more: {
        more: 'mas';
        evenMore: never;
      };
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
      b: {
        c: true;
        d: false;
        e: never;
      };
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

  // make sure can satisfy each union constituent
  expectTypeOf<DeepValidateShapev2<{ ok: ""; prop: 0 }, { ok: string } | { prop: number } | { foo: boolean }>>().toEqualTypeOf<{ ok: ""; prop: 0 }>();
  // and force an error in it
  expectTypeOf<DeepValidateShapev2<{ ok: ""; prop: "" }, { ok: string } | { prop: number } | { foo: boolean }>>().toEqualTypeOf<{ ok: ""; prop: never }>();

  // despite this being a valid TS extends check, the second union constituent is not fully satisfied, and thus prop is treated as an extra property
  expectTypeOf<DeepValidateShapev2<{ ok: ""; prop: 0 }, { ok: string } | { prop: number; foo: boolean }>>().toEqualTypeOf<{ ok: ""; prop: never }>();

  // discriminated union check
  expectTypeOf<DeepValidateShapev2<{ ok: ""; type: "a"; foo: true }, { ok: string } | { type: "a"; foo: boolean } | { type: "b"; bar: string }>>().toEqualTypeOf<{ ok: ""; type: "a"; foo: true }>();

  // weird intersection check and optional properties
  expectTypeOf<DeepValidateShapev2<
    { type: 'a'; common: true },
    (({ type: 'a'; foo?: string } | { type: "b"; bar: number }) & { common: true }) | string
  >>().toEqualTypeOf<{ type: 'a'; common: true }>();

  // unioned with non object
  expectTypeOf<DeepValidateShapev2<
    { shell: { type: 'a'; common: true } | string },
    { shell: {} | string | number }
  >>().toEqualTypeOf<{ shell: { type: never; common: never } | string }>();
  // unioned with non object
  expectTypeOf<DeepValidateShapev2<
    number | string,
    {} | string | number
  >>().toEqualTypeOf<number | string>();

  // both are unions
  expectTypeOf<DeepValidateShapev2<
    { foo: string } | { bar: number },
    { foo: string } | { bar: number }
  >>().toEqualTypeOf<{ foo: string } | { bar: number }>();

  type Shape = {
    ok: string;
  } | {
    extra: unknown;
    fizz?: [true, false, true];
  } | string | number;
  const takesDeepVal = <const T extends Shape>(t: DeepReadonly<DeepValidateShapev2<DeepWriteable<T>, DeepWriteable<Shape>>>) => {
    return t;
  };
  const t = {
    ok: "",
    extra: "",
    fizz: [true, false, true] as const,
  };
  const r = takesDeepVal(t);
  expectTypeOf<typeof r>().toEqualTypeOf<DeepReadonly<typeof t>>();

  const t1 = {
    ok: "",
    extra: "",
    fizz: [true, false, true] as const,
    hoopla: null
  };
  // @ts-expect-error has extra property hoopla
  const r1 = takesDeepVal(t1);
  expectTypeOf<typeof r1>().toEqualTypeOf<{
    readonly ok: string;
    readonly extra: string;
    readonly fizz: readonly [true, false, true];
    readonly hoopla: never;
  }>();

  const r2 = takesDeepVal("");
  expectTypeOf<typeof r2>().toEqualTypeOf<"">();
  const r3 = takesDeepVal(0 as number);
  expectTypeOf<typeof r3>().toEqualTypeOf<number>();
  // @ts-expect-error because not even the generic is satisfied, it's a no-go
  const r4 = takesDeepVal(true);
  expectTypeOf<typeof r4>().toEqualTypeOf<DeepReadonly<Shape>>();


  expectTypeOf<DeepValidateShapev2<{
    ok: Set<any>;
    extra: string;
  }, {
    ok: unknown;
  } | {
    extra: any;
  } | {
    foo: any
  }>>().toEqualTypeOf<{
    ok: Set<any>;
    extra: string;
  }>();


});