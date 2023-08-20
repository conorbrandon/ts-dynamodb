import { expectTypeOf } from "expect-type";
import { z } from "zod";
import { CleanKCE, CommonExtractTypeForKCEKey, ExtractKeyFromKCE, NarrowExtractedTypesKeyFieldsToWidenedKeyValues, ProjectNonIndexQuery, ProjectQuery, WidenKeyToTypesItExtracted } from "../src/type-helpers/query/common";
import { TSDdbSet } from "../src/type-helpers/sets/utils";
import { DeepSimplifyObject } from "../src/type-helpers/utils";
import { CiCdTable, Table3 } from "./lib/tables";
import { CICD, CICDMini, CICDSmaller, Type3, Type3a, Type3b, Type3Zod } from "./lib/types";


test('CleanKCE', () => {

  expectTypeOf<CleanKCE<'threeID = :threeID and begins_with(hoo, :begins)'>>().toEqualTypeOf<"threeID =  :threeID AND begins_with(hoo,  :begins)">();
  expectTypeOf<CleanKCE<'threeID =:threeID and#hoo between:eek and :meek'>>().toEqualTypeOf<"threeID = :threeID AND #hoo BETWEEN :eek AND  :meek">();

});

test('ExtractKeyFromKCE', () => {

  expectTypeOf<ExtractKeyFromKCE<
    'threeID =:threeID and#hoo between:eek and :meek',
    {
      '#hoo': 'hoo'
    },
    {
      ':threeID': 3,
      ':eek': string,
      ':meek': string
    },
    'threeID'
  >>()
    .toEqualTypeOf<{
      threeID: 3;
      hoo: { begins_with_extractor: "between_hijack"; eav1: string; eav2: string };
    }>();

  expectTypeOf<ExtractKeyFromKCE<
    'threeID =:threeID and#hoo between:eek and:meek',
    {
      '#hoo': 'hoo'
    },
    {
      ':threeID': 3,
      ':eek': `id_0`,
      ':meek': `id_1`
    },
    'threeID'
  >>()
    .toEqualTypeOf<{
      threeID: 3;
      hoo: { begins_with_extractor: "between_hijack"; eav1: `id_0`; eav2: `id_1` };
    }>();

  expectTypeOf<ExtractKeyFromKCE<
    'threeID =:threeID and begins_with(#hoo,:eek)',
    {
      '#hoo': 'hoo'
    },
    {
      ':threeID': 3,
      ':eek': `eek`
    },
    'threeID'
  >>()
    .toEqualTypeOf<{
      threeID: 3;
      hoo: {
        begins_with_extractor: "eek";
      }
    }>();

  expectTypeOf<ExtractKeyFromKCE<
    'threeID =:threeID and#hoo <= :eek',
    {
      '#hoo': 'hoo'
    },
    {
      ':threeID': 3,
      ':eek': `eek`
    },
    'threeID'
  >>()
    .toEqualTypeOf<{
      threeID: 3;
      hoo: { begins_with_extractor: `eek` }
    }>();

  expectTypeOf<ExtractKeyFromKCE<
    'threeID =:threeID and#hoo < :eek',
    {
      '#hoo': 'hoo'
    },
    {
      ':threeID': 3,
      ':eek': Buffer
    },
    'threeID'
  >>()
    .toEqualTypeOf<{
      threeID: 3;
      hoo: Buffer
    }>();

  expectTypeOf<ExtractKeyFromKCE<
    'zodID =:zodID',
    {},
    {
      ':zodID': string & z.BRAND<'ID'>
    },
    'zodID'
  >>()
    .toEqualTypeOf<{
      zodID: string & z.BRAND<'ID'>;
    }>();

});

