import { ModeOfOperation, utils as AESUtils } from 'aes-js';
import assert from 'assert';
import { RHexadecimalStringWithoutPrefix } from '../regexPatterns';

export const foldTo16Bytes = (bytes: Uint8Array): Uint8Array => {
    while (bytes.length > 16) {
        bytes[bytes.length - 17] = Number(bytes[bytes.length - 17]) ^ Number(bytes[bytes.length - 1]);
        bytes = bytes.slice(0, bytes.length - 1);
    }
    return bytes;
};

export const AESPasswordEncrypt = (message: string, password: string): string => {
    // CBC - Cipher-Block Chaining (recommended)

    // The initialization vector (must be 16 bytes)
    const iv: number[] = [];
    for (let i = 0; i < 16; ++i) iv.push(i);

    const utf8EncodeText = new TextEncoder();

    const sharedKeyBytes = foldTo16Bytes(utf8EncodeText.encode(password));

    const messageBytes = Array.from(AESUtils.utf8.toBytes(message));
    while (messageBytes.length % 16 !== 0) messageBytes.push(0);

    const aesCbc = new ModeOfOperation.cbc(sharedKeyBytes, iv);

    const cipherTextBytes = aesCbc.encrypt(messageBytes);

    const cipherText = AESUtils.hex.fromBytes(cipherTextBytes);

    return cipherText;
};

export const AESPasswordDecrypt = (cipherText: string, password: string): string => {
    // CBC - Cipher-Block Chaining (recommended)

    assert(RHexadecimalStringWithoutPrefix.test(cipherText));

    // The initialization vector (must be 16 bytes)
    const iv: number[] = [];
    for (let i = 0; i < 16; ++i) iv.push(i);

    const utf8EncodeText = new TextEncoder();

    const sharedKeyBytes = foldTo16Bytes(utf8EncodeText.encode(password));

    const cipherTextBytes = AESUtils.hex.toBytes(cipherText);

    const aesCbc = new ModeOfOperation.cbc(sharedKeyBytes, iv);

    let plainText = AESUtils.utf8.fromBytes(aesCbc.decrypt(cipherTextBytes));

    while (plainText.length > 0 && plainText[plainText.length - 1] === '\x00') plainText = plainText.slice(0, -1);

    return plainText;
};
