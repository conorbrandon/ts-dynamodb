import { expectTypeOf } from "expect-type";
import { PutAndDeleteOutputHelper } from "../src/lib";

test('PutAndDeleteOutput', () => {
  expectTypeOf<PutAndDeleteOutputHelper<{ a: number }, undefined>>().toEqualTypeOf<undefined>();
  expectTypeOf<PutAndDeleteOutputHelper<{ a: number }, 'NONE'>>().toEqualTypeOf<undefined>();
  expectTypeOf<PutAndDeleteOutputHelper<{ a: number }, 'ALL_OLD'>>().toEqualTypeOf<{ a: number } | undefined>();
});