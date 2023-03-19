import { expectTypeOf } from "expect-type";
import { tsDdbRaw } from "./lib/lib";
import { CiCdTable } from "./lib/tables";
import { CICDBigger, CICDMini, CICDSmaller } from "./lib/types";

test('const generic', async () => {
  const hashKey = `---${Math.random()}` as const;

  const putPromise = tsDdbRaw.put({
    TableName: CiCdTable.name,
    Item: {
      hashKey,
      rangeKey: "mini-cicd",
      finaler: 0,
      datum: 0,
      datumStr: `blah_5`
    },
    ReturnValues: 'ALL_OLD'
  }).promise();
  type awaitedPutPromise = Awaited<typeof putPromise>['Attributes'];
  expectTypeOf<awaitedPutPromise>().toEqualTypeOf<CICDMini | undefined>();
  const { Attributes: putAttrs } = await putPromise;
  expectTypeOf<typeof putAttrs>().toEqualTypeOf<CICDMini | undefined>();

  const queryPromise = tsDdbRaw.query({
    TableName: CiCdTable.name,
    KeyConditionExpression: '#hashKey = :hashKey AND rangeKey = :rangeKey',
    ExpressionAttributeValues: {
      ':hashKey': hashKey,
      ':rangeKey': 'mini-cicd'
    },
    ExpressionAttributeNames: {
      '#hashKey': 'hashKey',
      '#datum': 'datum'
    },
    ProjectionExpression: '#datum'
  }).promise();
  type awaitedQueryPromise = Awaited<typeof queryPromise>['Items'];
  expectTypeOf<awaitedQueryPromise>().toEqualTypeOf<Pick<CICDMini, 'datum'>[] | undefined>();
  const { Items: queried = [] } = await queryPromise;
  expectTypeOf<typeof queried>().toEqualTypeOf<Pick<CICDMini, 'datum'>[]>();

  const getPromise = tsDdbRaw.get({
    TableName: CiCdTable.name,
    Key: {
      hashKey: '---',
      rangeKey: "mini-cicd"
    },
    ProjectionExpression: '#datum',
    ExpressionAttributeNames: {
      '#datum': 'datum'
    }
  }).promise();
  type awaitedGetPromise = Awaited<typeof getPromise>['Item'];
  expectTypeOf<awaitedGetPromise>().toEqualTypeOf<Pick<CICDMini, 'datum'> | undefined>();
  const { Item: item } = await getPromise;
  expectTypeOf<typeof item>().toEqualTypeOf<Pick<CICDMini, 'datum'> | undefined>();

  const updatePromise = tsDdbRaw.update({
    TableName: CiCdTable.name,
    Key: {
      hashKey,
      rangeKey: 'mini-cicd'
    },
    UpdateExpression: 'SET #datumStr = :datumStr',
    ExpressionAttributeNames: {
      '#datumStr': 'datumStr'
    },
    ExpressionAttributeValues: {
      ':datumStr': `blah_${Math.random()}`
    },
    ReturnValues: 'UPDATED_NEW'
  }).promise();
  type awaitedUpdatePromise = Awaited<typeof updatePromise>['Attributes'];
  expectTypeOf<awaitedUpdatePromise>().toEqualTypeOf<{ datumStr: `blah_${number}` } | undefined>();
  const { Attributes: updateAttrs } = await updatePromise;
  expectTypeOf<typeof updateAttrs>().toEqualTypeOf<{ datumStr: `blah_${number}` } | undefined>();

  const scanPromise = tsDdbRaw.scan({
    TableName: CiCdTable.name,
    ProjectionExpression: '#datum',
    ExpressionAttributeNames: {
      '#datum': 'datum'
    }
  }).promise();
  type awaitedScanPromise = Awaited<typeof scanPromise>['Items'];
  expectTypeOf<awaitedScanPromise>().toEqualTypeOf<(Pick<CICDBigger, 'datum'> | Pick<CICDSmaller, 'datum'> | Pick<CICDMini, 'datum'>)[] | undefined>();
  const { Items: scanned = [] } = await scanPromise;
  expectTypeOf<typeof scanned>().toEqualTypeOf<(Pick<CICDBigger, 'datum'> | Pick<CICDSmaller, 'datum'> | Pick<CICDMini, 'datum'>)[]>();

  const deletePromise = tsDdbRaw.delete({
    TableName: CiCdTable.name,
    Key: {
      hashKey,
      rangeKey: 'mini-cicd'
    },
    ReturnValues: 'ALL_OLD'
  }).promise();
  type awaitedDeletePromise = Awaited<typeof deletePromise>['Attributes'];
  expectTypeOf<awaitedDeletePromise>().toEqualTypeOf<CICDMini | undefined>();
  const { Attributes: deleteAttrs } = await deletePromise;
  expectTypeOf<typeof deleteAttrs>().toEqualTypeOf<CICDMini | undefined>();

  const [
    _awaitedPutPromiseAll,
    _awaitedQueryPromiseAll,
    _awaitedGetPromiseAll,
    _awaitedUpdatePromiseAll,
    _awaitedScanPromiseAll,
    _awaitedDeletePromiseAll,
  ] = await Promise.all([
    putPromise,
    queryPromise,
    getPromise,
    updatePromise,
    scanPromise,
    deletePromise
  ]);

});