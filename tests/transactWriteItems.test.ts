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

  let twiRequest2;
  const type3bKeys: Pick<Type3b, 'threeID' | 'otherID'>[] = [];
  for (const Key of type3bKeys) {
    twiRequest2 = twiRequest.addDelete({
      TableName: Table3.name,
      Key,
      ConditionExpression: 'attribute_exists(threeID)',
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
    });
  }
  twiRequest2 ??= twiRequest;

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

test('variadic', async () => {

  const twiRequest = tsDdb
    .createTransactWriteItemsRequest()
    .setReturnConsumedCapacity('TOTAL')
    .setReturnItemCollectionMetrics('SIZE')
    .addPutVariadic(
      {
        TableName: CiCdTable.name,
        Item: {
          hashKey: randomUUID(),
          rangeKey: 'big-cicd'
        },
        ConditionExpression: 'attribute_not_exists(#hashKey)',
        ExpressionAttributeNames: {
          '#hashKey': 'hashKey'
        },
        ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
      }
    );
  const response = await twiRequest.execute();
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