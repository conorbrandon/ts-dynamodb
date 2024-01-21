import { randomUUID } from "crypto";
import { tsDdb } from "./lib/lib";
import { CiCdTable, Table3 } from "./lib/tables";
import { Type3b } from "./lib/types";
import { expectTypeOf } from "expect-type";
import { AWSError } from "aws-sdk";

jest.setTimeout(100_000);

test('createTransactWriteItemsRequest success', async () => {

  const table3Items = new Array(100).fill(0).map((): Type3b => {
    return {
      threeID: Math.random(),
      otherID: `id_${Math.random()}`,
      obj: {
        nah: 'fam',
        duck: 'goose',
        '💀': 'RIP'
      },
      record: {}
    };
  });
  const request = tsDdb
    .createTransactWriteItemsRequest()
    .setClientRequestToken(randomUUID())
    .setReturnConsumedCapacity('TOTAL')
    .setReturnItemCollectionMetrics('SIZE')
    .push(...table3Items.map(Item => {
      return {
        Put: {
          TableName: Table3.name,
          Item
        }
      };
    }));
  try {
    const response = await request.execute();
    const { ConsumedCapacity, ItemCollectionMetrics } = response;
    console.log({
      ConsumedCapacity,
      ItemCollectionMetrics
    });
  } catch (error) {
    if (!request.isParsedErrorFromThisRequest(error)) {
      // eslint-disable-next-line no-undef
      fail();
    }
    const { CancellationReasons } = error;
    type CRItem = NonNullable<typeof CancellationReasons>[number]['Item'];
    expectTypeOf<CRItem>().toBeUndefined();
    // eslint-disable-next-line no-undef
    fail();
  }

});

test('createTransactWriteItemsRequest failure', async () => {

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
    ConditionExpression: 'attribute_not_exists(#threeID)',
    ExpressionAttributeNames: {
      '#threeID': 'threeID'
    },
    ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
  } as const;
  const request = tsDdb
    .createTransactWriteItemsRequest()
    .setReturnConsumedCapacity('TOTAL')
    .setReturnItemCollectionMetrics('SIZE')
    .push(
      {
        Put: {
          TableName: CiCdTable.name,
          Item,
          ConditionExpression: 'attribute_not_exists(#hashKey)',
          ExpressionAttributeNames: {
            '#hashKey': 'hashKey'
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
        }
      },
      {
        Put: {
          TableName: CiCdTable.name,
          Item: {
            hashKey: randomUUID(),
            rangeKey: 'big-cicd'
          },
          ConditionExpression: 'attribute_not_exists(hashKey)'
        }
      },
      {
        Put: {
          TableName: CiCdTable.name,
          Item: {
            hashKey: randomUUID(),
            rangeKey: 'big-cicd'
          },
          ConditionExpression: 'attribute_not_exists(hashKey)',
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
        }
      },
      {
        Update: {
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
      },
      ...type3bKeys.map(Key => ({
        Delete: {
          ...type3bKeyParams,
          Key
        }
      }))
    );
  try {
    const response = await request.execute();
    const {
      ItemCollectionMetrics,
      ConsumedCapacity
    } = response;
    console.log({
      ItemCollectionMetrics,
      ConsumedCapacity
    });
  } catch (error) {
    if (!request.isParsedErrorFromThisRequest(error)) {
      // eslint-disable-next-line no-undef
      fail();
    }
    const {
      CancellationReasons = [],
      transactWriteError
    } = error;
    console.log(JSON.stringify({ CancellationReasons }, null, 2));
    const sortKeysOfReasonItems = CancellationReasons.map(reason => {
      if (reason.Code === "ConditionalCheckFailed") {
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
    console.log(transactWriteError);
    expect(CancellationReasons).toStrictEqual([
      {
        Item: {
          rangeKey: "big-cicd",
          hashKey: Item.hashKey,
        },
        Code: "ConditionalCheckFailed",
        Message: "The conditional request failed",
      },
      {
        Code: "None",
      },
      {
        Code: "None",
      },
      {
        Code: "None",
      },
      {
        Code: "None",
      }
    ]);
  }

});

test('createTransactWriteItemsRequest errors', async () => {

  const request = tsDdb.createTransactWriteItemsRequest();
  expectTypeOf<Extract<keyof typeof request, 'execute'>>().toBeNever();

  const table3Inputs = new Array(101).fill(0).map((): { Put: { TableName: typeof Table3.name; Item: Type3b } } => {
    return {
      Put: {
        TableName: Table3.name,
        Item: {
          threeID: Math.random(),
          otherID: `id_${Math.random()}`,
          obj: {
            nah: 'fam',
            duck: 'goose',
            '💀': 'RIP'
          },
          record: {}
        }
      }
    };
  });
  request
    .push({
      Update: {
        TableName: Table3.name,
        Key: {
          threeID: Math.random(),
          otherID: `id_${Math.random()}`
        },
        UpdateExpression: 'SET record = :record',
        ConditionExpression: 'size(#record) < :one',
        ExpressionAttributeValues: {
          ':record': {},
          ':one': 1
        },
        // @ts-expect-error Missing EANs
        ExpressionAttributeNames: {

        }
      }
    })
    .push({
      Put: {
        TableName: Table3.name,
        Item: {
          threeID: Math.random(),
          otherID: `id_${Math.random()}`,
          obj: {
            nah: 'fam',
            duck: 'goose',
            '💀': 'RIP'
          },
          record: {}
        },
        ConditionExpression: 'attribute_exists(threeID)',
        // @ts-expect-error Unused EANs
        ExpressionAttributeNames: {
          '#threeID': 'threeID'
        }
      }
    })
    .push({
      Delete: {
        // @ts-expect-error Invalid TableName
        TableName: 'test',
        // @ts-expect-error No Key
        Key: {

        }
      }
    })
    .push({
      Delete: {
        TableName: CiCdTable.name,
        Key: {
          hashKey: randomUUID(),
          rangeKey: 'big-cicd'
        }
      },
      // @ts-expect-error Once valid, these become excess properties
      ConditionCheck: undefined
    })
    .push(...table3Inputs);
  if (!request.isNotEmpty()) {
    // eslint-disable-next-line no-undef
    fail();
  }
  try {
    await request.execute();
    // eslint-disable-next-line no-undef
    fail();
  } catch (error) {
    if (!request.isParsedErrorFromThisRequest(error)) {
      // eslint-disable-next-line no-undef
      fail();
    }
    console.log(error.transactWriteError);
    expect((error.transactWriteError as AWSError).message).toStrictEqual("Member must have length less than or equal to 100");
  }

});
