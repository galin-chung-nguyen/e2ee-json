import { BaseDataViewRepository } from './BaseDataViewRepository';
import { UserProfile, UserProfileModel } from './models';

export class CUserProfileRepository extends BaseDataViewRepository<UserProfile> {
    constructor() {
        super(UserProfileModel);
    }

    async findBySecp256k1PublicKey(pk: string, user_public_key?: string) {
        const res = await this.findOneWithUserDataView({ secp256k1_public_key: pk }, user_public_key);
        if (!res) throw new Error('User not found');
        return res;
    }
}

export const userProfileRepository = new CUserProfileRepository();
