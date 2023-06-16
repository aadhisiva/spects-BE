import cryptoJs from "crypto";

let secKey = "secretKey";
let iv = "secretIV";
let method = "aes-256-cbc";

const key = cryptoJs
    .createHash('sha512')
    .update(secKey)
    .digest('hex')
    .substring(0, 32)
const encryptionIV = cryptoJs
    .createHash('sha512')
    .update(iv)
    .digest('hex')
    .substring(0, 16)

export function generateOTP() {

    // Declare a digits variable 
    // which stores all digits
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};

export const getAgeFromBirthDate = (dob) => {
    let currentDate: any = new Date();
    let [day, mon, year] = dob.split("/");
    let originDate: any = new Date(`"${mon+"/"+day+"/"+year}"`);
    var milliDay = 1000 * 60 * 60 * 24 // a day in milliseconds;
    let age = Math.floor(((currentDate - originDate) / milliDay) / 365);
    return age;
};

export function encryptData(data={}) {
    const cipher = cryptoJs.createCipheriv(method, key, encryptionIV)
    return Buffer.from(
        cipher.update(JSON.stringify(data), 'utf8', 'base64') + cipher.final('base64')
    ).toString('base64') // Encrypts data and converts to hex and base64
}

export function decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64')
    const decipher = cryptoJs.createDecipheriv(method, key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'base64', 'utf8') +
        decipher.final('utf8')
    ) // Decrypts data and converts to utf8
};
