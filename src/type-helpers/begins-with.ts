import { Split } from "./string";

type _BW<SplitToExtend extends string[], ExtendingSplit extends string[]> =
  [SplitToExtend, ExtendingSplit] extends [[infer SeStart, ...infer SeRest extends string[]], [infer EsStart, ...infer EsRest extends string[]]]
  ? (
    EsStart extends SeStart
    ? (
      | (
        string extends SeStart // we must check for this first, otherwise `${number}` certainly extends string
        ? never // we actually don't want to continue the evaluation here like below, because TS is greedy in evaluating `${string}`s that don't come last. If it comes last, it'll get `...string[]`'ed to the end of SplitToExtend, and hit the very last last branch. If this proves to be incorrect, do what I did in the `${number}` branch below.
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
    // if we get here, it was the ...string[] of ExtendingSplit that eventually became just string[] (it doesn't matter if the Pattern originally did just end with `${string}` before we added our `${string}`, because in the end position, that can be empty). 
    // thus, it is sound (even if SplitToExtend has more chars of any type, which it will in this branch) to say Str could begin with Pattern. 
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
      // NOTE: cannot do Gt with ts-arithmetic here because Pattern could contain more number literals that `${number}` chars, but should still match
      : _BeginsWith<Str, `${Pattern}${string}`> // append `${string}` to Pattern because (obv.), Pattern may only be the first few chars of Str
    )
    : never
    : never
  );