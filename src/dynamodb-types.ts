import { DynamoDB } from "aws-sdk";
import { IsAny } from "./type-helpers/utils";
import { Stream } from "stream";

export type ExpressionAttributeNames<Names extends string> = Record<`#${string}`, Names>;
export type AnyExpressionAttributeNames = ExpressionAttributeNames<string>;

export type ExpressionAttributeValues = Record<`:${string}`, any>;

export type DynamoDBKeyValue = string | number | DynamoDB.DocumentClient.BinaryAttributeValue;

type BlobTypePolyfill = IsAny<Blob> extends true ? never : Blob extends { readonly size: number; readonly type: string } ? Blob : never;
// unfortunately there are these two stupid interfaces in the Documentclient.binaryType: File and Blob, which are literally just {}, which means a whole bunch of stuff extends the empty object (boolean, ANY object, and probably more). sigh.
export type NativeJSBinaryTypes = Buffer | BlobTypePolyfill | ArrayBuffer | DataView | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | Stream;

export type EANString = `${string}#${string}`;
export type EAVString = `${string}:${string}`;