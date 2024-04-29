import jwt from "jsonwebtoken";

import { type Request, type Response, type NextFunction } from "express";
import { envs } from "@configs";

export function verifyJwtToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const AuthorizationHeader = req.headers.authorization?.split(" ");
  const jwtToken =
    AuthorizationHeader && AuthorizationHeader.length >= 2
      ? AuthorizationHeader[1]
      : "";

  if (!jwtToken) {
    res.status(401).send("Unauthorized");
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decodedPayload: any = jwt.verify(jwtToken, envs.JWT_SECRET);
    req.secp256k1_public_key = decodedPayload["secp256k1_public_key"];
  } catch (err) {
    console.error(err);
    res.status(401).send("Unauthorized");
  }
  next();
}
