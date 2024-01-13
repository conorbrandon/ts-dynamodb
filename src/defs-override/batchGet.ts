import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { FilterUnusedEANOrVs, UseAllExpressionAttributeNamesInString } from "../type-helpers/string";
import { AnyExpressionAttributeNames, EANString } from "../dynamodb-types";
import { NotEmptyWithMessage } from "../type-helpers/record";
import { OnlyStrings } from "../type-helpers/utils";
import { ProjectProjectionExpressionStruct } from "../type-helpers/PE2/pe-lib";
import { TSDdbSet } from "../type-helpers/sets/utils";

export type BatchGetKeysAndAttributesInput<
  Keys extends readonly object[],
  PE extends string,
  EANs extends string,
  GAK extends string,
  EAN extends Record<EANs, GAK>,
  DummyEAN extends undefined
> = {
  Keys: Keys;
  ConsistentRead?: DocumentClient.ConsistentRead;
  ProjectionExpression?: PE extends UseAllExpressionAttributeNamesInString<EAN, true> ? PE : `Error ❌ unused EANs: ${FilterUnusedEANOrVs<PE, OnlyStrings<keyof EAN>>}`;
} & (
    PE extends EANString
    ? {
      ExpressionAttributeNames: NotEmptyWithMessage<EAN, "ExpressionAttributeNames cannot be empty">;
    }
    : {
      ExpressionAttributeNames?: DummyEAN;
    }
  );

export type BatchGetOutput<
  O extends {
    [tableName: string]: {
      TypeOfItem: Record<string, any>;
      PE: string;
      EAN: AnyExpressionAttributeNames;
    }
  }
> = {
    [tableName in keyof O]:
    [
      O[tableName]['TypeOfItem'],
      O[tableName]['PE'],
      O[tableName]['EAN']
    ] extends [infer TypeOfItem extends Record<string, any>, infer PE extends string, infer EAN extends AnyExpressionAttributeNames]
    ? string extends PE
    ? TSDdbSet<TypeOfItem>
    : ProjectProjectionExpressionStruct<TypeOfItem, PE, EAN>
    : never
  };
