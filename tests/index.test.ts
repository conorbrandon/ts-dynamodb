import { CiCdTable, CiCdTableType, MyTable, Table3 } from "./lib/tables";
import { CICDSmaller, otherZodID, Type3Zod, A, B } from "./lib/types";
import { myInspect, tsDdb, tsDdbRaw } from "./lib/lib";
import { TypesafeDocumentClientv2 } from "../src/lib";
import { z } from "zod";
import { expectTypeOf } from 'expect-type';

jest.setTimeout(100_000);

const otherID = otherZodID.parse('otherID');

describe('createStrict*', () => {

  const Item = {
    threeID: 0,
    otherID,
    zod: {
      thing: 'random',
      more: {
        more: 'mas'
      }
    }
  } as const;

  test('putType3Zod', async () => {

    const putType3Zod = tsDdb.createStrictPutItem(Table3.name)<Type3Zod>();
    const putItem = await putType3Zod({
      Item,
      ConditionExpression: 'threeID <> :zero',
      ExpressionAttributeValues: {
        ':zero': 0
      },
      ReturnValues: 'ALL_OLD'
    } as const);
    console.log('puttedZod:', myInspect(putItem.Attributes));

    expect(putItem.Attributes).toStrictEqual(undefined);

  });

  test('getType3Zod', async () => {

    const getType3Zod = tsDdb.createStrictGetItem(Table3.name)<Type3Zod>();
    const gotItem = await getType3Zod({
      Key: {
        threeID: 0,
        otherID
      },
      ProjectionExpression: '#threeID, zod',
      ExpressionAttributeNames: {
        '#threeID': 'threeID'
      }
    } as const);
    console.log('gotZod:', myInspect(gotItem.Item));

    expect(gotItem.Item).toStrictEqual({ threeID: Item.threeID, zod: Item.zod });

  });

  const updateObj = { thing: 'stringz', more: { more: 'zodIsGoodZodIsGreat' } } as const satisfies Pick<Type3Zod, 'zod'>['zod'];

  test('updateType3Zod', async () => {

    const updateType3Zod = tsDdb.createStrictUpdateItem(Table3.name)<Type3Zod>();
    const updatedItem = await updateType3Zod({
      Key: {
        threeID: 0,
        otherID
      },
      UpdateExpression: 'SET zod = :zod',
      ExpressionAttributeValues: {
        ':zod': updateObj,
      },
      ReturnValues: 'UPDATED_NEW'
    } as const);
    console.log('updatedZod:', myInspect(updatedItem.Attributes));

    expect(updatedItem.Attributes).toStrictEqual({ zod: updateObj });

  });

  test('deleteType3Zod', async () => {

    const deleteType3Zod = tsDdb.createStrictDeleteItem(Table3.name)<Type3Zod>();
    const deletedItem = await deleteType3Zod({
      Key: {
        threeID: 0,
        otherID
      },
      ConditionExpression: 'threeID = :zero',
      ExpressionAttributeValues: {
        ':zero': 0
      },
      ReturnValues: 'ALL_OLD'
    } as const);
    console.log('deletedZod:', myInspect(deletedItem.Attributes));

    expect(deletedItem.Attributes).toStrictEqual({ ...Item, zod: updateObj });

  });

  describe('createStrict* with item/attributesOnly', () => {

    test('putType3Zod attributesOnly', async () => {

      const putType3Zod = tsDdb.createStrictPutItem(Table3.name, true)<Type3Zod>();
      const putItem = await putType3Zod({
        Item,
        ConditionExpression: 'threeID <> :zero',
        ExpressionAttributeValues: {
          ':zero': 0
        },
        ReturnValues: 'ALL_OLD'
      } as const);
      console.log('puttedZod:', myInspect(putItem));

      expect(putItem).toStrictEqual(undefined);

    });

    test('getType3Zod itemOnly', async () => {

      const getType3Zod = tsDdb.createStrictGetItem(Table3.name, true)<Type3Zod>();
      const gotItem = await getType3Zod({
        Key: {
          threeID: 0,
          otherID
        },
        ProjectionExpression: '#threeID, zod',
        ExpressionAttributeNames: {
          '#threeID': 'threeID'
        }
      } as const);
      console.log('gotZod:', myInspect(gotItem));

      expect(gotItem).toStrictEqual({ threeID: Item.threeID, zod: Item.zod });

    });

    test('updateType3Zod attributesOnly', async () => {

      const updateType3Zod = tsDdb.createStrictUpdateItem(Table3.name, true)<Type3Zod>();
      const updatedItem = await updateType3Zod({
        Key: {
          threeID: 0,
          otherID
        },
        UpdateExpression: 'SET zod = :zod',
        ExpressionAttributeValues: {
          ':zod': updateObj,
        },
        ReturnValues: 'UPDATED_NEW'
      } as const);
      console.log('updatedZod:', myInspect(updatedItem));

      expect(updatedItem).toStrictEqual({ zod: updateObj });

    });

    test('deleteType3Zod attributesOnly', async () => {

      const deleteType3Zod = tsDdb.createStrictDeleteItem(Table3.name, true)<Type3Zod>();
      const deletedItem = await deleteType3Zod({
        Key: {
          threeID: 0,
          otherID
        },
        ConditionExpression: 'threeID = :zero',
        ExpressionAttributeValues: {
          ':zero': 0
        },
        ReturnValues: 'ALL_OLD'
      } as const);
      console.log('deletedZod:', myInspect(deletedItem));

      expect(deletedItem).toStrictEqual({ ...Item, zod: updateObj });

    });
  });

  describe('createStrict* with Key only as a parameter and item/attributesOnly', () => {

    test('putType3Zod attributesOnly', async () => {

      const putType3Zod = tsDdb.createStrictPutItem(Table3.name, true)<Type3Zod>();
      const putItem = await putType3Zod({
        Item,
        ConditionExpression: 'threeID <> :zero',
        ExpressionAttributeValues: {
          ':zero': 0
        },
        ReturnValues: 'ALL_OLD'
      } as const);
      console.log('puttedZod:', myInspect(putItem));

      expect(putItem).toStrictEqual(undefined);

    });

    test('getType3Zod itemOnly', async () => {

      const getType3Zod = tsDdb.createStrictGetItem(Table3.name, true)<Type3Zod>();
      const gotItem = await getType3Zod({
        threeID: 0,
        otherID
      });
      console.log('gotZod:', myInspect(gotItem));

      expect(gotItem).toStrictEqual(Item);
      expectTypeOf<typeof gotItem>().toEqualTypeOf<Type3Zod | undefined>();

    });

    test('updateType3Zod attributesOnly', async () => {

      const updateType3Zod = tsDdb.createStrictUpdateItem(Table3.name, true)<Type3Zod>();
      const updatedItem = await updateType3Zod({
        Key: {
          threeID: 0,
          otherID
        },
        UpdateExpression: 'SET zod = :zod',
        ExpressionAttributeValues: {
          ':zod': updateObj,
        },
        ReturnValues: 'UPDATED_NEW'
      } as const);
      console.log('updatedZod:', myInspect(updatedItem));

      expect(updatedItem).toStrictEqual({ zod: updateObj });

    });

    test('deleteType3Zod attributesOnly', async () => {

      const deleteType3Zod = tsDdb.createStrictDeleteItem(Table3.name, true)<Type3Zod>();
      const deletedItem = await deleteType3Zod({
        threeID: 0,
        otherID
      });
      console.log('deletedZod:', myInspect(deletedItem));

      expect(deletedItem).toStrictEqual(undefined);

    });
  });

  test('updateSimpleSETCICDSmaller', async () => {

    const Key = {
      hashKey: '---',
      rangeKey: 'small-cicd'
    } as const;

    const putItem: CICDSmaller = {
      ...Key,
      datum: 100,
      prop: [
        {
          weird: {
            wack: null,
            peculiar: ['🤓', null]
          }
        },
        'funky',
        null
      ],
      final: 'const',
      nest: [null, [true, false]],
      pure: [],
      rest: [false],
      myNumberSet: tsDdb.createNumberSet([80, 81, 82])
    };

    await tsDdb.createStrictPutItem(CiCdTable.name)<CICDSmaller>()({
      Item: putItem
    });

    type t = TypesafeDocumentClientv2.StrictSimpleUpdateSETItem<CiCdTableType, CICDSmaller>
    const simpleUpdateItem: t = {
      datum: 0,
      datumStr: 'datum_blah',
      final: null,
      thebig: {
        hashKey: "---",
        rangeKey: 'big-cicd',
        data: {
          myRestArray: [5, "1", { moo: 'moo', boo: 44 }],
          relatedItems: [{ hi: '', bye: 0 }, 99],
          myTuple: [{ tup1: null }, { tup2: 'string', myBinarySet: tsDdb.createBinarySet([Buffer.from("ABC")]) },],
          bar: 'bar',
          foo: 0,
          price: undefined,
          quantity: 78,
          myStringSet: tsDdb.createStringSet(["hi", "hello"]),
        }
      }
    };
    const updateSimpleSETCICDSmaller = tsDdb.createStrictUpdateSimpleSET(CiCdTable.name)<CICDSmaller>();
    const { Attributes: simpleUpdated } = await updateSimpleSETCICDSmaller({
      Key,
      Item: simpleUpdateItem,
      ReturnValues: 'UPDATED_NEW',
      extraConditions: {
        ANDSuffix: '#final=:const',
        extraExpressionAttributeNames: {
          '#final': 'final'
        },
        extraExpressionAttributeValues: {
          ':const': 'const'
        }
      },
      _logParams: {
        log: true,
        message: 'hi mom!'
      }
    } as const);
    console.log('simpleUpdated:', myInspect(simpleUpdated));

    expect(simpleUpdated?.thebig?.data?.myStringSet.type).toStrictEqual('String');
    expect(simpleUpdated?.thebig?.data?.myStringSet.wrapperName).toStrictEqual('Set');
    expect(simpleUpdated?.thebig?.data?.myStringSet.values).toStrictEqual(["hello", "hi"]);
    const expectation: Record<string, any> = { ...simpleUpdateItem };
    const actual: Record<string, any> = { ...simpleUpdated };
    delete actual['thebig'].data.myStringSet;
    delete expectation['thebig'].data.price;
    delete expectation['thebig'].data.myStringSet;
    expect(actual).toStrictEqual(expectation);

    await tsDdb.delete({
      TableName: CiCdTable.name,
      Key: {
        hashKey: '---',
        rangeKey: 'small-cicd'
      }
    });

  });

});

