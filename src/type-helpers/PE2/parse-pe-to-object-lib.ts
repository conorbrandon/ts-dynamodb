import { AnyExpressionAttributeNames } from "../../dynamodb-types";
import { AlphaNumericCharacters, Whitespace } from "../string";
import { ArrayIndicesStruct } from "./pe-lib";

type ReplaceEANsInFinalClause<CurrClause extends string[], EANs extends AnyExpressionAttributeNames, Acc extends string[] = []> =
  CurrClause extends [infer Start extends string, ...infer Rest extends string[]]
  ? (
    Start extends `#${string}`
    ? (
      Start extends keyof EANs
      ? ReplaceEANsInFinalClause<Rest, EANs, [...Acc, EANs[Start]]>
      : never
    )
    : ReplaceEANsInFinalClause<Rest, EANs, [...Acc, Start]>
  )
  : Acc;

type _AddToPEStructAcc<PropPick extends string[], Acc = {}> =
  PropPick extends [infer First extends string, ...infer Rest extends string[]]
  ? Acc extends true
  ? Acc // SHORT CIRCUIT for already existing top level property in Acc that terminated a doc path
  : (
    First extends `[${infer Index extends number}]`
    ? (
      Acc extends ArrayIndicesStruct
      ? ( // if there is an existing ArrayIndicesStruct, either add to an existing property (arr[0].foo, arr[0].bar), or set a new property
        `${Index}` extends keyof Acc
        ? {
          [K in keyof Acc]: `${Index}` extends K ? _AddToPEStructAcc<Rest, Acc[K]> : Acc[K]
        }
        : {
          [K in `${Index}`]: _AddToPEStructAcc<Rest, {}>
        } & Acc
      ) // otherwise, create a new ArrayIndicesStruct
      : {
        [K in `${Index}`]: _AddToPEStructAcc<Rest, {}>
      } & ArrayIndicesStruct
    )
    : First extends keyof Acc
    // these are fairly standard, if First is in Acc already, add to it
    ? {
      [K in keyof Acc]: First extends K ? _AddToPEStructAcc<Rest, Acc[K]> : Acc[K]
    }
    // otherwise, set First as a new property
    : {
      [K in First]: _AddToPEStructAcc<Rest, {}>
    } & Acc
  )
  : true;

type _ParsePEToPEStruct<PE extends string, EANs extends AnyExpressionAttributeNames, CurrProp extends string, CurrClause extends string[], Acc extends {}> =
  PE extends `${infer Start}${infer Rest}`
  ? (
    Start extends Whitespace
    ? _ParsePEToPEStruct<Rest, EANs, CurrProp, CurrClause, Acc>
    : (
      Start extends ","
      ? (
        CurrProp extends `` | `${number}]` | `${string}${AlphaNumericCharacters}`
        ? CurrProp extends "" // special case where index access terminates the PE
        ? _ParsePEToPEStruct<Rest, EANs, '', [], _AddToPEStructAcc<ReplaceEANsInFinalClause<CurrClause, EANs>, Acc>>
        : _ParsePEToPEStruct<Rest, EANs, '', [], _AddToPEStructAcc<ReplaceEANsInFinalClause<[...CurrClause, CurrProp], EANs>, Acc>>
        : never
      )
      : Start extends "."
      ? (
        CurrProp extends `` | `${string}${AlphaNumericCharacters}` | `[${number}]`
        ? CurrProp extends "" // special case where index access terminates the PE
        ? _ParsePEToPEStruct<Rest, EANs, '', CurrClause, Acc>
        : _ParsePEToPEStruct<Rest, EANs, '', [...CurrClause, CurrProp], Acc>
        : never
      )
      : Start extends "["
      ? (
        CurrProp extends `` | `${string}${AlphaNumericCharacters}` | `[${number}]`
        ? CurrProp extends "" // special case where index access terminates the PE
        ? _ParsePEToPEStruct<Rest, EANs, '[', CurrClause, Acc>
        : _ParsePEToPEStruct<Rest, EANs, '[', [...CurrClause, CurrProp], Acc>
        : never
      )
      : Start extends "]"
      ? (
        CurrProp extends `[${number}`
        ? _ParsePEToPEStruct<Rest, EANs, '', [...CurrClause, `${CurrProp}]`], Acc>
        : never
      )
      : _ParsePEToPEStruct<Rest, EANs, `${CurrProp}${Start}`, CurrClause, Acc>
    )
  )
  : Acc;

/**
 * For simplicity in terminating the recursion, a comma is appended to the input PE.
 */
export type ParsePEToPEStruct<PE extends string, EANs extends AnyExpressionAttributeNames> = _ParsePEToPEStruct<`${PE},`, EANs, "", [], {}>;

type _CreatePropPickArrayFromDocPath<PE extends string, EANs extends AnyExpressionAttributeNames, CurrProp extends string, CurrClause extends string[]> =
  PE extends `${infer Start}${infer Rest}`
  ? (
    Start extends Whitespace
    ? _CreatePropPickArrayFromDocPath<Rest, EANs, CurrProp, CurrClause>
    : (
      Start extends "."
      ? (
        CurrProp extends `` | `${string}${AlphaNumericCharacters}` | `[${number}]`
        ? CurrProp extends "" // special case where index access terminates the CurrProp
        ? _CreatePropPickArrayFromDocPath<Rest, EANs, '', CurrClause>
        : _CreatePropPickArrayFromDocPath<Rest, EANs, '', [...CurrClause, CurrProp]>
        : never
      )
      : Start extends "["
      ? (
        CurrProp extends `` | `${string}${AlphaNumericCharacters}` | `[${number}]`
        ? CurrProp extends "" // special case where index access also came before this index access
        ? _CreatePropPickArrayFromDocPath<Rest, EANs, '[', CurrClause>
        : _CreatePropPickArrayFromDocPath<Rest, EANs, '[', [...CurrClause, CurrProp]>
        : never
      )
      : Start extends "]"
      ? (
        CurrProp extends `[${number}`
        ? _CreatePropPickArrayFromDocPath<Rest, EANs, '', [...CurrClause, `${CurrProp}]`]>
        : never
      )
      : _CreatePropPickArrayFromDocPath<Rest, EANs, `${CurrProp}${Start}`, CurrClause>
    )
  )
  : (
    CurrProp extends `` | `${string}${AlphaNumericCharacters}` | `[${number}]`
    ? CurrProp extends "" // special case where index access terminates the CurrProp
    ? ReplaceEANsInFinalClause<CurrClause, EANs>
    : ReplaceEANsInFinalClause<[...CurrClause, CurrProp], EANs>
    : never
  );

/** 
 * Takes a SINGLE doc path, may have EANs in it, and create an array out of the doc path using the EANs. Parses only ONE DocPath!!!
 * General purpose function to be used anywhere, i.e. for UEs, etc...
 */
export type CreatePropPickArrayFromDocPath<PE extends string, EANs extends AnyExpressionAttributeNames> = _CreatePropPickArrayFromDocPath<PE, EANs, "", []>;