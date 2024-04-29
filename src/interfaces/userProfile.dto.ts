import { Type, type Static } from "@sinclair/typebox";
import {
  buildSinclairApiResponse,
  buildSinclairApiResponseWithMultipleViews,
} from "./dataView.dto";

// #1: create user-profile
export const DICreateUserProfile = buildSinclairApiResponse(
  Type.Object({
    secp256k1_public_key: Type.String({ minLength: 66, maxLength: 66 }),
    first_name: Type.String({ minLength: 1, maxLength: 50 }),
    last_name: Type.String({ minLength: 1, maxLength: 50 }),
    email: Type.String({ minLength: 1, maxLength: 200 }),
  })
);

export type DICreateUserProfile = Static<typeof DICreateUserProfile>;

export const DOCreateUserProfile = buildSinclairApiResponse(
  Type.Object({
    _id: Type.String(),
    secp256k1_public_key: Type.String({ minLength: 66, maxLength: 66 }),
    first_name: Type.String({ minLength: 1, maxLength: 50 }),
    last_name: Type.String({ minLength: 1, maxLength: 50 }),
    email: Type.String({ minLength: 1, maxLength: 200 }),
  })
);

export type DOCreateUserProfile = Static<typeof DOCreateUserProfile>;

// #2: get user-profile
export const DIGetUserProfile = Type.Object({
  secp256k1_public_key: Type.String({ minLength: 66, maxLength: 66 }),
});

export type DIGetUserProfile = Static<typeof DIGetUserProfile>;

export const DOGetUserProfile = buildSinclairApiResponseWithMultipleViews(
  Type.Object({
    secp256k1_public_key: Type.String({ minLength: 66, maxLength: 66 }),
    first_name: Type.String({ minLength: 1, maxLength: 50 }),
    last_name: Type.String({ minLength: 1, maxLength: 50 }),
    email: Type.String({ minLength: 1, maxLength: 200 }),
  })
);

export type DOGetUserProfile = Static<typeof DOGetUserProfile>;

// #3: update user-profile
export const DIUpdateUserProfile = buildSinclairApiResponseWithMultipleViews(
  Type.Object({
    secp256k1_public_key: Type.String({ minLength: 66, maxLength: 66 }),
    first_name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
    last_name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
    email: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  })
);
export type DIUpdateUserProfile = Static<typeof DIUpdateUserProfile>;

export const DOUpdateUserProfile = DOGetUserProfile;

export type DOUpdateUserProfile = Static<typeof DOUpdateUserProfile>;