describe('CICDSmaller CRUD', () => {

  const Item: CICDSmaller = {
    hashKey: '---',
    rangeKey: 'small-cicd',
    datum: 5,
    map: { hi: { exists: 0 }, howdy: { hola: 7 } },
    prop: [
      {
        weird: {
          wack: { even: 'string', odd: 0 },
          peculiar: ["💯", null]
        },
        strange: ["this is the end!"]
      },
      "funky",
      "last"
    ],
    final: 'const',
    nest: [null, [true, false]],
    pure: [[0], [1], [2]],
    rest: [true, [{ x: 0, y: false }], [{ x: 1, y: true }]],
    finaler: 1_000,
    thebig: {
      hashKey: "---",
      rangeKey: 'big-cicd',
      data: {
        myRestArray: [5, "1", { moo: 'moo', boo: 44 }],
        relatedItems: [{ hi: 'hello', bye: 0 }, 99],
        myTuple: [{ tup1: null }, { tup2: 'string', myBinarySet: tsDdb.createBinarySet([Buffer.from("ABC")]) },],
        bar: 'bar',
        foo: 0,
        price: undefined,
        quantity: 78,
        myStringSet: tsDdb.createStringSet(["hi", "hello"])
      }
    },
    myNumberSet: tsDdb.createNumberSet([1]),
  };

  test('put CICDSmaller', async () => {
    const { Attributes: putted } = await tsDdb.put({
      TableName: CiCdTable.name,
      Item,
      ConditionExpression: `
    #hashKey <> :sparseUuid 
    AND (
      NOT #rangeKey IN (:smallCiCd, :smallerCiCd) 
      OR #datum BETWEEN :d1 AND :d2 
      OR attribute_exists(#prop[0].#weird)
      OR #hashKey <= :a
    )`,
      ExpressionAttributeNames: {
        '#hashKey': 'hashKey',
        '#rangeKey': 'rangeKey',
        '#datum': 'datum',
        '#prop': 'prop',
        '#weird': 'weird'
      },
      ExpressionAttributeValues: {
        ':sparseUuid': '---',
        ':d1': 4,
        ':d2': 6,
        ':smallCiCd': 'small-cicd',
        ':smallerCiCd': 'smaller-cicd',
        ':a': 'a'
      },
      ReturnValues: 'ALL_OLD'
    } as const);
    if (putted) {
      console.log('putted:', myInspect(putted));
    }
    expect(putted).toStrictEqual(undefined);

  });

  test('get CICDSmaller with PE', async () => {

    const { Item: got, ConsumedCapacity } = await tsDdb.get({
      TableName: CiCdTable.name,
      Key: {
        hashKey: '---',
        rangeKey: 'small-cicd'
      },
      ExpressionAttributeNames: {
        '#rangeKey': 'rangeKey',
        '#prop': 'prop',
        '#data': 'data',
        '#weird': 'weird',
        '#final': 'final',
        '#map': 'map',
        '#exists': 'exists',
        '#datumStr': 'datumStr',
        '#myNumberSet': 'myNumberSet'
      },
      ProjectionExpression: `
thebig.#data.myRestArray[2].moo,
rest[2][0].x,
thebig.hashKey,
#prop[0].#weird.peculiar[1],
thebig.#data.finale,
finaler,
hashKey,
nest[1][1],
#prop[0].strange,
pure[0][0],
#final,
thebig.#data.relatedItems[0].bye,
#prop[0].#weird.wack.even,
thebig.#data.relatedItems[100],
datum,
rest[0],
#prop[2],
nest[1][0],
#map.howdy.hola,
thebig.#data.price,
thebig.#rangeKey,
#rangeKey,
doh,
thebig.#data.relatedItems[1].hi,
thebig.#data.foo,
#map.hi.#exists,
thebig.#data.bar,
thebig.#data.quantity,
thebig.#data.baz,
#prop[0].#weird.peculiar[0],
thebig.#data.myRestArray[1].boo,
thebig.#data.product,
thebig.#data.myRestArray[0],
#map.hi.hello,
#prop[1],
thebig.#data.myTuple[1].tup2,
thebig.#data.#final,
thebig.#data.myTuple[0],
#datumStr,
#myNumberSet,
thebig.#data.myStringSet,
thebig.#data.myTuple[1].myBinarySet,
myWackySet.nonsense`
    } as const);
    if (got) {
      console.log({ ConsumedCapacity });
      console.log('got:', myInspect(got));
    }

  });

  test('get CICDSmaller', async () => {

    const got2 = await tsDdb.get({
      TableName: CiCdTable.name,
      Key: {
        hashKey: '---',
        rangeKey: 'small-cicd'
      }
    });
    if (got2.Item) {
      console.log('got without PE:', myInspect(got2.Item));
    }

  });

  test('update CICDSmaller', async () => {

    const { Attributes: updated } = await tsDdb.update({
      TableName: CiCdTable.name,
      Key: {
        hashKey: '---',
        rangeKey: 'small-cicd'
      },
      UpdateExpression: `
  set
#datum=if_not_exists(#datum,:zero)+:datum,
#map.howdy.hola=:hola,
#final=:final,
prop[1]=:funky,
prop[0].weird.peculiar[1]=:peculiar,
prop[0].weird.wack.even=:even,
thebig.rangeKey=:bigrKey,
thebig.#d.quantity=thebig.#d.quantity+:quantity,
thebig.#d.myTuple[1].tup3=:tup3,
thebig.#d.myRestArray[2].boo=thebig.#d.myRestArray[2].boo+:boo,
#rest=list_append(#rest,:rest),
nest[1][0]=if_not_exists(nest[1][0],:nest),
thebig.#d.foo=if_not_exists(#map.hi.hello,:doobedoo),
pure=list_append(if_not_exists(pure,:emptyList),if_not_exists(pure,:pure)),
thebig.#d.#set=:set,
#datumStr=:datumStr

  add
#map.#hi.#exists :doobedoo,
thebig.#d.myRestArray[0] :doobedoo,
myNumberSet :numberSet,
thebig.#d.myTuple[1].myBinarySet :binarySet

  remove
thebig.#d.#rI[0],
thebig.#d.#rI[1],
thebig.#d.#rI[2],
thebig.#d.#rI[3],
thebig.#d.#rI[4],
prop[0].strange,
thebig.#d.product,
thebig.#d.myRestArray[1],
thebig.#d.#rI[1000]

  delete
thebig.#d.myStringSet :stringSet`,
      ExpressionAttributeNames: {
        '#map': 'map',
        '#exists': 'exists',
        '#datum': 'datum',
        '#final': 'final',
        '#hashKey': 'hashKey',
        '#rangeKey': 'rangeKey',
        '#hi': 'hi',
        '#d': 'data',
        '#rest': 'rest',
        '#set': 'set',
        '#datumStr': 'datumStr',
        '#rI': 'relatedItems'
      },
      ExpressionAttributeValues: {
        ':tup3': 999,
        ':quantity': 22,
        ':doobedoo': 100,
        ':even': 'str',
        ':peculiar': 100_000_000,
        ':final': "const",
        ':hola': 7,
        ':funky': 'funky',
        ':datum': 5,
        ':sparseUuid': '---',
        ':smallCiCd': 'small-cicd',
        ':bigrKey': "big-cicd",
        ':boo': 44,
        ':rest': [[{ x: 99, y: false }]],
        ':nest': true,
        ':pure': [[0, 1, 2, 3]],
        ':set': 'set',
        ':datumStr': `datum_`,
        ':emptyList': [],
        ':zero': 0,
        ':numberSet': tsDdb.createNumberSet([0]),
        ':binarySet': tsDdb.createBinarySet([Buffer.from("A")]),
        ':stringSet': tsDdb.createStringSet(["a"])
      },
      ConditionExpression: `
        #hashKey=:sparseUuid 
        AND                   
        #rangeKey=:smallCiCd`,
      ReturnValues: 'UPDATED_NEW'
    } as const);
    if (updated) {
      console.log("updated:", myInspect(updated));
    }

  });

  test('delete CICDSmaller', async () => {

    const { Attributes: deleted } = await tsDdb.delete({
      TableName: CiCdTable.name,
      Key: {
        hashKey: '---',
        rangeKey: 'small-cicd'
      },
      ConditionExpression: `#datum = :datum`,
      ExpressionAttributeNames: {
        '#datum': 'datum'
      },
      ExpressionAttributeValues: {
        ':datum': 10
      },
      ReturnValues: 'ALL_OLD'
    } as const);
    if (deleted) {
      console.log('deleted:', myInspect(deleted));
    }

  });

});

