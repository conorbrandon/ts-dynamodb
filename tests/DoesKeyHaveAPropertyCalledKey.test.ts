import { AWSError } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table, TableFromValue, TypesafeDocumentClientv2 } from "../src/lib";

test('DoesKeyHaveAPropertyCalledKey', async () => {
  const tableWithKeyPropertyInKey = { name: 'keyinkey' } as const satisfies TableFromValue;
  type TypeWithKeyInKey = { Key: string; key: string };
  type TableWithKeyPropertyInKeyType = Table<typeof tableWithKeyPropertyInKey, TypeWithKeyInKey, 'Key', 'key'>;
  const tsDdb = new TypesafeDocumentClientv2<TableWithKeyPropertyInKeyType>(new DocumentClient({
    region: 'local',
    endpoint: 'http://localhost:8001'
  }));

  const Key = { Key: 'foo', key: 'bar' } as const;
  try {
    // @ts-expect-error providing the raw Key to this won't work because the raw Key has a property called Key
    await tsDdb.createStrictGetItem(tableWithKeyPropertyInKey.name)<TypeWithKeyInKey>()(Key);
  } catch (e) {
    expect((e as AWSError).code).toEqual("ValidationException");
    expect((e as AWSError).message).toEqual("The number of conditions on the keys is invalid");
  }
  const got = await tsDdb.createStrictGetItem(tableWithKeyPropertyInKey.name, true)<TypeWithKeyInKey>()({ Key });
  expect(got).toBeUndefined();

  try {
    // @ts-expect-error providing the raw Key to this won't work because the raw Key has a property called Key
    await tsDdb.createStrictDeleteItem(tableWithKeyPropertyInKey.name)<TypeWithKeyInKey>()(Key);
  } catch (e) {
    expect((e as AWSError).code).toEqual("ValidationException");
    expect((e as AWSError).message).toEqual("The number of conditions on the keys is invalid");
  }
  const deleted = await tsDdb.createStrictDeleteItem(tableWithKeyPropertyInKey.name, true)<TypeWithKeyInKey>()({ Key });
  expect(deleted).toBeUndefined();

});