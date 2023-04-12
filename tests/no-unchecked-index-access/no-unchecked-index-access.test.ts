import { expectTypeOf } from "expect-type";
import { IsNoUncheckedIndexAccessEnabled } from "../../src/type-helpers/utils";

test('IsNoUncheckedIndexAccessEnabled === false', () => {
  expectTypeOf<IsNoUncheckedIndexAccessEnabled>().toEqualTypeOf<false>();
});