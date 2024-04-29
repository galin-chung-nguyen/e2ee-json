import { Schema, model, Types } from 'mongoose';
import { PermissionEnum } from 'src/interfaces/common';

export const DataViewModelSchema = new Schema(
    {
        data_id: { type: Types.ObjectId, required: true },
        user_public_key: { type: String, required: true },
        field_permissions: {
            type: [
                {
                    _id: false,
                    field_name: { type: String, required: true },
                    permission: {
                        type: String,
                        enum: Object.values(PermissionEnum),
                        default: 'OWNER',
                        required: true
                    },
                    encrypted_password: { type: String, required: true }
                }
            ],
            required: true
        }
    },
    {
        versionKey: false
    }
);
export interface DataView {
    data_id: Types.ObjectId;
    user_public_key: string;
    field_permissions: Array<{
        field_name: string;
        permission: PermissionEnum;
        encrypted_password: string;
    }>;
}

export const DataViewModel = model<DataView>('DataViewModel', DataViewModelSchema);

// UserProfile
export interface UserProfile {
    first_name: string;
    last_name: string;
    email: string;
    secp256k1_public_key: string;
    created_at: Date;
    updated_at: Date;
}

export const UserProfileModelSchema = new Schema(
    {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        email: { type: String, required: true },
        secp256k1_public_key: { type: String, required: true, unique: true },
        created_at: { type: Date, required: true },
        updated_at: { type: Date, required: true }
    },
    {
        versionKey: false
    }
);

export const UserProfileModel = model<UserProfile>('UserProfileModel', UserProfileModelSchema);
