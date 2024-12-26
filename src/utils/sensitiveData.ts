import crypto from 'crypto';

// Function to encrypt data
// export const encryptData = (data, secret) => {
//     const iv = crypto.randomBytes(16); // Initialization vector
//     const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret), iv);
//     let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return iv.toString('hex') + ':' + encrypted; // Combine IV and encrypted data
// };

export function encryptData(data, secretKey) {
    const jsonString = JSON.stringify(data);
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);

    let encryptedData = cipher.update(jsonString, 'utf-8', 'base64');
    encryptedData += cipher.final('base64');
    return secretKey+ '-' + iv.toString('hex') + '-' + encryptedData;
}