describe('query', () => {

  test('datumQueried', async () => {
    const datumQueried = await tsDdb.query({
      TableName: CiCdTable.name,
      IndexName: CiCdTable.indices["datum-index"].name,
      KeyConditionExpression: `#datum = :datum and begins_with(datumStr, :datumStr)`,
      ExpressionAttributeNames: {
        '#datum': 'datum',
        '#hashKey': 'hashKey',
        '#data': 'data'
      },
      ExpressionAttributeValues: {
        ':datum': 0,
        ':datumStr': 'datum_',
        ':hashKey': '---'
      },
      ProjectionExpression: 'thebig.#data.myTuple[1], datum, rangeKey, #hashKey, datumStr',
      FilterExpression: '#hashKey = :hashKey'
    } as const);
    console.log('datumQueried:', myInspect(datumQueried.Items));
  });

  test('datumStrQueried', async () => {

    const datumStrQueried = await tsDdb.query({
      TableName: CiCdTable.name,
      IndexName: CiCdTable.indices["datumStr-index"].name,
      KeyConditionExpression: `datumStr = :datumStr`,
      ExpressionAttributeValues: {
        ':datumStr': 'datum_12345'
      },
      // ProjectionExpression: 'datumStr, hashKey, datum' // excluding the rangeKey
    } as const);
    console.log('datumStrQueried:', myInspect(datumStrQueried.Items));

  });

  test('datumAllQueried', async () => {

    const datumAllQueried = await tsDdb.query({
      TableName: CiCdTable.name,
      IndexName: CiCdTable.indices["datum-all-index"].name,
      KeyConditionExpression: `finaler between :f and :g and datum = :datum`,
      ExpressionAttributeValues: {
        ':datum': 99,
        ':f': 0,
        ':g': 1
      },
      // ProjectionExpression: 'rangeKey, finaler'
    } as const);
    console.log('datumAllQueried:', myInspect(datumAllQueried.Items));

  });

  test('baseCiCdTableQueried', async () => {

    const baseTableQueried = await tsDdb.query({
      TableName: CiCdTable.name,
      KeyConditionExpression: `hashKey = :hashKey and rangeKey = :rangeKey`,
      ExpressionAttributeValues: {
        ':hashKey': '---',
        ':rangeKey': 'small-cicd'
      },
      // ProjectionExpression: 'datum, prop[1], prop[0].weird.peculiar[1], prop[0].strange'
    } as const);
    console.log('baseTableQueried:', myInspect(baseTableQueried.Items));

  });


  test('table3HooQueried', async () => {

    const hoo: `999${number}` = '9999';
    const table3HooQueried = await tsDdb.query({
      TableName: Table3.name,
      IndexName: Table3.indices["hoo-index"].name,
      KeyConditionExpression: 'threeID = :threeID and begins_with(hoo, :begins)',
      ExpressionAttributeValues: {
        ':threeID': 0,
        ':begins': hoo
      },
      // ProjectionExpression: 'nowItExists[0]'
    } as const);
    console.log('table3HooQueried:', myInspect(table3HooQueried.Items));

  });

  test('table3WooQueried', async () => {

    const table3WooQueried = await tsDdb.query({
      TableName: Table3.name,
      IndexName: Table3.indices["woo-index"].name,
      KeyConditionExpression: 'threeID = :threeID and begins_with(woo, :begins)',
      ExpressionAttributeValues: {
        ':threeID': 0,
        ':begins': '999'
      },
      ExpressionAttributeNames: {
        '#n': 'nowItExists'
      },
      ProjectionExpression: '#n[0]'
    } as const);
    console.log('table3WooQueried:', myInspect(table3WooQueried.Items));

  });


  test('table3BaseQueried', async () => {

    const table3BaseQueried = await tsDdb.query({
      TableName: Table3.name,
      KeyConditionExpression: 'threeID = :threeID and begins_with(otherID, :begins)',
      ExpressionAttributeValues: {
        ':threeID': 0,
        ':begins': 'other_'
      },
      // ProjectionExpression: 'nowItExists[0]'
    } as const);
    console.log('table3BaseQueried:', myInspect(table3BaseQueried.Items));

  });

  test('table3BaseQueried2', async () => {

    const table3BaseQueried2 = await tsDdb.query({
      TableName: Table3.name,
      KeyConditionExpression: 'threeID = :threeID and otherID <= :other',
      ExpressionAttributeValues: {
        ':threeID': 0,
        ':other': 'id_0'
      }
    } as const);
    console.log('table3BaseQueried2:', myInspect(table3BaseQueried2.Items));

  });

});

