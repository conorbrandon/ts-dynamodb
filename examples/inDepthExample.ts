import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { TableFromValue, Table, TypesafeDocumentClientv2 } from "ts-dynamodb";

// Can handle environment/stage dependent table and index names no problem
const stage = process.env.stage === 'test' ? 'test' : 'prod';

// Supports branded types
type UserID = string & { __brand: 'UserID' };
type PositiveNumber = number & { __brand: 'PositiveNumber' };
type User = {
  hashKey: UserID;
  rangeKey: 'user';
  created: number;
  updated: number;
  role: 'user' | 'admin';
  lastLogin: number;
  favoriteSites: SiteID[];
  numLogins: PositiveNumber;
};
type SiteID = string & { __brand: 'SiteID' };
type Site = {
  hashKey: SiteID;
  rangeKey: 'site';
  created: number;
  updated: number;
  url: string;
  categories: string[];
  config: {
    private: boolean;
    userBlacklist: DocumentClient.StringSet;
  };
};

// Step 1: we are also adding an index to this example. The indices object takes key strings and maps them to GSI or LSI index objects
export const MyTable = {
  name: `my-table.${stage}`,
  indices: {
    'lastLogin-index': {
      name: 'lastLogin-index',
      type: 'LSI',
      sortKey: 'lastLogin',
      project: 'keys-only'
    }
  }
} as const satisfies TableFromValue;

// Step 2
export type MyTableType = Table<typeof MyTable, User | Site, 'hashKey', 'rangeKey'>;

// Step 3
const tsDdb = new TypesafeDocumentClientv2<MyTableType>(
  new DocumentClient({ region: 'us-east-1' })
);

// And now we can use it in a nonsensical get, update, and query example

const userID = '12345' as UserID;
const { Item: user } = await tsDdb.get({
  TableName: MyTable.name,
  Key: {
    hashKey: userID,
    rangeKey: 'user'
  },
  ProjectionExpression: 'hashKey, rangeKey, favoriteSites[0], numLogins[0]'
} as const);
/**
  type user = {
    numLogins?: {     // oops, made an error, numLogins is not an array!
        "[0]"?: undefined;
    } | undefined;
    favoriteSites: SiteID[] | undefined;
    hashKey: UserID;
    rangeKey: 'user';
  } | undefined
 */
if (user) {
  const siteID = user.favoriteSites?.[0];
  if (siteID) {
    const updated = Date.now();
    const { Attributes: updatedSite } = await tsDdb.update({
      TableName: MyTable.name,
      Key: {
        hashKey: siteID,
        rangeKey: 'site'
      },
      ConditionExpression: '#hashKey = :siteID AND #rangeKey = :site',
      // We can add this user to the blacklist, and for some reason we also want to remove the first site category
      UpdateExpression: 'ADD config.userBlacklist :userID REMOVE categories[0] SET #updated = :now',
      ExpressionAttributeNames: {
        '#hashKey': 'hashKey',
        '#rangeKey': 'rangeKey',
        '#updated': 'updated'
      },
      ExpressionAttributeValues: {
        ':siteID': siteID,
        ':site': 'site',
        ':userID': tsDdb.createStringSet([userID]),
        ':now': updated // Try changing this to a string instead and see what happens
      },
      ReturnValues: 'UPDATED_NEW'
    } as const);
    /**
      type updatedSite = {
        categories: string[] | undefined; // note categories is returned as undefined. It will be undefined if we removed the one and only element in the categories array
        config: {
          userBlacklist: {
            wrapperName: "Set";
            type: "String";
            values: string[];
          };
        };
        updated: number;
      } | undefined;
     */

    // Let's also see if the user has tried to login since we banned them from their favorite site (oops)
    const { Items: partialUsers } = await tsDdb.query({
      TableName: MyTable.name,
      IndexName: MyTable.indices["lastLogin-index"].name,
      KeyConditionExpression: 'hashKey = :userID AND lastLogin > :now',
      ExpressionAttributeValues: {
        ':userID': userID,
        ':now': updated
      },
      Limit: 1
    } as const);
    const partialUser = partialUsers?.[0];
    if (partialUser) {
      console.log(`user '${partialUser.hashKey}' got a nasty suprise when they logged in at ${partialUser.lastLogin} and found they couldn't access their favorite site anymore 😕`);
    }
    /**
     * You only get back the attributes that exist on the index
     type partialUsers = {
        hashKey: UserID;
        lastLogin: number;
        rangeKey: 'user';
      }[] | undefined
     */
  }
}