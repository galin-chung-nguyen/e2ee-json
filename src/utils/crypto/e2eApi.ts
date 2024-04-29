/* eslint-disable @typescript-eslint/no-explicit-any */
import { Static, TObject, TProperties } from '@sinclair/typebox';
import { PermissionEnum, TDataView, TFieldPermission } from '../../interfaces/common';
import { AESPasswordDecrypt, AESPasswordEncrypt } from './aes';
import { Secp256k1Curve, eccDecryptMessage, eccEncryptMessage } from './ecc';
import assert from 'assert';
import { getTypeboxKeys, parseTypeboxdata, typeboxFieldEncryptedDataDecoder } from '../typeBox';
import * as lodash from 'lodash';
import { Response as SuperTestResponse } from 'supertest';

export type FullFieldEncrypted<T> = {
    [K in keyof T]: string;
};

export type Difference<T, U> = {
    [TKey in Exclude<keyof T, keyof U>]: T[TKey];
};
export type Intersection<T, U> = Pick<T, Extract<keyof T, keyof U>>;

interface DataWithUserView<T> {
    data: T;
    view: TDataView;
}

const generateDocumentFieldPermission = (
    field_name: string,
    password: string,
    permission: PermissionEnum,
    publicKeyHex: string
): TFieldPermission => {
    const encryptedPassword = eccEncryptMessage(password, publicKeyHex);
    return {
        field_name: field_name,
        permission,
        encrypted_password: encryptedPassword
    };
};

// currently only used for data owner
export const encryptDataForCreateApi = <TFE extends TProperties, T extends TFE>(
    dataDecoder: TObject<T>,
    fieldEncryptedDataDecoder: TObject<TFE>,
    data: object, // full data object
    publicKeyHex: string // no prefix 0x
): DataWithUserView<Difference<T, TFE> & FullFieldEncrypted<TFE>> => {
    const fullParsedData = parseTypeboxdata(dataDecoder, data) as any as Difference<T, TFE>; // TODO: make sure this safe
    const dataWillBeEncrypted = parseTypeboxdata(fieldEncryptedDataDecoder, data);

    const dataFieldPermissions: Array<TFieldPermission> = [];

    const fieldEncryptedData: FullFieldEncrypted<TFE> = {} as FullFieldEncrypted<TFE>;

    // iterate through each field in the data object
    for (const key in dataWillBeEncrypted) {
        // generate a 256-bit hex string
        const password = Math.floor(Math.random() * 2 ** 256)
            .toString(16)
            .padStart(64, '0');

        // encrypt current field using the generated password
        const encryptedFieldData = AESPasswordEncrypt(lodash.toString(dataWillBeEncrypted[key]), password);

        // reassign the crypted field data to the original field
        fieldEncryptedData[key] = encryptedFieldData;

        // save this password
        const newFieldPermission = generateDocumentFieldPermission(key.trim(), password, PermissionEnum.OWNER, publicKeyHex);
        dataFieldPermissions.push(newFieldPermission);
    }

    // attach the list of permissions into the encrypted data
    return {
        data: { ...fullParsedData, ...fieldEncryptedData }, // make sure fieldEncryptedData overwrites fullParsedData
        view: {
            data_id: '', // no id yet
            user_public_key: publicKeyHex,
            field_permissions: dataFieldPermissions
        }
    };
};

export const decryptDataForUser = <TFE extends TProperties, T extends TFE>(
    dataDecoder: TObject<T>,
    fieldEncryptedDataDecoder: TObject<TFE>,
    data: any, // contains only field-encrypted data
    userDataView: TDataView,
    privateKeyHex: string
): Static<typeof dataDecoder> => {
    const fieldEncryptedStringDataDecoder = typeboxFieldEncryptedDataDecoder(fieldEncryptedDataDecoder);

    // create public key from private key hex
    const keyPair = Secp256k1Curve.keyFromPrivate(privateKeyHex, 'hex');

    assert(keyPair.getPublic().encode('hex', true) === userDataView.user_public_key); // true means compact form

    const decryptedData: {
        [key: string]: any;
    } = {};

    const encryptedData = parseTypeboxdata(fieldEncryptedStringDataDecoder, data);

    const dataWontBeEncrypted = lodash.omit(data, getTypeboxKeys(fieldEncryptedDataDecoder)) as any as Difference<T, TFE>;

    // iterate through each encrypted field, use the passwords in userDataView to decrypt them and reassign
    for (const key in encryptedData) {
        const encryptedPassword = userDataView.field_permissions.find(
            (fieldPermission) => fieldPermission.field_name === key.trim()
        )?.encrypted_password;

        if (!encryptedPassword) {
            console.debug(`Field ${key} not found in data view`);
            throw new Error(`Field ${key} not found in data view`);
        }

        const password = eccDecryptMessage(encryptedPassword, privateKeyHex);

        // encrypt current field using the generated password
        const cipherText = encryptedData[key];

        const decryptedFieldData = AESPasswordDecrypt(cipherText as string, password);

        // reassign the crypted field data to the original field
        decryptedData[key] = decryptedFieldData;
    }

    const decodedEncryptedData = parseTypeboxdata(fieldEncryptedDataDecoder, decryptedData);

    const fullData = { ...dataWontBeEncrypted, ...decodedEncryptedData };
    const parsedFullData = parseTypeboxdata(dataDecoder, fullData);

    return parsedFullData;
};

