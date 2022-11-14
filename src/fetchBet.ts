import { DynamoDB } from "aws-sdk";
import { ProxyHandler } from "aws-lambda";
import { validate } from "uuid";
import { buildBetKey } from "./common";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const LOCAL = process.env.LOCAL;

const db = new DynamoDB.DocumentClient(
  LOCAL
    ? {
        endpoint: "http://localstack:4566",
      }
    : {}
);

const handler: ProxyHandler = async (event, _, __) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const betId = event.pathParameters?.id;

  if (!betId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "betId path parameter missig" }),
    };
  }

  if (!validate(betId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invallid betId path parameter" }),
    };
  }

  try {
    const bet = await db
      .get({
        TableName: DYNAMODB_TABLE!,
        Key: { PK: buildBetKey(betId), SK: buildBetKey(betId) },
      })
      .promise()
      .then((response) => response.Item);

    if (!bet) {
      return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
    }

    delete bet.PK;
    delete bet.SK;

    return {
      statusCode: 200,
      body: `${JSON.stringify(bet)}`,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin":
          "https://project44.mayflower.tech, https://www.project44.mayflower.tech",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
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
