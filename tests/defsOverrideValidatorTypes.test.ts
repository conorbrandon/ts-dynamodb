import { expectTypeOf } from "expect-type";
import { NotEmptyWithMessage } from "../src/type-helpers/record";
import { FilterUnusedEANOrVs, UseAllExpressionAttributesInString } from "../src/type-helpers/string";

test('UseAllExpressionAttributesInString, NotEmptyWithMessage, FilterUnusedEANOrVs, etc..', () => {

  expectTypeOf<NotEmptyWithMessage<{}, "That's illegal">>().toEqualTypeOf<{ 'Error ❌': "That's illegal" }>();
  expectTypeOf<NotEmptyWithMessage<{ notIllegal: true }, "That's illegal">>().toEqualTypeOf<{ notIllegal: true }>();

  expectTypeOf<UseAllExpressionAttributesInString<{
    '#oop': 'oop';
    '#blah': 'blah';
  }, {
    ':doh': 'doh';
  }>>().toEqualTypeOf<`${string}#oop${string}` & `${string}#blah${string}` & `${string}:doh${string}`>();
  expectTypeOf<'#oops, #blah, :doh' extends UseAllExpressionAttributesInString<{
    '#oop': 'oop';
    '#blah': 'blah';
  }, {
    ':doh': 'doh';
  }> ? true : false>().toEqualTypeOf<true>();
  expectTypeOf<'#oops, blah, :doh' extends UseAllExpressionAttributesInString<{
    '#oop': 'oop';
    '#blah': 'blah';
  }, {
    ':doh': 'doh';
  }> ? true : false>().toEqualTypeOf<false>();

  expectTypeOf<FilterUnusedEANOrVs<'#oops, blah, :doh', '#oop'>>().toBeNever();
  expectTypeOf<FilterUnusedEANOrVs<'#oops, blah, :doh', '#oop' | '#blah' | ':doh'>>().toEqualTypeOf<'#blah'>();

});