test('scan', async () => {

  const { Items: scannedItems } = await tsDdb.scan({
    TableName: CiCdTable.name,
    ProjectionExpression: 'hashKey, rangeKey, finaler',
    IndexName: CiCdTable.indices['datum-all-index'].name
  });
  console.log('scannedItems:', myInspect(scannedItems));

  const { Items: scannedItemst } = await tsDdb.scan({
    TableName: CiCdTable.name,
    IndexName: CiCdTable.indices['datum-all-index'].name
  });
  const t = scannedItemst?.[0];
  if (t && 'thebig' in t && t.thebig?.data) {
    t.thebig.data.myStringSet;
  }

  const { Items: scannedItems2 } = await tsDdb.scan({
    TableName: MyTable.name
  });
  console.log('scannedItems2:', myInspect(scannedItems2));

});

describe('queryAll and scanAll', () => {

  test('queryAll', async () => {
    const items = await tsDdb.queryAll({
      TableName: CiCdTable.name,
      KeyConditionExpression: 'hashKey=:hashKey',
      ExpressionAttributeValues: {
        ':hashKey': '---'
      }
    } as const);
    console.log('lets make sure items is actually an array', items.pop());
  });

  test('scanAll', async () => {
    const items = await tsDdb.scanAll({
      TableName: Table3.name,
      IndexName: Table3.indices["woo-index"].name
    });
    console.log(items.forEach(console.log));
  });

});

