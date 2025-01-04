import crypto from "crypto";
import Logger from "../loggers/winstonLogger";
import { repoNames, repository } from "../db/repos";
import { Equal } from "typeorm";

export function generateOtp(length: number) {
    const otp = crypto.randomInt(1000, 9999).toString(); // 6-digit OTP
    return otp;
};

export function encryptData(data: any, secretKey: string) {
    const jsonString = JSON.stringify(data);
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);

    let encryptedData = cipher.update(jsonString, 'utf-8', 'base64');
    encryptedData += cipher.final('base64');
    return secretKey + '-' + iv.toString('hex') + '-' + encryptedData;
};

export function generateUniqueId() {
    // generate time 
    const [year, month, day] = new Date().toJSON().split('T')[0].split('-');
    return year + month + day + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds() + new Date().getMilliseconds();
};

// convert aadhar no to hash for getting details from kutumba
export const convertAadharToSha256Hex = async (data: any) => {
    try {
        let hash = crypto.createHash(process.env.HASHING256!);
        hash.update(data);
        return hash.digest("hex").toUpperCase();
    } catch (e: any) {
        return e.message;
    }
};

// hashmac means its combination of (aadhar no, client code, sec key, etc...)
export const HashHMACHex = (hMACKey: string, InputValue: string) => {
    let hashHMACHex = '';

    const HashHMAC = (message: any, hmac: any) => {
        return hmac.update(message).digest();
    };
    const HashEncode = (hash: any) => {
        return Buffer.from(hash).toString('base64');
    };
    try {
        const keyByte = Buffer.from(hMACKey, 'ascii');
        const hmacsha256 = crypto.createHmac('sha256', keyByte);
        const messageBytes = Buffer.from(InputValue, 'ascii');

        const hash = HashHMAC(messageBytes, hmacsha256);
        hashHMACHex = HashEncode(hash);
    } catch (ex: any) {
        Logger.error("Error Message: [" + ex.message.toString() + "]");
        return ex.message;
    }
    return hashHMACHex;
};

// convert kutumba decryptData readable formate
export const DecryptStringFromEncrypt = (key: any, IV: any, cipherText: any) => {
    const buffer = Buffer.from(cipherText, 'base64');
    const aes: any = crypto.createDecipheriv('aes-256-cbc', key, IV);
    let decrypted: any = aes.update(buffer, null, 'utf8');
    decrypted += aes.final('utf8');
    return decrypted;
};


export const createUniqueIdBasedOnCodes = async (id: string, type = 'school') => {
    // formate codes-Wise = district/taluka/phc/user_id/order_number

    let orderNumber = new Date().getTime();
    let userData = await repository.userDataRepo.createQueryBuilder('ud')
        .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
        .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
        .where("ud.UserId = :UserId", { UserId: Equal(id) })
        .getRawOne();
    let addString = "";
    for (const key in userData) {
        if (key == 'DistrictName') {
            addString += userData[key].replace(/\D/g, "") + "/";
        } else if (key === 'TalukName') {
            addString += userData[key].replace(/\D/g, "") + "/";
        } else if (key === "PhcoName") {
            addString += userData[key].replace(/\D/g, "") + "/";
        }
    }
    let checkType = (type == "school") ? `S-${orderNumber}` : orderNumber;
    let finalString = addString + id + "/" + checkType;
    return finalString;
};

export function matchStrings(a: string | any, b: string | any) {
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

export const checkEligableCandiadate = async (first: string, second: string) => {
    let NewDistrictMatch = await repository.newDistrictsRepo.findOneBy({ oldDistrictName: first });
    if (!NewDistrictMatch) {
        let macthString = matchStrings(first, second);
        return (macthString >= 50) ? "Yes" : "No";
    } else {
        let newDistricts = NewDistrictMatch.newDistrictName.toLowerCase();
        let oldDistricts = NewDistrictMatch.oldDistrictName.toLowerCase();
        let macthStringWithNewDistrict = matchStrings(newDistricts, second);
        let macthStringWithOldDistrict = matchStrings(oldDistricts, second);
        return ((macthStringWithNewDistrict >= 50 || macthStringWithOldDistrict >= 50)) ? "Yes" : "No";
    }
};

export const getAgeFromBirthDateToEkyc = (dob: any) => {
    let currentDate: any = new Date();
    let [day, mon, year] = dob.split("-");
    let originDate: any = new Date(`"${mon + "/" + day + "/" + year}"`);
    var milliDay = 1000 * 60 * 60 * 24 // a day in milliseconds;
    let age = Math.floor(((currentDate - originDate) / milliDay) / 365);
    return age;
  };
  
  
  