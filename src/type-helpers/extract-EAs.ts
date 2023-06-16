import { AlphaNumericCharacters } from "./string";

type _ExtractEAsFromString<S extends string, Curr extends string = "", EANs extends string = never, EAVs extends string = never> =
  S extends `${infer Start}${infer Rest}`
  ? (
    Start extends '#' | ':' // if we see these, start a new Curr, but only if there isn't a current Curr already ongoing
    ? (
      Curr extends ""
      ? _ExtractEAsFromString<Rest, Start, EANs, EAVs>
      : never
    )
    : (
      Curr extends "" // if Curr is empty and Start wasn't hash or colon, just continue
      ? (
        _ExtractEAsFromString<Rest, "", EANs, EAVs>
      )
      : (
        Start extends AlphaNumericCharacters // keep Curr going
        ? (
          _ExtractEAsFromString<Rest, `${Curr}${Start}`, EANs, EAVs>
        )
        : (
          Curr extends `#${string}` // Curr is ongoing and Start did not extend an allowed EA value. Curr is done
          ? (
            _ExtractEAsFromString<Rest, "", EANs | Curr, EAVs> // either put it in the EANs
          )
          : (
            _ExtractEAsFromString<Rest, "", EANs, EAVs | Curr> // or put it in the EAVs
          )
        )
      )
    )
  )
  : { ean: EANs; eav: EAVs };

// Important note: append a non-alphanumeric character at the end so that if an EA is the final thing in the string before it ends, 
// there is an invalid character there to add it to the EANs or EAVs union. 
// Without this, if there is an ongoing Curr when the string terminates, it isn't added to the union!
// I could fix this with some extra logic when constructing the final object, but this is easier.
export type ExtractEAsFromString<S extends string> = _ExtractEAsFromString<`${S} `> extends infer E extends { ean: string; eav: string } ? E : never;