test('zod CRUD', async () => {

  const itemZod: Type3Zod = {
    threeID: 0,
    otherID,
    zod: {
      thing: 'random',
      more: {
        more: 'mas'
      }
    }
  };
  const zodPut = await tsDdb.put({
    TableName: Table3.name,
    Item: itemZod,
    ConditionExpression: 'threeID <> :zero',
    ExpressionAttributeValues: {
      ':zero': 0
    },
    ReturnValues: 'ALL_OLD'
  } as const);
  console.log('zodPut:', myInspect(zodPut.Attributes));

  const zodGot = await (async (threeID: number, otherID: z.infer<typeof otherZodID>) => await tsDdb.get({
    TableName: Table3.name,
    Key: {
      threeID,
      otherID
    },
    ProjectionExpression: '#threeID',
    ExpressionAttributeNames: {
      '#threeID': 'threeID'
    }
  } as const))(0, otherID);
  console.log('zodGot:', myInspect(zodGot.Item));

  const updateObj = { thing: 'stringz', more: { more: 'zodIsGoodZodIsGreat' } } as const;
  const zodUpdated = await tsDdb.update({
    TableName: Table3.name,
    Key: {
      threeID: 0,
      otherID
    },
    UpdateExpression: 'SET zod = :zod',
    ExpressionAttributeValues: {
      ':zod': updateObj,
    },
    ReturnValues: 'UPDATED_NEW'
  } as const);
  console.log('zodUpdated:', zodUpdated.Attributes);

  const zodDeleted = await tsDdb.delete({
    TableName: Table3.name,
    Key: {
      threeID: 0,
      otherID
    },
    ReturnValues: 'ALL_OLD'
  });
  console.log('zodDeleted:', myInspect(zodDeleted.Attributes));

});

