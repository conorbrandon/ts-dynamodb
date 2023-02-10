import { DynamoDB } from "aws-sdk";

const ddb = new DynamoDB({
  accessKeyId: 'fake-key',
  endpoint: `http://localhost:8001`,
  region: 'local',
  secretAccessKey: 'fake-secret'
});

const ProvisionedThroughput = {
  ReadCapacityUnits: 1,
  WriteCapacityUnits: 1
};

const myTable: DynamoDB.CreateTableInput = {
  TableName: 'my-table.test',
  AttributeDefinitions: [
    {
      AttributeName: "p0",
      AttributeType: "S"
    },
    {
      AttributeName: "s0",
      AttributeType: "S"
    }
  ],
  KeySchema: [
    {
      AttributeName: "p0",
      KeyType: "HASH"
    },
    {
      AttributeName: "s0",
      KeyType: "RANGE"
    }
  ],
  ProvisionedThroughput
};

const cicdTable: DynamoDB.CreateTableInput = {
  TableName: "ci-cd.test",
  AttributeDefinitions: [
    {
      AttributeName: "hashKey",
      AttributeType: "S"
    },
    {
      AttributeName: "rangeKey",
      AttributeType: "S"
    },
    {
      AttributeName: "datum",
      AttributeType: "N"
    },
    {
      AttributeName: "datumStr",
      AttributeType: "S"
    },
    {
      AttributeName: "finaler",
      AttributeType: "N"
    }
  ],
  KeySchema: [
    {
      AttributeName: "hashKey",
      KeyType: "HASH"
    },
    {
      AttributeName: "rangeKey",
      KeyType: "RANGE"
    }
  ],
  ProvisionedThroughput,
  GlobalSecondaryIndexes: [
    {
      IndexName: 'datum-index.test',
      KeySchema: [
        {
          AttributeName: 'datum',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'datumStr',
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'INCLUDE',
        NonKeyAttributes: [
          "thebig"
        ]
      },
      ProvisionedThroughput
    },
    {
      IndexName: 'datumStr-index.test',
      KeySchema: [
        {
          AttributeName: 'datumStr',
          KeyType: 'HASH'
        }
      ],
      Projection: {
        ProjectionType: 'KEYS_ONLY'
      },
      ProvisionedThroughput
    },
    {
      IndexName: 'datum-all-index.test',
      KeySchema: [
        {
          AttributeName: 'datum',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'finaler',
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput
    }
  ]
};

const table3: DynamoDB.CreateTableInput = {
  TableName: "table3.test",
  AttributeDefinitions: [
    {
      AttributeName: "threeID",
      AttributeType: "N"
    },
    {
      AttributeName: "otherID",
      AttributeType: "S"
    },
    {
      AttributeName: "hoo",
      AttributeType: "S"
    },
    {
      AttributeName: "woo",
      AttributeType: "S"
    }
  ],
  KeySchema: [
    {
      AttributeName: "threeID",
      KeyType: "HASH"
    },
    {
      AttributeName: "otherID",
      KeyType: "RANGE"
    }
  ],
  ProvisionedThroughput,
  LocalSecondaryIndexes: [
    {
      IndexName: 'hoo-index.test',
      KeySchema: [
        {
          AttributeName: 'threeID',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'hoo',
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'INCLUDE',
        NonKeyAttributes: [
          "nowItExists"
        ]
      },
    },
    {
      IndexName: 'woo-index.test',
      KeySchema: [
        {
          AttributeName: 'threeID',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'woo',
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'KEYS_ONLY'
      },
    }
  ]
};

const keyinkeyTable: DynamoDB.CreateTableInput = {
  TableName: 'keyinkey',
  AttributeDefinitions: [
    {
      AttributeName: "Key",
      AttributeType: "S"
    },
    {
      AttributeName: "key",
      AttributeType: "S"
    }
  ],
  KeySchema: [
    {
      AttributeName: "Key",
      KeyType: "HASH"
    },
    {
      AttributeName: "key",
      KeyType: "RANGE"
    }
  ],
  ProvisionedThroughput
};

(async () => {
  console.info('Setting up local DynamoDB tables');
  const tables = [myTable, cicdTable, table3, keyinkeyTable];
  const existingTables = (await ddb.listTables().promise()).TableNames ?? [];
  let createPromises: Promise<string>[] = [];
  for (const table of tables) {
    const { TableName } = table;
    if (existingTables.find(table => table === TableName)) {
      createPromises.push((async () => `DynamoDB Local - Table already exists: ${TableName}. Skipping..`)());
    } else {
      createPromises.push((async () => {
        await ddb.createTable(table).promise();
        return `DynamoDB Local - Created Table: ${TableName}`;
      })());
    }
  }
  (await Promise.all(createPromises)).forEach(result => {
    console.info(result);
  });
})();