import { expectTypeOf } from "expect-type";
import { ExtractEAsFromString } from "../src/type-helpers/extract-EAs";

test('ExtractEAsFromString', () => {
  // this is not a valid DDB expression, but is valid according to this type
  expectTypeOf<ExtractEAsFromString<
    'SET #hi,#oop,:boo,:c,:ah,    dontExtract,#final'
  >>().toEqualTypeOf<
    {
      ean: '#hi' | '#oop' | '#final';
      eav: ':boo' | ':c' | ':ah';
    }
  >();

  // this is never because there are two EAVs directly next to each other, which is an illegal pattern in any DDB expression
  expectTypeOf<ExtractEAsFromString<
    '#hi,#oop,:boo,:c:ah'
  >>().toBeNever();
  expectTypeOf<ExtractEAsFromString<
    '#hi#oop,:boo,:c,:ah'
  >>().toBeNever();
});