// Define a class to represent the processing pipeline
export class PrivacyTransformerPipeline<D> {
    private data: D;

    constructor(data: D) {
        this.data = data;
    }

    public transform<P>(transformer: (curData: D) => P) {
        const res = transformer(this.data);
        return new PrivacyTransformerPipeline(res);
    }

    public encrypt<TFE extends TProperties, T extends TFE>(
        dataDecoder: TObject<T>,
        fieldEncryptedDataDecoder: TObject<TFE>,
        publicKeyHex: string // no prefix 0x
    ): PrivacyTransformerPipeline<DataWithUserView<Difference<T, TFE> & FullFieldEncrypted<TFE>>> {
        // cast type
        const castedData = parseTypeboxdata(dataDecoder, this.data);
        return new PrivacyTransformerPipeline(encryptDataForCreateApi(dataDecoder, fieldEncryptedDataDecoder, castedData, publicKeyHex));
    }

    public parse<T extends TProperties>(decoder: TObject<T>) {
        const parsedData = parseTypeboxdata(decoder, this.data);
        return new PrivacyTransformerPipeline(parsedData);
    }

    public decrypt<TFE extends TProperties, T extends TFE>(
        dataDecoder: TObject<T>,
        fieldEncryptedDataDecoder: TObject<TFE>,
        userDataView: TDataView,
        privateKeyHex: string // no prefix 0x
    ): PrivacyTransformerPipeline<Static<typeof dataDecoder>> {
        // cast type
        return new PrivacyTransformerPipeline(
            decryptDataForUser(dataDecoder, fieldEncryptedDataDecoder, this.data, userDataView, privateKeyHex)
        );
    }

    public get(): D {
        return this.data;
    }
}

export class PrivacyTransformerPipelineBuilder<Input, Output> {
    private fn: (input: Input) => PrivacyTransformerPipeline<Output>;

    constructor(fn: (input: Input) => PrivacyTransformerPipeline<Output>) {
        this.fn = fn;
    }

    private build<NewOutputType>(builder: (ptp: PrivacyTransformerPipeline<Output>) => PrivacyTransformerPipeline<NewOutputType>) {
        const newFn = (input: Input): PrivacyTransformerPipeline<NewOutputType> => {
            const ptp = this.fn(input);
            return builder(ptp);
        };
        return new PrivacyTransformerPipelineBuilder(newFn);
    }

    public transform<P>(transformer: (curData: Output) => P) {
        return this.build((ptp) => ptp.transform(transformer));
    }

    public encrypt<TFE extends TProperties, T extends TFE>(
        dataDecoder: TObject<T>,
        fieldEncryptedDataDecoder: TObject<TFE>,
        publicKeyHex: string // no prefix 0x
    ) {
        return this.build((ptp) => ptp.encrypt(dataDecoder, fieldEncryptedDataDecoder, publicKeyHex));
    }

    public parse<T extends TProperties>(decoder: TObject<T>) {
        return this.build((ptp) => ptp.parse(decoder));
    }

    public decrypt<TFE extends TProperties, T extends TFE>(
        dataDecoder: TObject<T>,
        fieldEncryptedDataDecoder: TObject<TFE>,
        userDataView: TDataView,
        privateKeyHex: string // no prefix 0x
    ) {
        return this.build((ptp) => ptp.decrypt(dataDecoder, fieldEncryptedDataDecoder, userDataView, privateKeyHex));
    }

    public supply(input: Input) {
        return this.fn(input);
    }
}

export const ptp = <D>(data: D) => {
    return new PrivacyTransformerPipeline(data);
};

export const ptpIdentity = <I>() => {
    return new PrivacyTransformerPipelineBuilder((data: I) => ptp(data));
};

type APICaller = (url: string, data: any) => Promise<SuperTestResponse>;

export async function makeRequest<IType, OType>({
    apiCaller,
    inputPipeline,
    outputPipeline,
    url
}: {
    apiCaller: APICaller;
    inputPipeline: PrivacyTransformerPipeline<IType>;
    outputPipeline: PrivacyTransformerPipelineBuilder<object, OType>; // receive body (JSON) object (not text)
    url: string;
}) {
    const response = await apiCaller(url, inputPipeline.get());
    return {
        response,
        get: () => outputPipeline.supply(response.body).get()
    };
}
