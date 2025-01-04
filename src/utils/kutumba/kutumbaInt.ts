import axios from "axios";
import https from "https";

import { DecryptStringFromEncrypt, generateUniqueId, HashHMACHex } from "../resuableCode";
import Logger from "../../loggers/winstonLogger";
import { OtherBenfData } from "../../entities/otherBenfData";

const getReqBody = async (data: any, creteHMAC: any) => {
    const { aadhar_no, rc_no } = data;
    return {
        DeptID: "",
        BenID: "",
        RC_Number: rc_no ? `${rc_no}` : "",
        Aadhar_No: aadhar_no ? aadhar_no : "",
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



export const fetchDataFromKutumba = async (data: any) => {
    try {
        let inputValue = "";
        inputValue = (data?.aadhar_no) ?
            `${process.env.KUTUMA_CLIENT_CODE}___${data.aadhar_no}_` :
            `${process.env.KUTUMA_CLIENT_CODE}__${data.rc_no}__`;
        let creteHMAC = HashHMACHex(process.env.KUTUMBA_CLIENT_SEC_KEY!, inputValue);
        let response = await axios.post(process.env.KUTUMBA_API!, await getReqBody(data, creteHMAC), {
            headers: {
                "Accept": "application/json"
            }
        });
        if (response.status == 200 && response.data?.StatusCode == 0) {
            let decryptString = DecryptStringFromEncrypt(process.env.KUTUMBA_AES_KEY, process.env.KUTUMBA_IV_KEY, response?.data?.EncResultData)
            let pasingDecryptData = JSON.parse(decryptString);
            // await trackExternalLogs(Tables.OTHER, `kutumba ${data?.aadhar_no ? "aadhar" : "rc"} api`, "after", "", pasingDecryptData, data?.user_id);
            if (pasingDecryptData?.StatusCode === 0 && pasingDecryptData?.StatusText === "Sucess") {
                return pasingDecryptData?.ResultDataList;
            } else {
                return 422;
            }
        } else {
            return 422;
        }
    } catch (e: any) {
        Logger.error("[ *********** getFamilyAdDataFromKutumba ************* ]", e);
        return e.message;
    };
};


export const post_axios = async (url: string | any, body: any) => {
    return await axios.post(url, body, { headers: { Authorization: "QWxhZGRpbjpvcGVuIHNlc2FtZQ==" } });
};

export const getSchoolDataFromExternal = async (data: any, type: string) => {
    let urlType = (type == "school") ? process.env.SCHOOL_API : process.env.CHILD_API;
    // await trackExternalLogs(Tables.SCHOOL, type, "before", data, "", data?.user_id);
    let getData = (await post_axios(urlType, data)).data;
    if (type == "school") {
        // await trackExternalLogs(Tables.SCHOOL, type, "after", "", getData, data?.user_id);
        if (getData?.return_message == "Success" && getData.status == '1') {
            return getData.instlist;
        } else {
            return 500;
        }
    } else {
        // await trackExternalLogs(Tables.SCHOOL, type, "after", "", getData, data?.user_id);
        if (getData?.return_message == "Success" && getData.status == '1') {
            return getData.healthMstChilds;
        } else {
            return 500;
        }
    }
};

export const getAgeFromBirthDateMultipleScenario = (dob: any) => {
    let currentDate: any = new Date();
    let [dayM, monM, yearM] = dob.split("/");
    if (dayM) {
        if (dayM.length > 2) {
            let [year, mon, day] = dob.split("/");
            let originDate: any = new Date(`"${mon + "/" + day + "/" + year}"`);
            var milliDay = 1000 * 60 * 60 * 24 // a day in milliseconds;
            let age = Math.floor(((currentDate - originDate) / milliDay) / 365);
            return age;
        }
        let originDate: any = new Date(`"${monM + "/" + dayM + "/" + yearM}"`);
        var milliDay = 1000 * 60 * 60 * 24 // a day in milliseconds;
        let age = Math.floor(((currentDate - originDate) / milliDay) / 365);
        return age;
    } else {
        let [dayS, monS, yearS] = dob.split("-");
        if (dayS.length > 2) {
            let [year, mon, day] = dob.split("-");
            let originDate: any = new Date(`"${mon + "/" + day + "/" + year}"`);
            var milliDay = 1000 * 60 * 60 * 24 // a day in milliseconds;
            let age = Math.floor(((currentDate - originDate) / milliDay) / 365);
            return age;
        } else {
            let originDate: any = new Date(`"${monS + "/" + dayS + "/" + yearS}"`);
            var milliDay = 1000 * 60 * 60 * 24 // a day in milliseconds;
            let age = Math.floor(((currentDate - originDate) / milliDay) / 365);
            return age;
        }
    }
};

export const mappingKutmbaDetails = async (kutumbaData: any, type: string, data: any) => {
    let reqBody = new OtherBenfData();
    reqBody.age = kutumbaData?.MBR_DOB ? getAgeFromBirthDateMultipleScenario(kutumbaData.MBR_DOB) : 0;
    reqBody.caste = kutumbaData?.MBR_CASTE || "";
    reqBody.rc_no = type == "rc" ? data?.rc_no : "";
    reqBody.category = kutumbaData?.MBR_CASTE_CATEGORY || "";
    reqBody.father_name = kutumbaData?.MBR_NPR_FATHER_NAME || "";
    reqBody.education_id = kutumbaData?.MBR_EDUCATION_ID || "";
    reqBody.district = kutumbaData?.LGD_DISTRICT_Name || "";
    reqBody.taluk = kutumbaData?.LGD_TALUK_Name || "";
    reqBody.lgd_taluka = kutumbaData?.LGD_TALUK_CODE || "";
    reqBody.lgd_district = kutumbaData?.LGD_DISTRICT_CODE || "";
    reqBody.address = kutumbaData?.MBR_ADDRESS || "";
    reqBody.dob = kutumbaData?.MBR_DOB || "";
    reqBody.aadhar_no = kutumbaData?.MBR_HASH_AADHAR;
    reqBody.gender = kutumbaData?.MBR_GENDER || "";
    reqBody.kutumba_phone_number = kutumbaData?.MBR_MOBILE_NO || "";
    reqBody.phone_number = kutumbaData?.MBR_MOBILE_NO || "";
    reqBody.benf_name = kutumbaData?.MEMBER_NAME_ENG || "";
    return reqBody;
};

export const ekyc_post_axis = async (url: string, body: any) => {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    return await axios.post(url, body, { httpsAgent });
}

export const demoAuthEkycProcess = async (data: any) => {
    const { name, uniqueId, txnDateTime } = data;
    try {
        let bodyData = {
            BeneficiaryName: name,
            deptCode: process.env.DEMO_DEP_CODE,
            integrationKey: process.env.DEMO_INTEGRATION_KEY,
            integrationPassword: process.env.DEMO_INTEGRATION_PASS,
            txnNo: txnDateTime,
            txnDateTime: txnDateTime,
            responseRedirectURL: process.env.EKYC_REDIRECTION_URL
        };
        let res = await ekyc_post_axis(process.env.DEMO_EKYC_URL!, bodyData);
        // await trackExternalLogs(Tables.EKYC, 'DEMO AUTH', "after", "", res.data, data?.user_id);
        if (!res?.data?.Token) {
            return 422;
        } else {
            return `${process.env.DEMO_EKYC_TOKEN_URL}?key=${process.env.DEMO_INTEGRATION_KEY}&token=${res?.data?.Token}`
        }
    } catch (e) {
        return e;
    }
};


export const ekycVerification = async (data: any) => {
    const { name, uniqueId, txnDateTime } = data;
    try {
        let bodyData = {
            deptCode: process.env.DEP_CODE,
            applnCode: process.env.APPLI_CODE,
            schemeCode: process.env.SCHEME_CODE,
            beneficiaryID: uniqueId,
            beneficiaryName: name,
            integrationKey: process.env.INTEGRATION_KEY,
            integrationPassword: process.env.INTEGRATION_PASS,
            txnNo: txnDateTime,
            txnDateTime: txnDateTime,
            serviceCode: process.env.SERVICE_CODE,
            responseRedirectURL: process.env.EKYC_REDIRECTION_URL
        };
        let res = await ekyc_post_axis(process.env.EKYC_URL!, bodyData);
        // await trackExternalLogs(Tables.EKYC, Methods.EKYC, "after", "", res.data, data?.user_id);
        if (!res?.data?.Token) {
            return 422;
        } else {
            return `${process.env.EKYC_TOKEN_URL}?key=${process.env.INTEGRATION_KEY}&token=${res?.data?.Token}`
        }
    } catch (e) {
        return e;
    }
};

