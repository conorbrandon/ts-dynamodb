import { Split } from "./string";

type _BW<SplitToExtend extends string[], ExtendingSplit extends string[]> =
  [SplitToExtend, ExtendingSplit] extends [[infer SeStart, ...infer SeRest extends string[]], [infer EsStart, ...infer EsRest extends string[]]]
  ? (
    EsStart extends SeStart
    ? (
      | (
        string extends SeStart // we must check for this first, otherwise `${number}` certainly extends string
        ? _BW<SplitToExtend, EsRest>
        : `${number}` extends SeStart
        ? _BW<SplitToExtend, EsRest>
        : never
      )
      | (
        _BW<SeRest, EsRest>
      )
    )
    : 0
  )
  : (
    SplitToExtend extends []
    ? (
      string[] extends ExtendingSplit
      ? 1
      // if we get here and there are no more characters in the StrToExtend, BUT the ExtendingStr does have more "characters" (a part we were able to isolate, then the comparison is invalid)
      : 0
    )
    : 1
  );
type _BeginsWith<StrToExtend extends string, ExtendingStr extends string> = _BW<Split<StrToExtend, "">, Split<ExtendingStr, "">>;

export type BeginsWith<Str extends string, Pattern extends string> =
  string extends Str
  ? 1
  : (
    Str extends Str
    ? Pattern extends Pattern
    ? (
      Pattern extends Str
      ? 1
      : _BeginsWith<Str, `${Pattern}${string}`> // append `${string}` to Pattern because (obv.), Pattern may only be the first few chars of Str
    )
    : never
    : never
  );