test('CommonExtractTypeForKCEKey', () => {

  expectTypeOf<CommonExtractTypeForKCEKey<
    Type3,
    {
      threeID: 0;
    }
  >>().toEqualTypeOf<Type3>();

  expectTypeOf<CommonExtractTypeForKCEKey<
    Type3,
    {
      otherID: 0;
    }
  >>().toBeNever();

  expectTypeOf<CommonExtractTypeForKCEKey<
    Type3,
    {
      otherID: `id_${number}`;
    }
  >>().toEqualTypeOf<Type3b>();

  expectTypeOf<CommonExtractTypeForKCEKey<
    Type3,
    {
      otherID: `id_${number}`;
      woo: '';
    }
  >>().toBeNever();

  expectTypeOf<CommonExtractTypeForKCEKey<
    Type3,
    {
      otherID: {
        begins_with_extractor: `id_`;
      };
    }
  >>().toEqualTypeOf<Type3b>();

  expectTypeOf<CommonExtractTypeForKCEKey<
    Type3,
    {
      otherID: string & z.BRAND<'otherID'>;
    }
  >>().toEqualTypeOf<Type3Zod>();

});

test('ProjectNonIndex/GSI/LSIQuery', () => {

  type test1 = DeepSimplifyObject<Pick<CICDSmaller, 'hashKey' | 'rangeKey' | 'thebig' | 'datum' | 'datumStr'>> & { datumStr: `datum_${string}` };
  expectTypeOf<ProjectQuery<
    `#datum = :datum and begins_with(datumStr, :datumStr)`,
    {
      '#datum': 'datum'
    },
    {
      ':datum': 0,
      ':datumStr': 'datum_'
    },
    (typeof CiCdTable)['indices']['datum-index'],
    CICD,
    'hashKey',
    'rangeKey',
    string
  >>().toEqualTypeOf<test1>();

  expectTypeOf<ProjectQuery<
    `#datum = :datum and begins_with(datumStr, :datumStr)`,
    {
      '#datum': 'datum'
    },
    {
      ':datum': 0,
      ':datumStr': 'datummmm'
    },
    (typeof CiCdTable)['indices']['datum-index'],
    CICD,
    'hashKey',
    'rangeKey',
    string
  >>().toBeNever();

  expectTypeOf<ProjectQuery<
    `datumStr = :datumStr`,
    {},
    {
      ':datumStr': 'blah_12345'
    },
    (typeof CiCdTable)['indices']['datumStr-index'],
    CICD,
    'hashKey',
    'rangeKey',
    'datumStr, hashKey, datum, rangeKey' // datum is NOT on the index
  >>().toEqualTypeOf<{
    datum: undefined;
    datumStr: `blah_${number}`;
    hashKey: `${string}-${string}-${string}-${string}`;
    rangeKey: "small-cicd";
  } | {
    datum: undefined;
    datumStr: `blah_${number}`;
    hashKey: `${string}-${string}-${string}-${string}`;
    rangeKey: "mini-cicd";
  }>();

  expectTypeOf<ProjectQuery<
    `finaler between :f and :g and datum = :datum`,
    {},
    {
      ':datum': 99,
      ':f': 0,
      ':g': 1
    },
    (typeof CiCdTable)['indices']['datum-all-index'],
    CICD,
    'hashKey',
    'rangeKey',
    string
  >>().toEqualTypeOf<TSDdbSet<(CICDSmaller & { finaler: number })> | CICDMini>(); // real PITA this one lol. finaler will be required in CICDSmaller, and have to add the wrapper names and undefined to sets in CICDSmaller as well

  expectTypeOf<ProjectNonIndexQuery<
    `hashKey = :hashKey and rangeKey = :rangeKey`,
    {},
    {
      ':hashKey': '---',
      ':rangeKey': 'small-cicd'
    },
    'hashKey',
    'rangeKey',
    CICD,
    string
  >>().toEqualTypeOf<TSDdbSet<CICDSmaller>>();

  expectTypeOf<ProjectNonIndexQuery<
    `hashKey = :hashKey`,
    {},
    {
      ':hashKey': '---'
    },
    'hashKey',
    'rangeKey',
    CICD,
    string
  >>().toEqualTypeOf<TSDdbSet<CICD>>();

  expectTypeOf<ProjectQuery<
    'threeID = :threeID and begins_with(hoo, :begins)',
    {
      '#n': 'nowItExists'
    },
    {
      ':threeID': 0,
      ':begins': `999${number}`
    },
    (typeof Table3)['indices']['hoo-index'],
    Type3,
    'threeID',
    'otherID',
    '#n[0]'
  >>().toEqualTypeOf<{
    nowItExists: string[] | undefined;
  }>(); // extra undefined here because the item might not even be returned if nowItExists is undefined

  expectTypeOf<ProjectQuery<
    'threeID = :threeID and begins_with(hoo, :begins)',
    {},
    {
      ':threeID': 0,
      ':begins': `999${number}`
    },
    (typeof Table3)['indices']['hoo-index'],
    Type3,
    'threeID',
    'otherID',
    string
  >>().toEqualTypeOf<{
    threeID: number;
    hoo: `999${number}`;
    nowItExists: string[] | { hi: string };
    otherID: `other_${string}-${string}-${string}-${string}`;
  }>();

  expectTypeOf<ProjectQuery<
    'threeID = :threeID and begins_with(woo, :begins)',
    {},
    {
      ':threeID': 0,
      ':begins': `999${number}`
    },
    (typeof Table3)['indices']['woo-index'],
    Type3,
    'threeID',
    'otherID',
    string
  >>().toEqualTypeOf<{
    threeID: number;
    woo: string;
    otherID: `other_${string}-${string}-${string}-${string}`;
  }>();

  expectTypeOf<ProjectQuery<
    'threeID = :threeID and hoo<=:begins',
    {},
    {
      ':threeID': 0,
      ':begins': `999${number}`
    },
    (typeof Table3)['indices']['hooAll-index'],
    Type3,
    'threeID',
    'otherID',
    string
  >>().toEqualTypeOf<Type3a & { hoo: `999${number}` }>();


  expectTypeOf<ProjectNonIndexQuery<
    'threeID = :threeID and begins_with(otherID, :begins)',
    {},
    {
      ':threeID': 0,
      ':begins': 'other_'
    },
    'threeID',
    'otherID',
    Type3,
    string
  >>().toEqualTypeOf<Type3a>();

  expectTypeOf<ProjectNonIndexQuery<
    'threeID = :threeID and otherID <= :other',
    {},
    {
      ':threeID': 0,
      ':other': 'id_0'
    },
    'threeID',
    'otherID',
    Type3,
    string
  >>().toEqualTypeOf<Type3b>();

  expectTypeOf<ProjectNonIndexQuery<
    'threeID = :threeID',
    {},
    {
      ':threeID': 0
    },
    'threeID',
    'otherID',
    Type3,
    'obj, zod'
  >>().toEqualTypeOf<{
    obj: undefined;
    zod: undefined;
  } | {
    obj: {
      nah: "fam";
      duck: "goose";
      '💀': "RIP";
    };
    zod: undefined;
  } | {
    obj: undefined;
    zod: {
      thing: "random" | "stringz";
      more: {
        more: 'mas' | 'zodIsGoodZodIsGreat'
      };
    };
  }>();

});

test('WidenKeyToTypesItExtracted', () => {

  type Key = ExtractKeyFromKCE<
    '#datum = :datum and begins_with(datumStr, :datumStr)',
    {
      '#datum': 'datum'
    },
    {
      ':datum': 0,
      ':datumStr': 'datum_'
    },
    'datum'
  >;
  expectTypeOf<WidenKeyToTypesItExtracted<Key, CICDSmaller>>().toEqualTypeOf<{
    datum: number;
    datumStr: `datum_${string}`;
  }>();
});

test('NarrowExtractedTypesKeyFieldsToWidenedKeyValues', () => {

  expectTypeOf<NarrowExtractedTypesKeyFieldsToWidenedKeyValues<Pick<CICDMini, 'datumStr' | 'rangeKey'> | Pick<CICDSmaller, 'datumStr' | 'rangeKey'>, { datumStr: `blah_${number}` }>>()
    .toEqualTypeOf<{
      rangeKey: "mini-cicd";
      datumStr: `blah_${number}`;
    } | {
      rangeKey: "small-cicd";
      datumStr: `blah_${number}`;
    }>();

});