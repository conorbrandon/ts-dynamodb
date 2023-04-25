import { expectTypeOf } from "expect-type";
import { ProjectNonIndexScan, ProjectScan } from "../src/type-helpers/scan/common";
import { CICD, Type3, Type3a, Type3b, Type3Zod } from "./lib/types";
import { CiCdTableType, Table3Type } from "./lib/tables";
import { TSDdbSet } from "../src/type-helpers/sets/utils";

test('scan', () => {

  expectTypeOf<ProjectNonIndexScan<CICD, {}, string>>().toEqualTypeOf<TSDdbSet<CICD>>();
  expectTypeOf<ProjectNonIndexScan<CICD, {}, 'datum, rangeKey'>>().toEqualTypeOf<
    {
      rangeKey: "big-cicd";
      datum: string | undefined;
    } | {
      rangeKey: "small-cicd";
      datum: number;
    } | {
      rangeKey: "mini-cicd";
      datum: number;
    }
  >();

  expectTypeOf<ProjectScan<Type3, Table3Type['indices']['hoo-index'], 'threeID', 'otherID', {}, string>>().toEqualTypeOf<
    Pick<Type3a, "hoo" | "nowItExists" | "threeID" | "otherID"> | Pick<Type3b, "threeID" | "otherID"> | Pick<Type3Zod, "threeID" | "otherID">
  >();
  expectTypeOf<ProjectScan<CICD, CiCdTableType['indices']['datumStr-index'], 'hashKey', 'rangeKey', {}, string>>().toEqualTypeOf<
    {
      hashKey: `${string}-${string}-${string}-${string}`;
      rangeKey: "big-cicd";
    } | {
      hashKey: `${string}-${string}-${string}-${string}`;
      rangeKey: "small-cicd";
      datumStr?: `datum_${string}` | `blah_${number}` | undefined;
    } | {
      hashKey: `${string}-${string}-${string}-${string}`;
      rangeKey: "mini-cicd";
      datumStr: `blah_${number}` | undefined;
    }
  >();

});