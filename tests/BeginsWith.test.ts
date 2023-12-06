import { expectTypeOf } from "expect-type";
import { BeginsWith } from "../src/type-helpers/begins-with";

test('BeginsWith', () => {

  type testa = BeginsWith<`a${number}`, `a`>;
  //    ^?
  expectTypeOf<testa>().toEqualTypeOf<1>();

  type testb = BeginsWith<`${number}a`, `11a`>;
  //    ^?
  expectTypeOf<testb>().toEqualTypeOf<1>();

  type testc = BeginsWith<`${number}`, `11`>;
  //    ^?
  expectTypeOf<testc>().toEqualTypeOf<1>();

  type testd = BeginsWith<string, "a">;
  //   ^?
  expectTypeOf<testd>().toEqualTypeOf<1>();

  type teste = BeginsWith<`${string}abc`, "d">;
  //    ^?
  expectTypeOf<teste>().toEqualTypeOf<1>();

  type testf = BeginsWith<"abc", "d">;
  //    ^?
  expectTypeOf<testf>().toEqualTypeOf<0>();

  // this is evaluated greedily, and thus the third characters won't match (one is empty, the other is "b")
  type testg = BeginsWith<`${string}${number}`, "a1b">;
  //   ^?
  expectTypeOf<testg>().toEqualTypeOf<0>();

  // this one is a bit confusing, but given the premise that a string with 5 digits or more in a sequence satisfies the requirement that there are at least _4_ digits in a row in a sequence, it could
  type testh = BeginsWith<`${number}${number}${number}${number}`, `${number}${number}${number}${number}${number}`>;
  //    ^?
  expectTypeOf<testh>().toEqualTypeOf<0 | 1>();

  // this one works because the empty string gets simplified out
  type testi = BeginsWith<`${number}${number}${number}${number}`, `${number}${number}${""}${number}`>;
  //    ^?
  expectTypeOf<testi>().toEqualTypeOf<1>();

  // it must end with a number, and doesn't
  type testj = BeginsWith<`${number}${number}${number}`, "123a">;
  //    ^?
  expectTypeOf<testj>().toEqualTypeOf<0>();

  type testk = BeginsWith<"a" | "b", "a">;
  //   ^?
  expectTypeOf<testk>().toEqualTypeOf<0 | 1>();

  type testl = BeginsWith<"abc", "a" | "b">;
  //    ^?
  expectTypeOf<testl>().toEqualTypeOf<0 | 1>();

  // first char must be an "a" and the second must be a "b", there is no way this works
  type testm = BeginsWith<"abc", "aa" | "b">;
  //    ^?
  expectTypeOf<testm>().toEqualTypeOf<0>();

  // 4 digits in a row satisfies at least 3 digits in a row
  type testn = BeginsWith<`${number}${number}${number}`, "1234">;
  //    ^?
  expectTypeOf<testn>().toEqualTypeOf<1>();

  type testo = BeginsWith<`id_${number}`, `id_`>;
  //   ^?
  expectTypeOf<testo>().toEqualTypeOf<1>();

  // 5 digits in a row satisfies at least 1 digit in a row
  type testp = BeginsWith<`id_${number}`, `id_12345`>;
  //   ^?
  expectTypeOf<testp>().toEqualTypeOf<1>();

  type testq = BeginsWith<`id_${number}`, "id_123de">;
  //    ^?
  expectTypeOf<testq>().toEqualTypeOf<0>;

  type testr = BeginsWith<"", "a">;
  //   ^?
  expectTypeOf<testr>().toEqualTypeOf<0>();

  type tests = BeginsWith<"", "">;
  //   ^?
  expectTypeOf<tests>().toEqualTypeOf<1>();

  // these emulate the behavior of the previous logic (< 1.2.4), where if the eav was simply typed as string, we allowed the type to be extracted
  type testt =
    //    ^?
    | BeginsWith<string, string>
    | BeginsWith<`${number}123`, string>
    | BeginsWith<"abc 123 def 456", `${string}`>;
  expectTypeOf<testt>().toEqualTypeOf<1>();

  type testu =
    //  ^?
    // technically, the "any string" part may be `${number}`
    | BeginsWith<`${number}${number}`, `1${string}`>
    // technically, the "any string" part may be empty (which means `${number}` can begin with "1")
    | BeginsWith<`${number}`, `1${string}`>;
  expectTypeOf<testu>().toEqualTypeOf<1>();


  type ISOString = `${number}${number}${number}${number}-${number}${number}-${number}${number}T${number}${number}:${number}${number}.${number}${number}${number}Z`;
  type testiso1 =
    //   ^?
    | BeginsWith<ISOString, "2022">
    | BeginsWith<ISOString, "20">
    | BeginsWith<ISOString, "">
    | BeginsWith<ISOString, `202${number}`>
    | BeginsWith<ISOString, ISOString>;
  expectTypeOf<testiso1>().toEqualTypeOf<1>();

  type testiso01 =
    //   ^?
    | BeginsWith<ISOString, "2022-">
    | BeginsWith<ISOString, `2022-${number}`>;
  expectTypeOf<testiso01>().toEqualTypeOf<0 | 1>();

  type testiso0 =
    //   ^?
    | BeginsWith<ISOString, "a">;
  expectTypeOf<testiso0>().toEqualTypeOf<0>();

});
