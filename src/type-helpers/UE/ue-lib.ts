import { AnyExpressionAttributeNames, ExpressionAttributeValues } from "../../dynamodb-types";
import { DeepWriteable } from "../record";
import { StringReplaceAll } from "../string";
import { IsUEValidForADD } from "./ADD";
import { IsUEValidForDELETE } from "./DELETE";
import { IsUEValidForREMOVE } from "./REMOVE";
import { IsUEValidForSET } from "./SET";

/** ddb UE clauses */
export type UEClauses = "SET" | "REMOVE" | "ADD" | "DELETE";
export type UEFunctions = "if_not_exists" | "list_append";

export type UEIsValid = "UE_IS_VALID";
type UESETInvalidError = "Error: the UpdateExpression is invalid - a SET clause does not agree with the type of item being updated. Make sure the left and right side of the setter are the same type, any increment/decrement operations are operating on strict `number` types, the `list_append` function takes two lists and sets a list, and the document path in the `if_not_exists` function points to a valid property.";
type UEREMOVEInvalidError = "Error: the UpdateExpression is invalid - a REMOVE clause does not agree with the type of item being updated. Make sure you are removing optional or `undefined` properties only.";
type UEADDInvalidError = "Error: the UpdateExpression is invalid - an ADD clause does not agree with the type of item being updated. Make sure you are adding strict `number` types (if the type value is a `readonly <number>`, this is typed as a constant and cannot be added to) and/or adding like-typed elements to a DynamoDbSet.";
type UEDELETEInvalidError = "Error: the UpdateExpression is invalid - a DELETE clause does not agree with the type of item being updated. Make sure you are deleting like-typed elements from a DynamoDbSet.";

type _IsUEValid<
  UE extends string,
  T extends Record<string, any>,
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues
> =
  IsUEValidForSET<UE, T, EAN, EAV> extends 1
  ? IsUEValidForREMOVE<UE, T, EAN> extends 1
  ? IsUEValidForADD<UE, T, EAN, EAV> extends 1
  ? IsUEValidForDELETE<UE, T, EAN, EAV> extends 1
  ? UEIsValid
  : UEDELETEInvalidError
  : UEADDInvalidError
  : UEREMOVEInvalidError
  : UESETInvalidError;

export type IsUEValid<
  UE extends string,
  T extends Record<string, any>,
  EAN extends AnyExpressionAttributeNames,
  EAV extends ExpressionAttributeValues
> = _IsUEValid<UppercaseUEClauses<UE>, T, EAN, DeepWriteable<EAV>>;

type WalkThroughUppercaseUEClauses<Str extends string, Acc extends string = ''> =
  Str extends `${string} ${infer Rest}`
  ? (
    Str extends `${infer Start}${Rest}`
    ? (
      Uppercase<Start> extends `${UEClauses} ${string}`
      ? WalkThroughUppercaseUEClauses<Rest, `${Acc}${Uppercase<Start>}`>
      : WalkThroughUppercaseUEClauses<Rest, `${Acc}${Start}`>
    )
    : never
  )
  : `${Acc}${Str}`;
export type UppercaseUEClauses<UE extends string> =
  WalkThroughUppercaseUEClauses<
    StringReplaceAll<StringReplaceAll<UE, { '\n': ' '; '\t': ' '; '\r': ' ' }>, {
      't#': 't #'; 'T#': 'T #'; ']t': '] t'; ']T': '] T'; ')t': ') t'; ')T': ') T'; // for SET
      'e#': 'e #'; 'E#': 'E #'; ']e': '] e'; ']E': '] E'; ')e': ') e'; ')E': ') E'; // for REMOVE and DELETE
      'd#': 'd #'; 'D#': 'D #'; ']d': '] d'; ']D': '] D'; ')d': ') d'; ')D': ') D'; // for ADD
    }>
  >;