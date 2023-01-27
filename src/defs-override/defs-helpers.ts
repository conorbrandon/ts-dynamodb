import { AWSError, Request } from "aws-sdk";

/** Convenient helper type for the DynamoDB callback parameters */
export type TypesafeCallback<Output, Err = AWSError> = (err: Err, data: Output) => void;

/** Convenient helper type for the AWS Request type */
export type TypesafeRequest<Output> = Request<Output, AWSError>;