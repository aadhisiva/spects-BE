import crypto from 'crypto';

export function encryptData(data: any, secretKey: string) {
    const jsonString = JSON.stringify(data);
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);

    let encryptedData = cipher.update(jsonString, 'utf-8', 'base64');
    encryptedData += cipher.final('base64');
    return secretKey+ '-' + iv.toString('hex') + '-' + encryptedData;
}
