import { AWSError, Request } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { XLevelSimplifyObject } from "../type-helpers/utils";

// NOTE: 
// it appears, hopefully, that by allowing typescript to simplify the output using XLevelSimplifyObject 
// that the Awaited type doesn't blow up when trying to infer the callback which (at the time of writing) is called `F`.

/** Convenient helper type for the DynamoDB callback parameters */
export type TypesafeCallback<Output, Err = AWSError> = (err: Err, data: XLevelSimplifyObject<Output>) => void;

/** Convenient helper type for the AWS Request type */
export type TypesafeRequest<Output> = Request<XLevelSimplifyObject<Output>, AWSError>;

/** Convenient helper type for the AWS PromiseResult type */
export type TypesafePromiseResult<Output> = PromiseResult<XLevelSimplifyObject<Output>, AWSError>;

export type _LogParams = { log: boolean; message?: string };