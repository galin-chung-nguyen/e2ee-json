import * as jwt from "jsonwebtoken";
import assert from "assert";
import { TestingSecp256k1KeySpace } from "../tests/keyspace";
import expressAsyncHandler from "express-async-handler";
import { verifyCustomKeyTimeSignature } from "../utils/crypto/ecc";
import { AuthInputDto } from "../interfaces/auth.dto";
import { Router } from "express";
import { validateBody } from "./requestValidator";
import express from "express";
import { envs } from "@configs";
const router = express.Router();

router.get("/login-custom-key", (_req, res) => {
  res.send("Welcome");
});

router.post(
  "/login-custom-key",
  validateBody(AuthInputDto),
  expressAsyncHandler(async (req, reply) => {
    // Step 1: verify user public key
    const { publicKey, timeExpires, signature } = req.body;

    assert(
      publicKey === TestingSecp256k1KeySpace.user1.publicKeyHex,
      "Only whitelisted test user public key is allowed to use this endpoint"
    );
    const isValidKeyOwner = verifyCustomKeyTimeSignature(
      publicKey,
      timeExpires,
      signature
    );
    const curDate = new Date().getTime();
    const validTimeLeft = timeExpires - curDate;
    const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    if (
      isValidKeyOwner &&
      validTimeLeft >= SIX_DAYS &&
      validTimeLeft <= SEVEN_DAYS
    ) {
      // generate server jwt
      const JWT_SECRET = envs.JWT_SECRET;
      const jwtToken = jwt.sign(
        {
          secp256k1_public_key: publicKey,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      // generate server jwt
      reply.status(201).json({
        authJwt: jwtToken,
      });
    } else {
      // bad request
      reply.status(400).send("Invalid key owner signature");
    }
  })
);

const authRoutes = router;
export { authRoutes };
