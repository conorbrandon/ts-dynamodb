import { AnyExpressionAttributeNames, ExpressionAttributeValues } from "../../dynamodb-types";
import { DeepValidateShapev2WithBinaryResult } from "../deep-validate";
import { CreatePropPickArrayFromDocPath } from "../PE/pe-lib";
import { Head } from "../record";
import { DrillIntoTypeUsingStrArray, Split, Trim, UnionSplitter, CreateNestedObjectUsingStringArray } from "../string";
import { IsNever, IsNoUncheckedIndexAccessEnabled, NoUndefined } from "../utils";
import { NestedPickForUE } from "./nested-pick";

// ########## Step 1 ##########
// Remember, we are guaranteeing (hopefully) that each clause is separated by a space on both sides. It looks like DynamoDB makes you do it before a clause, but not after if the next character is an #ean. But, the cleanup type we use in IsUEValid will replace any clauses that have this #ean condition.
type SplitUEForSet<UE extends string> = UnionSplitter<UnionSplitter<Split<UE, " ADD ">[number], " REMOVE ">[number], " DELETE ">[number];
export type ExtractSetterPartOfUE<UE extends string> = SplitUEForSet<UE> extends infer Strs
  ? Strs extends `${string}SET${infer setterPart}`
  ? Trim<setterPart, " ">
  : never
  : never;

// ########## Step 2 ##########
/** Also used in UE/output.ts */
export type ExtractSetterTuplesLookAhead<SetterPartOfUE extends string, Stack extends string[] = [], CurrentSetter extends string = "", SetterTuples extends string[] = []> =
  SetterPartOfUE extends `${infer Char extends string}${infer Rest extends string}`
  ? (
    Char extends ","
    ? (
      Stack['length'] extends 0
      ? ExtractSetterTuplesLookAhead<Rest, [], "", [...SetterTuples, CurrentSetter]>
      : ExtractSetterTuplesLookAhead<Rest, Stack, `${CurrentSetter}${Char}`, SetterTuples>
    )
    : (
      Char extends "("
      ? ExtractSetterTuplesLookAhead<Rest, [...Stack, Char], `${CurrentSetter}${Char}`, SetterTuples>
      : (
        Char extends ")"
        ? ExtractSetterTuplesLookAhead<Rest, Head<Stack>, `${CurrentSetter}${Char}`, SetterTuples>
        : (
          ExtractSetterTuplesLookAhead<Rest, Stack, `${CurrentSetter}${Char}`, SetterTuples>
        )
      )
    )
  )
  : (
    // It's possible this will not extend string[] if the UE setter part is not well formed, but the hope is DynamoDB then errors and forces a correction to be made
    [...SetterTuples, CurrentSetter] extends infer finalSetterTuples extends string[]
    ? {
      [K in keyof finalSetterTuples]: Split<finalSetterTuples[K], "="> // and this should extend [string, string] after split, but again, if for example there is a trailing comma in the setter part, the last array will just be empty, but DynamoDB should not accept a setter part like that
    }
    : never
  );

// ########## Step 3 ##########
type UEOperators = '+' | '-';
type BrokenCrement = {
  crement: true;
  left: any;
  right: any;
};
type BrokenListAppend = {
  list_append: true;
  left: any;
  right: any;
};
type BrokenIfNotExists = {
  if_not_exists: true;
  left: any;
  right: any;
};
type BrokenEAV = {
  eav: true;
  key: string;
};
type BrokenDocPath = {
  docpath: true;
  path: string;
};
/** Note the value of these steps matters according to my current understanding of the UE and its constituent parts.
 * The final two types, BrokenEAV and BrokenDocPath, are last because they are potentially operands to crements, list_append, or if_not_exists, or can be standalone values by themselves.
 * if_not_exists must come after crements and list_append because it can be an operand of these two functions, or can of course be standalone.
 */
type _BreakUpValuePartOfSingleSetterTuple<ValuePart extends string> =
  (
    ValuePart extends `${infer left extends string}${UEOperators}${infer right extends string}`
    ? {
      crement: true;
      left: _BreakUpValuePartOfSingleSetterTuple<left>;
      right: _BreakUpValuePartOfSingleSetterTuple<right>;
    }
    : (
      ValuePart extends `list_append(${string})`
      ? (
        // We can't use simple inference like we do below for if_not_exists, because if if_not_exists falls within list_append, and it comes _first_, the simple logic below will split it in the WRONG spot
        SplitOnOneOpenParen<ValuePart> extends infer splitOneParen
        ? (
          IsNever<splitOneParen> extends true
          ? {
            list_append: true;
            left: never;
            right: never;
          }
          : (
            splitOneParen extends [`list_append(${infer left extends string}`, `${infer right extends string})`]
            ? {
              list_append: true;
              left: _BreakUpValuePartOfSingleSetterTuple<left>;
              right: _BreakUpValuePartOfSingleSetterTuple<right>;
            }
            : {
              list_append: true;
              left: never;
              right: never;
            }
          )
        )
        : never
      )
      : (
        ValuePart extends `if_not_exists(${infer left extends string},${infer right extends string})`
        ? {
          if_not_exists: true;
          left: _BreakUpValuePartOfSingleSetterTuple<left>;
          right: _BreakUpValuePartOfSingleSetterTuple<right>;
        }
        : (
          ValuePart extends `:${string}`
          ? {
            eav: true;
            key: ValuePart;
          }
          : (
            {
              docpath: true;
              path: ValuePart;
            }
          )
        )
      )

    )
  );
