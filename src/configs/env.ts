import { Type } from "@sinclair/typebox";
import { parseTypeboxdata } from "@utils";
import { config } from "dotenv";

config();

export const envs = parseTypeboxdata(
  Type.Object({
    NODE_ENV: Type.Union([
      Type.Literal("development"),
      Type.Literal("test"),
      Type.Literal("production"),
    ]),
    JWT_SECRET: Type.String(),
    MONGO_DB_NAME: Type.String(),
    // CORS_WHITE_LIST: Type.Array(Type.String()),
    MONGO_URI: Type.String(),
  }),
  process.env
);
