import { curve } from 'elliptic';
import { encrypt, decrypt } from 'eciesjs';
import assert from 'assert';
import { RHexadecimalStringWithoutPrefix } from '../regexPatterns';

export type Secp256k1CurvePoint = curve.base.BasePoint;
import { ec as EC } from 'elliptic';
export const Secp256k1Curve: EC = new EC('secp256k1');

export function eccEncryptMessage(message: string, publicKeyHex: string) {
    assert(RHexadecimalStringWithoutPrefix.test(message));
    assert(RHexadecimalStringWithoutPrefix.test(publicKeyHex));
    const data = Buffer.from(message);
    const encryptedBuffer = encrypt(publicKeyHex, data);
    const encryptedMessage = encryptedBuffer.toString('hex');

    // console.debug(`ECC Encrypt message ${message} with publicKey ${publicKeyHex} into ${encryptedMessage}`);
    return encryptedMessage;
}

export function eccDecryptMessage(encryptedMessage: string, privateKeyHex: string) {
    assert(RHexadecimalStringWithoutPrefix.test(encryptedMessage));
    assert(RHexadecimalStringWithoutPrefix.test(privateKeyHex));
    const encryptedBuffer = Buffer.from(encryptedMessage, 'hex');
    const decryptedBuffer = decrypt(privateKeyHex, encryptedBuffer);

    // console.debug(`ECC Decrypt message ${encryptedMessage} with privateKey ${privateKeyHex} into ${decryptedBuffer.toString()}`);
    return decryptedBuffer.toString();
}

// first, generate a random password -> encrypt with ECC public key using ECIESjs
// second, use this raw password to encrypt the data object field using AES
// third, user fetch the encrypted password and decrypt it using ECIESjs
// last, use the decrypted password to decrypt the data object field using AES

// https://gist.github.com/xlab/f6cf9798ee14606dde845498bdee398d
import { createHash } from 'crypto';

export function privateKeyToPublicKey(privKey: string) {
    const keyPair = Secp256k1Curve.keyFromPrivate(privKey);
    const pubKey = keyPair.getPublic().getX().toString(16) + (keyPair.getPublic().getY().isOdd() ? '1' : '0');
    return pubKey;
}

export function signData(data: string, privKey: string) {
    const keyPair = Secp256k1Curve.keyFromPrivate(privKey);
    const signature = keyPair.sign(data);
    return signature.toDER();
}

export function decompressPublicKey(pubKeyCompressed: string) {
    const pubKeyX = pubKeyCompressed.substring(0, 64);
    const pubKeyYOdd = parseInt(pubKeyCompressed.substring(64));
    const pubKeyPoint = Secp256k1Curve.curve.pointFromX(pubKeyX, pubKeyYOdd);
    return pubKeyPoint;
}

export function verifySignature(data: string, publicKey: string, signature: Array<number>) {
    try {
        const keyPair = Secp256k1Curve.keyFromPublic(publicKey, 'hex');
        return keyPair.verify(data, signature);
    } catch (err) {
        console.debug(err);
        return false;
    }
}

export function calculateSHA256(content: string) {
    return createHash('sha3-256').update(content).digest('hex');
}

// ecc Auth module
export function generateCustomKeyTimeSignature(privateKeyHex: string) {
    const expireTime = new Date().getTime() + 1000 * 60 * 60 * 24 * 7; // 7 days
    const expireTimeHex = expireTime.toString(16);

    const keyPair = Secp256k1Curve.keyFromPrivate(privateKeyHex);

    const signature = signData(expireTimeHex, privateKeyHex);

    return {
        publicKey: keyPair.getPublic(true, 'hex'),
        timeExpires: expireTime,
        signature
    };
}

export function verifyCustomKeyTimeSignature(publicKey: string, timeExpires: number, DERSignature: Array<number>) {
    const expireTimeHex = timeExpires.toString(16);
    return verifySignature(expireTimeHex, publicKey, DERSignature);
}
