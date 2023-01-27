import { expectTypeOf } from 'expect-type'
import { ExtractTableItemForKey, TableIndex, TableIndexName, TableInidicesUnion, TableItem, TableKey, TableKeyPartitionSortRaw, TableName } from '../src/lib';
import { CiCdTable, CiCdTableType, MyTableType, Table3Type } from './lib/tables';
import { CICD, CICDBigger, Type3, UUIDSparse } from './lib/types';

type allTestTables = MyTableType | CiCdTableType | Table3Type;

test('table extraction helper types', () => {
  expectTypeOf<TableName<allTestTables>>().toEqualTypeOf<"my-table.test" | "my-table.prod" | "ci-cd.test" | "ci-cd.prod" | "table3.test" | "table3.prod">();

  expectTypeOf<TableKeyPartitionSortRaw<allTestTables, "my-table.test" | "my-table.prod">>().toEqualTypeOf<{ partitionKey: "p0"; sortKey?: "s0" | undefined }>();

  expectTypeOf<TableKey<allTestTables, "ci-cd.test" | "ci-cd.prod">>().toEqualTypeOf<{
    hashKey: UUIDSparse;
    rangeKey: "big-cicd";
  } | {
    hashKey: UUIDSparse;
    rangeKey: "small-cicd";
  } | {
    hashKey: UUIDSparse;
    rangeKey: "mini-cicd";
  }>();

  expectTypeOf<TableItem<allTestTables, "table3.test" | "table3.prod">>().toEqualTypeOf<Type3>();

  expectTypeOf<ExtractTableItemForKey<CICD, {
    hashKey: UUIDSparse;
    rangeKey: "big-cicd";
  }>>().toEqualTypeOf<CICDBigger>();

  expectTypeOf<TableInidicesUnion<allTestTables, "ci-cd.test" | "ci-cd.prod">>().toEqualTypeOf<(typeof CiCdTable)['indices'][keyof (typeof CiCdTable)['indices']]>();

  expectTypeOf<TableIndexName<allTestTables, "table3.test" | "table3.prod">>().toEqualTypeOf<"hoo-index.test" | "hoo-index.prod" | 'woo-index.test' | 'woo-index.prod' | 'hooAll-index.test' | 'hooAll-index.prod'>();

  expectTypeOf<TableIndex<allTestTables, "ci-cd.test" | "ci-cd.prod", `datum-all-index.test` | `datum-all-index.prod`>>().toEqualTypeOf<(typeof CiCdTable)['indices']['datum-all-index']>();
});