/** NOTE: ONLY EXPORTED FOR TESTS */
export type BreakUpValuePartOfSetterTuples<SetterTuples extends [string, string][]> = {
  [K in keyof SetterTuples]: [SetterTuples[K][0], _BreakUpValuePartOfSingleSetterTuple<SetterTuples[K][1]>]
};

/**
 * NOTE: ONLY EXPORTED FOR TESTS
 * 
 * Prerequisites for using this type:
 * 1. Str contains NO whitespace whatsoever
 * 2. The number of open parens and closed parens is equal
 * 3. Most importantly, the intended outcome is to split the string on a comma in a place where the number of open parentheses will be exactly ONE
 * @example
 * ```ts
 * "list_append(if_not_exists(pure,:emptyList),:pure)" = ["list_append(if_not_exists(pure,:emptyList)", ":pure)"]
 * ```
 */
export type SplitOnOneOpenParen<Str extends string, Stack extends string[] = [], Acc extends string = ""> =
  Str extends `${infer Char extends string}${infer Rest extends string}`
  ? (
    Char extends ","
    ? (
      Stack extends [string]
      ? [Acc, Rest]
      : SplitOnOneOpenParen<Rest, Stack, `${Acc}${Char}`>
    )
    : (
      Char extends "("
      ? SplitOnOneOpenParen<Rest, [...Stack, Char], `${Acc}${Char}`>
      : (
        Char extends ")"
        ? SplitOnOneOpenParen<Rest, Head<Stack>, `${Acc}${Char}`>
        : (
          SplitOnOneOpenParen<Rest, Stack, `${Acc}${Char}`>
        )
      )
    )
  )
  : never; // In this case, we shouldn't get to the end of the string if the list_append is well formed

// ########## Step 4 ##########
type _GetFinalValueOfSetterTupleForComputedType<ValueStruct extends object, T extends Record<any, any>, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues> =
  (
    ValueStruct extends BrokenCrement
    ? (
      _GetFinalValueOfSetterTupleForComputedType<ValueStruct['left'], T, EAN, EAV> extends infer left
      ? _GetFinalValueOfSetterTupleForComputedType<ValueStruct['right'], T, EAN, EAV> extends infer right
      ? (
        IsNever<left> extends true // check for never
        ? never
        : IsNever<right> extends true
        ? never
        : [left] extends [number] // we don't want to use distributive conditional types, because we ONLY want to allow numbers
        ? [right] extends [number]
        /**
         * Sigh, we union to support branded types. The use case is something like this: SET posNum = posNum + :posNum, so we basically want to make sure the two numbers we're adding together, if branded, can be assigned to the left side, if branded. Ex: PosNum | number extends PosNum ? 1 : 0 = 0, not just any old number is a PosNum!
         * The reason we can't JUST union left | right is when we do the final validation, if left and right are actually the same value and are also the same as the constant value on the type, everything passes, but it shouldn't. By unioning with number we don't destroy branded types though. 
         */
        ? left | right | number // phew we're done
        : never
        : never
      )
      : never // fallback for inference
      : never
    )
    : (
      ValueStruct extends BrokenListAppend
      ? (
        _GetFinalValueOfSetterTupleForComputedType<ValueStruct['left'], T, EAN, EAV> extends infer left
        ? _GetFinalValueOfSetterTupleForComputedType<ValueStruct['right'], T, EAN, EAV> extends infer right
        ? (
          IsNever<left> extends true // check for never
          ? never
          : IsNever<right> extends true
          ? never
          : [left] extends [any[]] // we don't want to use distributive conditional types, because we ONLY want to allow arrays
          ? [right] extends [any[]]
          ? [...left, ...right] // phew we're done
          : never
          : never
        )
        : never // fallback for inference
        : never
      )
      : ValueStruct extends BrokenIfNotExists
      ? (
        _GetFinalValueOfSetterTupleForComputedType<ValueStruct['left'], T, EAN, EAV> extends infer left
        ? _GetFinalValueOfSetterTupleForComputedType<ValueStruct['right'], T, EAN, EAV> extends infer right
        ? (
          IsNever<left> extends true // check for never
          ? never
          : IsNever<right> extends true
          ? never
          : NoUndefined<left> | right // remember, because of how if_not_exists works, it will take on the value on the left side if it exists (meaning, it is guaranteed to not be undefined!)
        )
        : never // fallback for inference
        : never
      )
      : ValueStruct extends BrokenEAV
      ? (
        ValueStruct['key'] extends keyof EAV
        ? EAV[ValueStruct['key']]
        : never
      )
      : ValueStruct extends BrokenDocPath
      ? (
        CreatePropPickArrayFromDocPath<ValueStruct['path'], EAN> extends (infer propPickArray extends string[])
        ? DrillIntoTypeUsingStrArray<
          NestedPickForUE<T, propPickArray, (IsNoUncheckedIndexAccessEnabled extends true ? undefined : never)>,
          propPickArray
        >
        : never
      )
      : never // This should never be hit unless an error
    )
  );
