import { type TSchema, Type } from '@sinclair/typebox';
import { PermissionEnum } from './common';

export const FieldPermissionInput = Type.Object({
    field_name: Type.String(),
    permission: Type.Enum(PermissionEnum),
    encrypted_password: Type.String()
});

export const DataViewDto = Type.Object({
    data_id: Type.String(),
    user_public_key: Type.String(),
    field_permissions: Type.Array(FieldPermissionInput)
});

export const buildSinclairApiResponse = <T extends TSchema>(responseDataTypeboxSchema: T) => {
    return Type.Object({
        data: responseDataTypeboxSchema,
        user_view: DataViewDto
    });
};

export const buildSinclairApiResponseWithMultipleViews = <T extends TSchema>(responseDataTypeboxSchema: T) => {
    return Type.Object({
        data: responseDataTypeboxSchema,
        user_views: Type.Array(DataViewDto)
    });
};
