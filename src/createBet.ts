import { DynamoDB } from "aws-sdk";
import { ProxyHandler } from "aws-lambda";
import {
  betUUID,
  buildBetKey,
  buildCompetitorKey,
  buildCreatorKey,
  userUUID,
} from "./common";

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const LOCAL = process.env.LOCAL === "true";

const db = new DynamoDB.DocumentClient(
  LOCAL
    ? {
        endpoint: "http://localstack:4566",
      }
    : {}
);

const handler: ProxyHandler = async (event, _, __) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  if (!event.body) {
    return { statusCode: 400, body: "Body Empty" };
  }

  const betId = betUUID();
  const bet: Bet = JSON.parse(event.body);
  bet.betId = betId;
  bet.creator.userId = userUUID(bet.creator.mail);
  bet.competitors = bet.competitors.map((competitor) => ({
    ...competitor,
    userId: userUUID(competitor.mail),
  }));

  const betKey = buildBetKey(betId);
  const creatorKey = buildCreatorKey(bet.creator.userId);

  const betItem = { ["PK"]: betKey, ["SK"]: betKey, ...bet };
  const betCompetitorItems = { ["PK"]: betKey, ["SK"]: creatorKey };
  const items = [
    betItem,
    betCompetitorItems,
    ...bet.competitors.map((competitor) => ({
      ["SK"]: buildCompetitorKey(competitor.userId!),
      ["PK"]: betKey,
    })),
  ];

  try {
    await db
      .batchWrite({
        RequestItems: {
          [DYNAMODB_TABLE!]: items.map((Item) => ({ PutRequest: { Item } })),
        },
      })
      .promise();
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error on writing Bet " + JSON.stringify(e),
      }),
    };
  }

  return {
    statusCode: 200,
    body: `${JSON.stringify(bet)}`,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
  };
};

module.exports.handler = handler;
