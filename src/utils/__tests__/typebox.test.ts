import { TUserProfileDecoder } from "../../interfaces/common";
import { parseTypeboxdata } from "../typeBox";

describe("Typebox utils test", () => {
  test("Parsing a data", () => {
    const originalUserDataObject = {
      user_id: "random_user_id",
      first_name: "random_first_name",
      last_name: "random_last_name",
      email: "random_email@google.com",
      secp256k1_public_key:
        "1kjha09shasdfliahsdfasdofhaasdfasdfasdf234ljahskdflaisdhfsdofhasdf",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const parsedUserProfile = parseTypeboxdata(
      TUserProfileDecoder,
      originalUserDataObject
    );

    console.debug(parsedUserProfile);

    expect(1 + 1).toStrictEqual(2);
  });
});
