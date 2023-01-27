import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { TableFromValue, Table, TypesafeDocumentClientv2, TypesafeDocumentClientRawv2 } from "../../src";

// Can handle environment/stage dependent table and index names no problem
const stage = process.env.stage === 'test' ? 'test' : 'prod';

// Supports branded types
export type UserID = string & { __brand: 'UserID' };
export type PositiveNumber = number & { __brand: 'PositiveNumber' };
export type User = {
  hashKey: UserID;
  rangeKey: 'user';
  created: number;
  updated?: number;
  username: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  lastLogin: number;
  favoriteSites?: SiteID[];
  numLogins: PositiveNumber;
};
export type SiteID = string & { __brand: 'SiteID' };
export type Site = {
  hashKey: SiteID;
  rangeKey: 'site';
  created: number;
  updated?: number;
  url?: string;
  categories?: string[];
  config: {
    private: boolean;
    userBlacklist: DocumentClient.StringSet | undefined;
  };
};

export const MyTable = {
  name: `my-table.${stage}`,
  indices: {
    'lastLogin-index': {
      name: 'lastLogin-index',
      type: 'LSI',
      sortKey: 'lastLogin',
      project: 'keys-only'
    },
    'rangeKey-role-index': {
      name: 'rangeKey-role-index',
      type: 'GSI',
      partitionKey: 'rangeKey',
      sortKey: 'role',
      project: 'attributes',
      attributes: ['email']
    }
  }
} as const satisfies TableFromValue;
export type MyTableType = Table<typeof MyTable, User | Site, 'hashKey', 'rangeKey'>;
export const tsDdb = new TypesafeDocumentClientv2<MyTableType>(
  new DocumentClient({ region: 'us-east-1' })
);
export const tsDdbRaw = new DocumentClient({ region: 'us-east-1' }) as TypesafeDocumentClientRawv2<MyTableType>;