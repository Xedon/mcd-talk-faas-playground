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
  if (event.httpMethod !== "DELETE") {
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

  return await db
    .delete({
      TableName: DYNAMODB_TABLE!,
      Key: { PK: buildBetKey(betId), SK: buildBetKey(betId) },
    })
    .promise()
    .then(() => ({
      statusCode: 200,
      body: JSON.stringify({}),
    }))
    .catch(() => ({
      statusCode: 404,
      body: JSON.stringify({ error: "Not found" }),
    }));
};

module.exports.handler = handler;
