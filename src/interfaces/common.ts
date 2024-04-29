import { Type, type Static } from "@sinclair/typebox";
import { REmailRegexPattern } from "@utils";

export enum PermissionEnum {
  READ = "READ",
  WRITE = "WRITE",
  OWNER = "OWNER",
}
export const TPermissionEnumDecoder = Type.Enum(PermissionEnum);

export const TFieldPermissionDecoder = Type.Object({
  field_name: Type.String(),
  permission: TPermissionEnumDecoder,
  encrypted_password: Type.String(),
});
export type TFieldPermission = Static<typeof TFieldPermissionDecoder>;

export const TDataViewDecoder = Type.Object({
  data_id: Type.String(),
  user_public_key: Type.String(),
  field_permissions: Type.Array(TFieldPermissionDecoder),
});

export type TDataView = Static<typeof TDataViewDecoder>;

export const TUserProfileDecoder = Type.Object({
  secp256k1_public_key: Type.String({ minLength: 66, maxLength: 66 }),
  first_name: Type.String({ minLength: 1, maxLength: 50 }),
  last_name: Type.String({ minLength: 1, maxLength: 50 }),
  email: Type.RegExp(REmailRegexPattern),
});

// typebox-field-encryption
export const TFEUserProfileDecoder = Type.Omit(TUserProfileDecoder, [
  "secp256k1_public_key",
]);

export type TUserProfile = Static<typeof TUserProfileDecoder>;

export interface WithKey {
  secp256k1_public_key: string;
}