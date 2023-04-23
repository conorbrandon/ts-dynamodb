import { Table } from "../../src/lib";
import { C, CICD, Type3 } from "./types";

type DDbStage = 'test' | 'prod';
const { stage } = process.env;
const ddbStage: DDbStage = stage === 'test' || !stage ? 'test' : 'prod';

export const MyTable = {
  name: `my-table.${ddbStage}`,
} as const;
export type MyTableType = Table<typeof MyTable, C, 'p0', 's0'>;

export const CiCdTable = {
  name: `ci-cd.${ddbStage}`,
  indices: {
    'datum-index': {
      name: `datum-index.${ddbStage}`,
      type: 'GSI',
      partitionKey: 'datum',
      sortKey: 'datumStr',
      project: 'attributes',
      attributes: ["thebig"]
    },
    'datumStr-index': {
      name: `datumStr-index.${ddbStage}`,
      type: 'GSI',
      partitionKey: 'datumStr',
      project: 'keys-only'
    },
    'datum-all-index': {
      name: `datum-all-index.${ddbStage}`,
      type: 'GSI',
      partitionKey: 'datum',
      sortKey: 'finaler',
      project: 'all'
    }
  }
} as const;
export type CiCdTableType = Table<typeof CiCdTable, CICD, 'hashKey', 'rangeKey'>;

export const Table3 = {
  name: `table3.${ddbStage}`,
  indices: {
    'hoo-index': {
      name: `hoo-index.${ddbStage}`,
      type: 'LSI',
      sortKey: 'hoo',
      project: 'attributes',
      attributes: ["nowItExists"]
    },
    'woo-index': {
      name: `woo-index.${ddbStage}`,
      type: 'LSI',
      sortKey: 'woo',
      project: 'keys-only'
    },
    'hooAll-index': {
      name: `hooAll-index.${ddbStage}`,
      type: 'LSI',
      sortKey: 'hoo',
      project: 'all'
    },
    'otherID-all-index': {
      name: `otherID-all-index.${ddbStage}`,
      type: 'GSI',
      partitionKey: 'otherID',
      project: 'all'
    }
  }
} as const;
export type Table3Type = Table<typeof Table3, Type3, 'threeID', 'otherID'>;