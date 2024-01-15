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

  const type3bKeys = [
    {
      threeID: Math.random(),
      otherID: `id_${Math.random()}`
    }
  ] as const satisfies Pick<Type3b, 'threeID' | 'otherID'>[];
  const type3bKeyParams = {
    TableName: Table3.name,
    ConditionExpression: 'attribute_exists(#threeID)',
    ExpressionAttributeNames: {
      '#threeID': 'threeID'
    },
    ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
  } as const;
  const twiRequest = tsDdb
    .createTransactWriteItemsRequest()
    .setReturnConsumedCapacity('TOTAL')
    .setReturnItemCollectionMetrics('SIZE')
    .addPut(
      {
        TableName: CiCdTable.name,
        Item,
        ConditionExpression: 'attribute_not_exists(#hashKey)',
        ExpressionAttributeNames: {
          '#hashKey': 'hashKey'
        },
        ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
      },
      {
        TableName: CiCdTable.name,
        Item: {
          hashKey: randomUUID(),
          rangeKey: 'big-cicd'
        },
        ConditionExpression: 'attribute_not_exists(hashKey)'
      },
      {
        TableName: CiCdTable.name,
        Item: {
          hashKey: randomUUID(),
          rangeKey: 'big-cicd'
        },
        ConditionExpression: 'attribute_exists(hashKey)',
        ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
      }
    )
    .addUpdate(
      {
        TableName: CiCdTable.name,
        Key: {
          hashKey: randomUUID(),
          rangeKey: 'big-cicd'
        },
        UpdateExpression: 'SET #datum = :datum',
        ExpressionAttributeNames: {
          '#datum': 'datum',
        },
        ExpressionAttributeValues: {
          ':datum': randomUUID()
        }
      }
    )
    .addDelete(
      ...type3bKeys.map(Key => ({
        ...type3bKeyParams,
        Key
      }))
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
      CancellationReasons = [],
      error
    } = response;
    console.log(JSON.stringify({ CancellationReasons }, null, 2));
    const sortKeysOfReasonItems = CancellationReasons.map(reason => {
      if (reason?.Code === "ConditionalCheckFailed") {
        const { Item } = reason;
        if (!Item) {
          return undefined;
        } else if ("threeID" in Item) {
          return Item.otherID;
        } else {
          return Item.rangeKey;
        }
      }
      return undefined;
    }).filter(Boolean);
    console.log({ sortKeysOfReasonItems });
    console.log(error);
  }

});