/** NOTE: ONLY EXPORTED FOR TESTS */
export type GetFinalValuesOfSetterTuples<SetterTuples extends [string, object][], T extends Record<any, any>, EAN extends AnyExpressionAttributeNames, EAV extends ExpressionAttributeValues> = {
  [K in keyof SetterTuples]: [SetterTuples[K][0], _GetFinalValueOfSetterTupleForComputedType<SetterTuples[K][1], T, EAN, EAV>]
};

// ########## Step 5 ##########
/** Uses the setter arrays parsed from a UE to pick from type T based on what they are setting */
type CreatePickedObjectFromDocPath<RawDocPath extends string, T extends object, EAN extends AnyExpressionAttributeNames> =
  CreatePropPickArrayFromDocPath<RawDocPath, EAN> extends (infer PropPickArray extends string[])
  ? NestedPickForUE<T, PropPickArray, (IsNoUncheckedIndexAccessEnabled extends true ? undefined : never)>
  : never;
/** NOTE: ONLY EXPORTED FOR TESTS */
export type CreatePickedAndComputedTypesForSetters<FinalValueSetterTuples extends [string, any][], T extends object, EAN extends AnyExpressionAttributeNames> = {
  [K in keyof FinalValueSetterTuples]: [
    picked: CreatePickedObjectFromDocPath<FinalValueSetterTuples[K][0], T, EAN>,
    computed: FinalValueSetterTuples[K][1] extends infer finalValue // cannot infer and distribute in one step
    ? finalValue extends any // distribute types
    ? CreateNestedObjectUsingStringArray<
      CreatePropPickArrayFromDocPath<FinalValueSetterTuples[K][0], EAN>,
      finalValue
    >
    : never
    : never
  ]
};

// ########## Step 6 ##########
/** NOTE: ONLY EXPORTED FOR TESTS */
export type FinalValidationOfSetterUE<PickedAndComputed extends [picked: object, computed: object][]> =
  // Iterate over all setter PickedAndComputed types
  {
    [K in keyof PickedAndComputed]:
    PickedAndComputed[K][1] extends infer computedType // extract computed type
    ? IsNever<computedType> extends true ? 0 // this check is CRITICAL! without it, mappedValidation[number] below unions and strips never
    : computedType extends object // distribute it over object
    ? DeepValidateShapev2WithBinaryResult<computedType, PickedAndComputed[K][0]> // deep validate each computed type against it's corresponding picked type
    : never
    : never
  } extends infer mappedValidation extends number[] // store the results we gathered in an array
  ? mappedValidation[number] // FINAL STEP in the whole process: index the results array with number to determine the union of validation statuses for all setter tuples
  : never;


// Put all the above steps 1-6 together
export type IsUEValidForSET<TrimmedUE extends string, T extends Record<any, any>, EAN extends AnyExpressionAttributeNames, EAV extends Record<`:${string}`, any>> =
  ExtractSetterPartOfUE<TrimmedUE> extends infer setterPart
  ? IsNever<setterPart> extends true ? 1 // setterPart _could_ be never here!
  : setterPart extends string
  ? ExtractSetterTuplesLookAhead<setterPart> extends (infer setterTuples extends [string, string][])
  ? BreakUpValuePartOfSetterTuples<setterTuples> extends (infer structSetterValueTuples extends [string, object][])
  ? GetFinalValuesOfSetterTuples<structSetterValueTuples, T, EAN, EAV> extends (infer finalValueSetterTuples extends [string, any][])
  ? CreatePickedAndComputedTypesForSetters<finalValueSetterTuples, T, EAN> extends (infer pickedAndComputed extends [object, object][])
  ? FinalValidationOfSetterUE<pickedAndComputed> extends infer finalValidation
  ? IsNever<finalValidation> extends true ? 0 : finalValidation
  : never
  : never
  : never
  : never
  : never // this is the `never` that corresponds to `setterTuples extends [string, string][]`. This is hit in the case of a trailing comma on the SET part of the UE (among other errors).
  : never
  : never;
