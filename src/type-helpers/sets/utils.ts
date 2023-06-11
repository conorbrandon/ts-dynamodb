import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { NativeJSBinaryTypes } from "../../dynamodb-types";
import { IsAnyOrUnknown, Primitive } from "../utils";

type _DeepAddWrapperNameToDynamoDBSet<T, NoUndefined extends boolean> =
  IsAnyOrUnknown<T> extends true
  ? T
  : T extends DocumentClient.DynamoDbSet
  ? ({ wrapperName: 'Set' } & T) | (NoUndefined extends true ? never : undefined) // for maximum type safety: a DynamoDB set cannot exist and be empty, thus, if you ever DELETE all elements from a DynamoDB set, the set no longer exists (i.e., is undefined). In other words, there is no way to guarantee that the set will always be returned.
  : (
    T extends Primitive | NativeJSBinaryTypes | Set<any> | ReadonlySet<any> // this is to pick up branded types, stuff like that
    ? T
    : T extends object
    ? TSDdbSet<T, NoUndefined>
    : T
  );
export type TSDdbSet<T extends object, NoUndefined extends boolean = false> = {
  [K in keyof T]: _DeepAddWrapperNameToDynamoDBSet<T[K], NoUndefined>
};