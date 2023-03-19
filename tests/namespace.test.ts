import { expectTypeOf } from "expect-type";
import { TypesafeDocumentClientv2 } from "../src/lib";
import { tsDdb } from "./lib/lib";
import { MyTable, MyTableType, Table3Type } from "./lib/tables";
import { A, B, Type3Zod } from "./lib/types";

test('all', () => {

  expectTypeOf<TypesafeDocumentClientv2.GetTableItemKey<Table3Type, Type3Zod>>().toEqualTypeOf<Pick<Type3Zod, "threeID" | "otherID">>();

  // proving that this type can actually be helpful and the generics won't conflict
  const _ = async (k: TypesafeDocumentClientv2.GetTableItemKey<MyTableType, B>) => {

    const blah = await tsDdb.get({
      TableName: MyTable.name,
      Key: k
    });
    console.log(blah.Item);

  };
  _;

  expectTypeOf<TypesafeDocumentClientv2.StrictSimpleUpdateSETItem<MyTableType, A>>().toEqualTypeOf<Partial<Omit<A, 'p0' | 's0'>>>();

});