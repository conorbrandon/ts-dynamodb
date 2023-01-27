import { DynamoDB } from "aws-sdk";

export type ExpressionAttributeNames<Names extends string> = Record<`#${string}`, Names>;
export type AnyExpressionAttributeNames = ExpressionAttributeNames<string>;

export type ExpressionAttributeValues = Record<`:${string}`, any>;

export type DynamoDBKeyValue = string | number | DynamoDB.DocumentClient.BinaryAttributeValue;

// unfortunately there are these two stupid interfaces in the Documentclient.binaryType: File and Blob, which are literally just {}, which means a whole bunch of stuff extends the empty object (boolean, ANY object, and probably more). sigh.
export type NativeJSBinaryTypes = Buffer | Blob | ArrayBuffer | DataView | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

export type EANString = `${string}#${string}`;
export type EAVString = `${string}:${string}`;