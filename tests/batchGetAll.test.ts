import { tsDdb } from "./lib/lib";
import { CiCdTable, MyTable } from "./lib/tables";

test('', async () => {

  const batchGetRequest = tsDdb.createBatchGetAllRequest()
    .addTable({
      TableName: MyTable.name,
      Keys: [
        {
          p0: '---',
          s0: 'b'
        }
      ],
      ProjectionExpression: '#p0, #obj',
      ExpressionAttributeNames: {
        '#p0': 'p0',
        '#obj': 'obj'
      }
    })
    .addTable({
      TableName: CiCdTable.name,
      Keys: [
        {
          hashKey: '---',
          rangeKey: 'mini-cicd'
        },
        {
          hashKey: '---',
          rangeKey: 'small-cicd'
        },
      ],
      ProjectionExpression: '#datum, #thebig.#datum',
      ExpressionAttributeNames: {
        '#datum': 'datum',
        '#thebig': 'thebig'
      }
    });

  const response = await tsDdb.batchGetAll(batchGetRequest);
  const { [MyTable.name]: myTableItems = [], [CiCdTable.name]: ciCdTableItems = [] } = response;
  console.log({
    myTableItems,
    ciCdTableItems
  });

});
