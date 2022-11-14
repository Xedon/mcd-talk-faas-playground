import { DynamoDB } from "aws-sdk";
import { ProxyHandler } from "aws-lambda";
import { v5 as uudiv5 } from "uuid";
import { buildCompetitorKey, buildCreatorKey, userUUID } from "./common";

const handler: ProxyHandler = async (event, _, __) => {
  const tableName = process.env.DYNAMODB_TABLE;
  const local = process.env.LOCAL;

  const db = new DynamoDB.DocumentClient(
    local
      ? {
          endpoint: "http://localstack:4566",
        }
      : {}
  );

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const competitorMail = event.queryStringParameters?.competitorMail;
  const creatorMail = event.queryStringParameters?.creatorMail;

  const competitorId =
    event.queryStringParameters?.competitorId ??
    (competitorMail ? userUUID(competitorMail) : undefined);

  const creatorId =
    event.queryStringParameters?.creatorId ??
    (creatorMail ? userUUID(creatorMail) : undefined);

  try {
    let bets = null;
    if (creatorId) {
      const keys = await db
        .query({
          TableName: tableName!,
          IndexName: "ReverseIndex",
          KeyConditionExpression: "SK = :pkey",
          ExpressionAttributeValues: {
            ":pkey": buildCreatorKey(creatorId),
          },
          ScanIndexForward: true,
        })
        .promise();

      if (keys.Count === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Not Found" }),
        };
      }

      bets = await db
        .batchGet({
          RequestItems: {
            [tableName!]: {
              Keys: keys.Items!.map(({ PK }) => ({ PK, SK: PK })),
            },
          },
        })
        .promise()
        .then((response) => response.Responses?.[tableName!]);
    }

    if (competitorId) {
      const keys = await db
        .query({
          TableName: tableName!,
          IndexName: "ReverseIndex",
          KeyConditionExpression: "SK = :pkey",
          ExpressionAttributeValues: {
            ":pkey": buildCompetitorKey(competitorId),
          },
          ScanIndexForward: true,
        })
        .promise();

      if (keys.Count === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Not Found" }),
          headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
          },
        };
      }

      bets = await db
        .batchGet({
          RequestItems: {
            [tableName!]: {
              Keys: keys.Items!.map(({ PK }) => ({ PK, SK: PK })),
            },
          },
        })
        .promise()
        .then((response) => response.Responses?.[tableName!]);
    }

    if (!bets) {
      bets = await db
        .scan({
          TableName: tableName!,
          FilterExpression: "begins_with(SK, :SK)",
          ExpressionAttributeValues: {
            ":SK": "BET#",
          },
        })

        .promise()
        .then((repsonse) => repsonse.Items);
    }

    bets = bets?.map((bet) => {
      delete bet.PK;
      delete bet.SK;
      return bet;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(bets),
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
      },
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
      },
    };
  }
};

module.exports.handler = handler;