test('Awaited and Promise.all', async () => {
  const putPromise = tsDdbRaw.put({
    TableName: Table3.name,
    Item: {
      threeID: 0,
      otherID,
      zod: {
        thing: 'random',
        more: {
          more: 'mas'
        }
      }
    },
    ConditionExpression: 'threeID <> :zero',
    ExpressionAttributeValues: {
      ':zero': 0
    },
    ReturnValues: 'ALL_OLD'
  } as const).promise();
  type Put = Awaited<typeof putPromise>['Attributes'];
  expectTypeOf<Put>().toEqualTypeOf<Type3Zod | undefined>();

  await putPromise;

  const getPromise = ((threeID: number, otherID: z.infer<typeof otherZodID>) => tsDdbRaw.get({
    TableName: Table3.name,
    Key: {
      threeID,
      otherID
    },
    ProjectionExpression: '#threeID, otherID, zod.more.more',
    ExpressionAttributeNames: {
      '#threeID': 'threeID'
    }
  } as const).promise())(0, otherID);
  type Get = Awaited<typeof getPromise>['Item'];
  expectTypeOf<Get>().toEqualTypeOf<{
    zod: {
      more: {
        more: "mas" | "zodIsGoodZodIsGreat";
      };
    };
    threeID: number;
    otherID: string & z.BRAND<"otherID">;
  } | undefined>();


  const updatePromise = tsDdbRaw.update({
    TableName: Table3.name,
    Key: {
      threeID: 0,
      otherID
    },
    UpdateExpression: 'SET zod.thing = :thing',
    ExpressionAttributeValues: {
      ':thing': 'stringz',
    },
    ReturnValues: 'UPDATED_NEW'
  } as const).promise();
  type Update = Awaited<typeof updatePromise>['Attributes'];
  expectTypeOf<Update>().toEqualTypeOf<{
    zod: {
      thing: "random" | "stringz";
    };
  } | undefined>();


  const deletePromise = tsDdbRaw.delete({
    TableName: Table3.name,
    Key: {
      threeID: 0,
      otherID
    },
    ReturnValues: 'ALL_OLD'
  }).promise();
  type Delete = Awaited<typeof deletePromise>['Attributes'];
  expectTypeOf<Delete>().toEqualTypeOf<Type3Zod | undefined>();


  const queryPromise = tsDdbRaw.query({
    TableName: MyTable.name,
    KeyConditionExpression: 'p0 = :p0',
    ExpressionAttributeValues: {
      ':p0': '---',
    }
  } as const).promise();
  type Query = Awaited<typeof queryPromise>['Items'];
  expectTypeOf<Query>().toEqualTypeOf<(A | B)[] | undefined>();


  const scanPromise = tsDdbRaw.scan({
    TableName: CiCdTable.name,
    IndexName: CiCdTable.indices["datumStr-index"].name
  }).promise();
  type Scan = Awaited<typeof scanPromise>['Items'];
  expectTypeOf<Scan>().toEqualTypeOf<({
    hashKey: `${string}-${string}-${string}-${string}`;
    rangeKey: "small-cicd";
    datumStr?: `datum_${string}` | `blah_${number}` | undefined;
  } | {
    hashKey: `${string}-${string}-${string}-${string}`;
    rangeKey: "big-cicd";
  } | {
    hashKey: `${string}-${string}-${string}-${string}`;
    rangeKey: "mini-cicd";
    datumStr: `blah_${number}` | undefined;
  })[] | undefined>();


  const [
    // purPromise is awaited above, must be done first,
    { Item: _got },
    { Attributes: _updated },
    { Attributes: _deleted },
    { Items: _queried },
    { Items: _scanned }
  ] = await Promise.all([
    //
    getPromise,
    updatePromise,
    deletePromise,
    queryPromise,
    scanPromise
  ]);
});