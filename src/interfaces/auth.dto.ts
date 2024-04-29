import { type Static, Type } from '@sinclair/typebox';

export const AuthInputDto = Type.Object({
    publicKey: Type.String({ minLength: 1, maxLength: 66 }),
    timeExpires: Type.Number(),
    signature: Type.Array(Type.Number({}))
});

export type AuthInputDto = Static<typeof AuthInputDto>;

export const AuthResultDto = Type.Object({
    authJwt: Type.String({ minLength: 1, maxLength: 256 })
});

export type AuthResultDto = Static<typeof AuthResultDto>;
