import { randomUUID } from "crypto";
import { tsDdb } from "./lib/lib";
import { CiCdTable, Table3 } from "./lib/tables";
import { Type3b } from "./lib/types";

jest.setTimeout(100_000);

test('createTransactWriteItemsRequest', async () => {

  const Item = {
    hashKey: randomUUID(),
    rangeKey: 'big-cicd'
  } as const;
  await tsDdb.put({ TableName: CiCdTable.name, Item });

  let twiRequest = tsDdb
    .createTransactWriteItemsRequest()
    .addPut({
      TableName: CiCdTable.name,
      Item,
      ConditionExpression: 'attribute_not_exists(hashKey)',
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
    })
    .addPut({
      TableName: CiCdTable.name,
      Item: {
        hashKey: randomUUID(),
        rangeKey: 'big-cicd'
      },
      ConditionExpression: 'attribute_not_exists(hashKey)'
    })
    .addPut({
      TableName: CiCdTable.name,
      Item: {
        hashKey: randomUUID(),
        rangeKey: 'big-cicd'
      },
      ConditionExpression: 'attribute_exists(hashKey)',
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
    })
    .setReturnItemCollectionMetrics('SIZE')
    .setReturnConsumedCapacity('TOTAL');
  const twiRequest2 = ([] as Pick<Type3b, 'threeID' | 'otherID'>[]).map(Key => twiRequest.addDelete({
    TableName: Table3.name,
    Key,
    ConditionExpression: 'attribute_exists(threeID)',
    ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
  }))[0] ?? twiRequest;
  const response = await twiRequest2.execute();
  if (response.success) {
    const {
      ItemCollectionMetrics,
      ConsumedCapacity
    } = response.response;
    console.log({
      ItemCollectionMetrics,
      ConsumedCapacity
    });
  } else {
    const {
      CancellationReasons,
      error
    } = response;
    console.log(CancellationReasons);
    console.log(error);
  }

});
