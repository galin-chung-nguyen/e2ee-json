import {
  TFEUserProfileDecoder,
  TUserProfile,
  TUserProfileDecoder,
} from "src/interfaces/common";

import {
  makeRequest,
  generateCustomKeyTimeSignature,
  ptp,
  ptpIdentity,
} from "@utils";
// import { createServer } from "src/Server";
import {
  DIUpdateUserProfile,
  DOCreateUserProfile,
  DOGetUserProfile,
  DOUpdateUserProfile,
} from "src/interfaces/userProfile.dto";
import supertest from "supertest";
import SuperTest from "supertest";
import { TestingSecp256k1KeySpace } from "./keyspace";
import { createServer } from "./mock";

describe("E2E Api test", () => {
  let supertestInstance: ReturnType<typeof SuperTest>;
  let ownerKeyPairHex: { privateKeyHex: string; publicKeyHex: string };
  let serverJwt: string;

  async function post(endpoint: string, data: object) {
    const res = await supertestInstance
      .post(endpoint)
      .set("Authorization", `Bearer ${serverJwt}`)
      .set("Accept", "application/json")
      .send(data);
    return res;
  }

  async function get(endpoint: string, data: object) {
    const res = await supertestInstance
      .get(endpoint)
      .set("Authorization", `Bearer ${serverJwt}`)
      .query(data);
    return res;
  }

  beforeAll(async () => {
    const app = createServer();
    // await app.listen(3000, () => {
    //   console.log("Server running on port 3000");
    // });
    supertestInstance = supertest(app);

    ownerKeyPairHex = TestingSecp256k1KeySpace.user1;
  });

  test("Authenticate custom key owner", async () => {
    const customKeyAuthProof = generateCustomKeyTimeSignature(
      ownerKeyPairHex.privateKeyHex
    );
    const authRes = await supertestInstance
      .post("/api/auth/login-custom-key")
      .send(customKeyAuthProof)
      .set("Accept", "application/json");

    expect(authRes.statusCode).toBe(201);
    serverJwt = authRes.body?.authJwt ?? "NO_JWT_FOUND";
    expect(serverJwt).not.toBe("NO_JWT_FOUND");

    console.debug("Server JWT: ", serverJwt);
  });

  test("Test create user profile", async () => {
    // CREATE
    const originalUserDataObject: TUserProfile = {
      first_name: "HEllo",
      last_name: "World",
      email: "hello@world.com",
      secp256k1_public_key: ownerKeyPairHex.publicKeyHex,
    };

    console.debug("Original data: ", originalUserDataObject);

    const createUserResponse = await makeRequest({
      apiCaller: post,
      inputPipeline: ptp(originalUserDataObject)
        .encrypt(
          TUserProfileDecoder,
          TFEUserProfileDecoder,
          ownerKeyPairHex.publicKeyHex
        )
        .transform((input) => ({
          data: input.data,
          user_view: input.view,
        })),
      outputPipeline: ptpIdentity()
        .parse(DOCreateUserProfile)
        .transform((cur) =>
          ptp(cur.data)
            .decrypt(
              TUserProfileDecoder,
              TFEUserProfileDecoder,
              cur.user_view,
              ownerKeyPairHex.privateKeyHex
            )
            .get()
        ),
      url: "/api/user/create-user",
    });

    expect(createUserResponse.response.status).toBe(201);
    console.debug(
      `Output of create user profile request = `,
      createUserResponse.get()
    );
  });

  test("Test get user profile", async () => {
    const getUserResponse = await makeRequest({
      apiCaller: get,
      inputPipeline: ptp({
        secp256k1_public_key: ownerKeyPairHex.publicKeyHex,
      }),
      outputPipeline: ptpIdentity()
        .parse(DOGetUserProfile)
        .transform((cur) =>
          ptp(cur.data)
            .decrypt(
              TUserProfileDecoder,
              TFEUserProfileDecoder,
              cur.user_views[0],
              ownerKeyPairHex.privateKeyHex
            )
            .get()
        ),
      url: "/api/user/get-user",
    });

    expect(getUserResponse.response.status).toBe(200);
    console.debug(
      `Output of get user profile request = `,
      getUserResponse.get()
    );
  });

  test("Test update user profile", async () => {
    const updateUserResponse = await makeRequest({
      apiCaller: post,
      inputPipeline: ptp({
        secp256k1_public_key: ownerKeyPairHex.publicKeyHex,
        first_name: "The",
        last_name: "Coder",
        email: "the@coder.com",
      })
        .encrypt(
          TUserProfileDecoder,
          TFEUserProfileDecoder,
          ownerKeyPairHex.publicKeyHex
        )
        .transform((input) => ({
          data: input.data,
          user_views: [input.view],
        }))
        .parse(DIUpdateUserProfile), // optional input type lock
      outputPipeline: ptpIdentity()
        .parse(DOUpdateUserProfile)
        .transform((cur) =>
          ptp(cur.data)
            .decrypt(
              TUserProfileDecoder,
              TFEUserProfileDecoder,
              cur.user_views[0],
              ownerKeyPairHex.privateKeyHex
            )
            .get()
        ),
      url: "/api/user/update-user",
    });

    expect(updateUserResponse.response.status).toBe(201);
    console.debug(
      `Output of udpate user profile request = `,
      updateUserResponse.get()
    );
  });

  test("Test delete user profile", async () => {
    const deleteUserResponse = await post("/api/user/delete-user", {
      secp256k1_public_key: ownerKeyPairHex.publicKeyHex,
    });

    expect(deleteUserResponse.status).toBe(410);
  });
});
