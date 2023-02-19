import { inspect } from 'util';
import AWS from 'aws-sdk';
import { TypesafeDocumentClientv2, TypesafeDocumentClientRawv2 } from "../../src/lib";
import { CiCdTableType, MyTableType, Table3Type } from './tables';

export const myInspect = (thing: any) => inspect(thing, { depth: null, colors: true });

export const tsDdbRaw = new AWS.DynamoDB.DocumentClient({
  region: 'local',
  endpoint: 'http://localhost:8001'
}) as TypesafeDocumentClientRawv2<MyTableType | CiCdTableType | Table3Type>;

export const tsDdb = new TypesafeDocumentClientv2<MyTableType | CiCdTableType | Table3Type>(
  new AWS.DynamoDB.DocumentClient({
    region: 'local',
    endpoint: 'http://localhost:8001'
  }),
  { depth: null, colors: true }
);