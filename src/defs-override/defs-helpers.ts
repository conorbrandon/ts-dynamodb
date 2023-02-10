import { AWSError, Request } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";

/** Convenient helper type for the DynamoDB callback parameters */
export type TypesafeCallback<Output, Err = AWSError> = (err: Err, data: Output) => void;

/** Convenient helper type for the AWS Request type */
export type TypesafeRequest<Output> = Request<Output, AWSError>;

/** Convenient helper type for the AWS PromiseResult type */
export type TypesafePromiseResult<Output> = PromiseResult<Output, AWSError>;