import express from "express";
import {
  DICreateUserProfile,
  DIGetUserProfile,
  DIUpdateUserProfile,
  DOCreateUserProfile,
  DOGetUserProfile,
} from "../interfaces/userProfile.dto";
// import { toHexStringDataId, userProfileRepository } from "@repositories";
import assert from "assert";
import { type Static } from "@sinclair/typebox";
import expressAsyncHandler from "express-async-handler";
import { verifyJwtToken } from "../hooks/verifyJwtToken";
import { validateBody, validateQuery } from "./requestValidator";
import { toHexStringDataId, userProfileRepository } from "@repositories";
const router = express.Router();
router.use(verifyJwtToken);

/// CREATE USER
router.post(
  "/create-user",
  validateBody(DICreateUserProfile),
  expressAsyncHandler(async (req, reply) => {
    const verifiedSecp256k1PublicKey = req.secp256k1_public_key;

    try {
      assert(
        req.body.data.secp256k1_public_key === verifiedSecp256k1PublicKey &&
          verifiedSecp256k1PublicKey === req.body.user_view.user_public_key,
        "Public key owner mismatch"
      );

      const curDate = new Date();

      if (
        await userProfileRepository.findOne({
          secp256k1_public_key: req.body.data.secp256k1_public_key,
        })
      ) {
        reply.status(400).send("User already exists");
        return;
      }

      // TODO: validate provided user_view contains only valid permisisons of owner
      const createdUserProfileResponse = await userProfileRepository.create(
        {
          first_name: req.body.data.first_name,
          last_name: req.body.data.last_name,
          email: req.body.data.email,
          secp256k1_public_key: req.body.data.secp256k1_public_key,
          created_at: curDate,
          updated_at: curDate,
        },
        [req.body.user_view]
      );

      const owner_view = createdUserProfileResponse.dataViews.filter(
        (view) => view.user_public_key === verifiedSecp256k1PublicKey
      )[0];

      const response: Static<typeof DOCreateUserProfile> = {
        data: {
          first_name: createdUserProfileResponse.data.first_name,
          last_name: createdUserProfileResponse.data.last_name,
          email: createdUserProfileResponse.data.email,
          secp256k1_public_key:
            createdUserProfileResponse.data.secp256k1_public_key,
          _id: createdUserProfileResponse.data._id.toHexString(),
        },
        user_view: {
          ...owner_view,
          data_id: createdUserProfileResponse.data._id.toHexString(),
        },
      };

      reply.status(201).json(response);

      // return response;
    } catch (err) {
      console.debug("Found error: ", err);
      reply.status(400).send("Error creating user profile");
    }
  })
);

// GET USER
router.get(
  "/get-user",
  validateQuery(DIGetUserProfile),
  expressAsyncHandler(async (req, reply) => {
    const verifiedSecp256k1PublicKey = req.secp256k1_public_key;
    try {
      const publicKey = req.query.secp256k1_public_key;
      assert(
        publicKey === verifiedSecp256k1PublicKey,
        "Public key owner mismatch"
      );

      const userProfile = await userProfileRepository.findOneWithDataViews({
        secp256k1_public_key: publicKey,
      });

      if (!userProfile) {
        reply.status(404).send("User not found");
        return;
      }

      const res: Static<typeof DOGetUserProfile> = {
        data: userProfile.data,
        user_views: userProfile.dataViews.map(toHexStringDataId),
      };
      reply.status(200).json(res);
    } catch (err) {
      console.debug("Found error: ", err);
      reply.status(500).send("User not found");
    }
  })
);

// UPDATE USER
router.post(
  "/update-user",
  validateBody(DIUpdateUserProfile),
  expressAsyncHandler(async (req, reply) => {
    const verifiedSecp256k1PublicKey = req.secp256k1_public_key;
    try {
      const publicKey = req.body.data.secp256k1_public_key;
      assert(
        publicKey === verifiedSecp256k1PublicKey,
        "Public key owner mismatch"
      );

      const userProfile = await userProfileRepository.findOneWithDataViews({
        secp256k1_public_key: publicKey,
      });

      if (!userProfile) {
        reply.status(404).send("User not found");
        return;
      }

      const curDate = new Date();

      // TODO: validate provided user_view contains only valid permisisons of owner
      const updatedUserProfile = await userProfileRepository.updateOne(
        userProfile.data._id,
        {
          ...(req.body.data.first_name && {
            first_name: req.body.data.first_name,
          }),
          ...(req.body.data.last_name && {
            last_name: req.body.data.last_name,
          }),
          ...(req.body.data.email && { email: req.body.data.email }),
          secp256k1_public_key: publicKey,
          updated_at: curDate,
        },
        req.body.user_views,
        publicKey
      );

      const res: Static<typeof DOGetUserProfile> = {
        data: updatedUserProfile.data,
        user_views: updatedUserProfile.dataViews.map(toHexStringDataId),
      };

      reply.status(201).json(res);
    } catch (err) {
      console.debug("Found error: ", err);
      reply.status(500).send({
        error: "Cannot update user profile",
      });
    }
  })
);

// DELETE USER
router.post(
  "/delete-user",
  validateBody(DIGetUserProfile),
  expressAsyncHandler(async (req, reply) => {
    const verifiedSecp256k1PublicKey = req.secp256k1_public_key;
    try {
      const publicKey = req.body.secp256k1_public_key;
      assert(
        publicKey === verifiedSecp256k1PublicKey,
        "Public key owner mismatch"
      );

      const userProfile = await userProfileRepository.findOneWithDataViews({
        secp256k1_public_key: publicKey,
      });

      if (!userProfile) {
        reply.status(404).send("User not found");
        return;
      }

      await userProfileRepository.delete(userProfile.data._id);

      const res: Static<typeof DOGetUserProfile> = {
        data: userProfile.data,
        user_views: userProfile.dataViews.map(toHexStringDataId),
      };

      reply.status(410).send(res);
    } catch (err) {
      console.debug("Found error: ", err);
      reply.send({
        error: "Cannot delete user profile",
      });
    }
  })
);

const userRoutes = router;
export { userRoutes };
