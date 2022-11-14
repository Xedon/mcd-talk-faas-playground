import { v4 as uuidv4, v5 as uudiv5 } from "uuid";

export const projectNamespace = uudiv5("projekt44.mayflower.tech", uudiv5.DNS);
export const betNamespace = uudiv5("bet", projectNamespace);
export const userNamespace = uudiv5("user", projectNamespace);

export const betUUID = () => uudiv5(uuidv4(), betNamespace);
export const userUUID = (email: string) => uudiv5(email, userNamespace);

export const buildBetKey = (betId: string) => `BET#${betId}`;
export const buildCreatorKey = (creatorId: string) => `CREATOR#${creatorId}`;
export const buildCompetitorKey = (competitorId: string) =>
  `COMPETITOR#${competitorId}`;
