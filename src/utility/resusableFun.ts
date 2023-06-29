import cryptoJs from "crypto";
import { data } from "../b";
import { AppDataSource } from "../dbConfig/mysql";
import { master_data } from "../entity/master_data";
import crypto from "crypto-js";

let method = "aes-256-cbc";

const KEY = "MTY2NzM5MDQwNCU3RTE2NjczOTA0MDQlN0UxNjY3MzkwNDA0";
const IV = "1306199325031987";

// const key = cryptoJs
//     .createHash('sha512')
//     .update(secKey)
//     .digest('hex')
//     .substring(0, 32)
// const encryptionIV = cryptoJs
//     .createHash('sha512')
//     .update(iv)
//     .digest('hex')
//     .substring(0, 16)

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
  let originDate: any = new Date(`"${mon + "/" + day + "/" + year}"`);
  var milliDay = 1000 * 60 * 60 * 24 // a day in milliseconds;
  let age = Math.floor(((currentDate - originDate) / milliDay) / 365);
  return age;
};

// export function encryptData(data={}) {
//     const cipher = cryptoJs.createCipheriv(method, key, encryptionIV)
//     return Buffer.from(
//         cipher.update(JSON.stringify(data), 'utf8', 'base64') + cipher.final('base64')
//     ).toString('base64') // Encrypts data and converts to hex and base64
// }

// export function decryptData(encryptedData) {
//     const buff = Buffer.from(encryptedData, 'base64')
//     const decipher = cryptoJs.createDecipheriv(method, key, encryptionIV)
//     return (
//         decipher.update(buff.toString('utf8'), 'base64', 'utf8') +
//         decipher.final('utf8')
//     ) // Decrypts data and converts to utf8
// };

export function encryptData(plaintext = {}) {
  const key = cryptoJs.createHash("sha256").update(KEY, "utf8").digest();
  const iv = Buffer.from(IV, "utf8");
  const secretKey = cryptoJs.createCipheriv(method, key, iv);
  let ciphertext = secretKey.update(JSON.stringify(plaintext), "utf8", "base64");
  ciphertext += secretKey.final("base64");
  return ciphertext;
}

export function decrypt(ivHashCiphertext) {
  const iv = Buffer.from(IV, "utf8");
  const key = cryptoJs.createHash("sha256").update(KEY, "utf8").digest();
  const secretKey = cryptoJs.createDecipheriv(method, key, iv);
  let decValue = secretKey.update(ivHashCiphertext, "base64", "utf8");
  decValue += secretKey.final("utf8");
  return decValue;
};


export const addData = async () => {
  for (let i = 0; i < data.length; i++) {
    let saveData = new master_data(data[i]);
    await AppDataSource.getRepository(master_data).save(saveData);
  }
  return "completed";
};

const password = '123456789';
export var encryptFront = function (message) {
  const ciphertext = crypto.AES.encrypt(JSON.stringify(message), password);
  return ciphertext.toString();
}

export var decryptFront = function (message) {
  const bytes = crypto.AES.decrypt(message, password);
  const plaintext = bytes.toString(crypto.enc.Utf8);
  return plaintext;
}
