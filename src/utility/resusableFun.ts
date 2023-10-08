import cryptoJs from "crypto";
// import { data } from "../b";
import { AppDataSource } from "../dbConfig/mysql";
import { master_data } from "../entity/master_data";
import { Equal } from "typeorm";
import { newDistricts } from "../entity";

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
export const getAgeFromBirthDateToEkyc = (dob) => {
  let currentDate: any = new Date();
  let [day, mon, year] = dob.split("-");
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


// export const addData = async () => {
//   for (let i = 0; i < data.length; i++) {
//     let saveData = new master_data(data[i]);
//     await AppDataSource.getRepository(master_data).save(saveData);
//   }
//   return "completed";
// };

export const reUsableResSendFunction = (res, response) => {
  if (response.code !== 200) {
    return res.status(422).send({ code: 422, status: 'Failed', message: response?.message, data: response?.data })
  } else {
    return res.status(200).send(response)
  }
};

export const PrameterizedQueries = (data) => {
  let givenData: number = data?.length;
  let arrayLength = ['', '', '', '', '', '', '', '', '', ''];
  let slicedData = arrayLength.slice(givenData);
  for (var i = 0; i < givenData; i++) {
    slicedData.unshift(data[i]?.code);
  }
  return slicedData;
};

export const PrameterizedQueriesForRefractionist = (data) => {
  let givenData: number = data?.length;
  let arrayLength = ['', '', '', '', '', '', '', '', '', '','', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
  let slicedData = arrayLength.slice(givenData);
  for (var i = 0; i < givenData; i++) {
    slicedData.unshift(data[i]?.code);
  }
  return slicedData;
};;

export const PrameterizedQueriesWithExtraQueries = (data, loginType, dates, today) => {
  let givenData: number = data?.length;
  let arrayLength = ['', '', '', '', '', '', '', '', '', ''];
  let slicedData = arrayLength.slice(givenData);
  for (var i = 0; i < givenData; i++) {
    slicedData.unshift(data[i]?.code);
  };
  slicedData.push(loginType);
  if (dates?.length !== 0) {
    const [year, month, day] = dates[0]?.split("-");
    slicedData.push(year + month + day);

    const [yearOne, monthOne, dayOne] = dates[1]?.split("-");
    slicedData.push(yearOne + monthOne + dayOne);
  } else {
    slicedData.push("");
    slicedData.push("");
  }
  slicedData.push(today);
  return slicedData;
};

export const createUniqueIdBasedOnCodes = async (id, type = 'school') => {
  // formate codes-Wise = district/taluka/phc/user_id/order_number

  let orderNumber = new Date().getTime();
  let userData = await AppDataSource.getRepository(master_data).findOneBy({ unique_id: Equal(id) });
  let addString = "";
  for (const key in userData) {
    if (key == 'district') {
      addString += userData[key].replace(/\D/g, "") + "/";
    } else if (key === 'taluka') {
      addString += userData[key].replace(/\D/g, "") + "/";
    } else if (key === "health_facility") {
      addString += userData[key].replace(/\D/g, "") + "/";
    }
  }
  let checkType = (type == "school") ? `S-${orderNumber}` : orderNumber;
  let finalString = addString + id + "/" + checkType;
  return finalString;
};

export function matchStrings(a, b) {
  var equivalency = 0;
  var minLength = (a.length > b.length) ? b.length : a.length;
  var maxLength = (a.length < b.length) ? b.length : a.length;
  for (var i = 0; i < minLength; i++) {
    if (a[i] == b[i]) {
      equivalency++;
    }
  };
  var weight = equivalency / maxLength;
  return (weight * 100);
};

export const checkEligableCandiadate = async (first, second) => {
  let NewDistrictMatch = await AppDataSource.getRepository(newDistricts).findOneBy({ oldDistrictName: first });
  if (!NewDistrictMatch) {
    let macthString = matchStrings(first, second);
    return (macthString >= 50) ? "Yes" : "No";
  } else {
    let newDistricts = NewDistrictMatch.newDistrictName.toLowerCase();
    let oldDistricts = NewDistrictMatch.newDistrictName.toLowerCase();
    let macthStringWithNewDistrict = matchStrings(newDistricts, second);
    let macthStringWithOldDistrict = matchStrings(oldDistricts, second);
    return ((macthStringWithNewDistrict >= 50 || macthStringWithOldDistrict >= 50)) ? "Yes" : "No";
  }
}

