import { Service } from "typedi";
import cryptoJs from "crypto";
import axios from "axios";
import Logger from "./winstonLogger";
import https from "https";
import { Methods, Tables } from "./constants";
import { trackExternalLogs } from "./trackerLog";
import { AppDataSource } from "../dbConfig/mysql";
import { redirection_data } from "../entity";

export const convertAadharToSha256Hex = async (data) => {
    try {
        let hash = cryptoJs.createHash(process.env.HASHING256);
        hash.update(data);
        return hash.digest("hex").toUpperCase();
    } catch (e) {
        Logger.error("convertAadharToSha256Hex", e);
        return e.message;
    }
};

const HashHMACHex = (hMACKey, InputValue) => {
    let hashHMACHex = '';

    const HashHMAC = (message, hmac) => {
        return hmac.update(message).digest();
    };
    const HashEncode = (hash) => {
        return Buffer.from(hash).toString('base64');
    };
    try {
        const keyByte = Buffer.from(hMACKey, 'ascii');
        const hmacsha256 = cryptoJs.createHmac('sha256', keyByte);
        const messageBytes = Buffer.from(InputValue, 'ascii');

        const hash = HashHMAC(messageBytes, hmacsha256);
        hashHMACHex = HashEncode(hash);
    } catch (ex) {
        console.error(ex);
        Logger.error("Error Message: [" + ex.message.toString() + "]");
        return ex.message;
    }
    return hashHMACHex;
};

const getReqBody = async (data, creteHMAC) => {
    const { aadhar_no, rc_no } = data;
    return {
        DeptID: "",
        BenID: "",
        RC_Number: rc_no ? `${rc_no}` : "",
        Aadhar_No: aadhar_no ? await convertAadharToSha256Hex(aadhar_no) : "",
        ClientCode: process.env.KUTUMA_CLIENT_CODE,
        HashedMac: creteHMAC,
        APIVersion: "1.0",
        IsPhotoRequired: "0",
        Member_ID: "",
        Mobile_No: "",
        Request_ID: "0123456789",
        UIDType: "1"
    };
};

export const DecryptStringFromEncrypt = (key, IV, cipherText) => {
    const buffer = Buffer.from(cipherText, 'base64');
    const aes = cryptoJs.createDecipheriv('aes-256-cbc', key, IV);
    let decrypted = aes.update(buffer, null, 'utf8');
    decrypted += aes.final('utf8');
    return decrypted;
};

export const post_axios = async (url, body) => {
    return await axios.post(url, body, { headers: { Authorization: "QWxhZGsdfsd45GVuIHNlc2FtZQ==" } });
};

export const ekyc_post_axis = async (url, body) => {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    return await axios.post(url, body, { httpsAgent });
}

@Service()
export class KutumbaDetails {
    async getFamilyAdDataFromKutumba(data) {
        try {
            let inputValue = "";
            inputValue = (data?.aadhar_no) ?
                `${process.env.KUTUMA_CLIENT_CODE}___${await convertAadharToSha256Hex(data.aadhar_no)}_` :
                `${process.env.KUTUMA_CLIENT_CODE}__${data.rc_no}__`;

            let creteHMAC = HashHMACHex(process.env.KUTUMBA_CLIENT_SEC_KEY, inputValue);
            await trackExternalLogs(Tables.OTHER, `kutumba ${data?.aadhar_no ? "aadhar" : "rc"} api`, "before", await getReqBody(data, creteHMAC), "", data?.user_id);
            let response = await axios.post(process.env.KUTUMBA_API, await getReqBody(data, creteHMAC), {
                headers: {
                    "Accept": "application/json"
                }
            });
            if (response.status == 200 && response.data?.StatusCode == 0) {
                let decryptString = DecryptStringFromEncrypt(process.env.KUTUMBA_AES_KEY, process.env.KUTUMBA_IV_KEY, response?.data?.EncResultData)
                let pasingDecryptData = JSON.parse(decryptString);
                await trackExternalLogs(Tables.OTHER, `kutumba ${data?.aadhar_no ? "aadhar" : "rc"} api`, "after", "", pasingDecryptData, data?.user_id);
                if (pasingDecryptData?.StatusCode === 0 && pasingDecryptData?.StatusText === "Sucess") {
                    return pasingDecryptData?.ResultDataList;
                } else {
                    return 422;
                }
            } else {
                return 422;
            }
        } catch (e) {
            console.log("getFamilyAdDataFromKutumba", e);
            Logger.error("getFamilyAdDataFromKutumba", e);
            return e.message;
        };
    };

    async getSchoolDataFromExternal(data, type) {
        let urlType = (type == "school") ? process.env.SCHOOL_API : process.env.CHILD_API;
        await trackExternalLogs(Tables.SCHOOL, type, "before", data, "", data?.user_id);
        let getData = (await post_axios(urlType, data)).data;
        if (type == "school") {
            await trackExternalLogs(Tables.SCHOOL, type, "after", "", getData, data?.user_id);
            if (getData?.return_message == "Success" && getData.status == '1') {
                return getData.instlist;
            } else {
                return 500;
            }
        } else {
            await trackExternalLogs(Tables.SCHOOL, type, "after", "", getData, data?.user_id);
            if (getData?.return_message == "Success" && getData.status == '1') {
                return getData.healthMstChilds;
            } else {
                return 500;
            }
        }
    }

    async getDataFromEkycOutSource(data) {
        let url = await AppDataSource.getRepository(redirection_data).find();
        try {
            let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
            let bodyData = {
                deptCode: process.env.DEP_CODE,
                applnCode: process.env.APPLI_CODE,
                schemeCode: process.env.SCHEME_CODE,
                beneficiaryID: data.benf_unique_id,
                beneficiaryName: data.benf_name,
                integrationKey: process.env.INTEGRATION_KEY,
                integrationPassword: process.env.INTEGRATION_PASS,
                txnNo: txnDateTime,
                txnDateTime: txnDateTime,
                serviceCode: process.env.SERVICE_CODE,
                responseRedirectURL: `${url[0]?.ekyc_url}/edcs/edcs_service_application`
            };

            await trackExternalLogs(Tables.EKYC, Methods.EKYC, "before", bodyData, "", data?.user_id);
            let res = await ekyc_post_axis(process.env.EKYC_URL, bodyData);
            await trackExternalLogs(Tables.EKYC, Methods.EKYC, "after", "", res.data, data?.user_id);
            if (!res?.data?.Token) {
                return 422;
            } else {
                return `${process.env.EKYC_TOKEN_URL}?key=${process.env.INTEGRATION_KEY}&token=${res?.data?.Token}`
            }
        } catch (e) {
            return e;
        }
    }
};
