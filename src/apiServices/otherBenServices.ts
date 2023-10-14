import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { OtherBenfRepo } from "../apiRepository/otherBenRepo";
import { KutumbaDetails, convertAadharToSha256Hex } from "../utility/kutumbaDetails";
import { other_benf_data } from "../entity/other_benf_data";
import { createUniqueIdBasedOnCodes, getAgeFromBirthDate, getAgeFromBirthDateToEkyc, mappingKutmbaDetails } from "../utility/resusableFun";
import { generateOTP } from "../utility/resusableFun";
import { RESPONSEMSG } from "../utility/statusCodes";
import { rc_data } from "../entity/rc_data";
import Logger from "../utility/winstonLogger";
import { ekyc_data } from "../entity";
import { ACCESS_DENIED, COMPLETED, EKYC_ACCESS_DENIED, EKYC_SUCCESS, KUTUMBA_ACCESS_DENIED, NO, ORDER_PENDING, PHONE_REGESTERED, YES } from "../utility/constants";

const spectclesAPiReusetData = async (data, getData, type) => {
    let reqBody = new other_benf_data({});
    reqBody.age = getData?.MBR_DOB ? getAgeFromBirthDate(getData.MBR_DOB) : 0;
    reqBody.caste = getData?.MBR_CASTE ? getData.MBR_CASTE : "";
    reqBody.rc_no = type == "rc" ? data?.rc_no : "";
    reqBody.category = getData?.MBR_CASTE_CATEGORY ? getData.MBR_CASTE_CATEGORY : "";
    reqBody.father_name = getData?.MBR_NPR_FATHER_NAME ? getData.MBR_NPR_FATHER_NAME : "";
    reqBody.education_id = getData?.MBR_EDUCATION_ID ? getData.MBR_EDUCATION_ID : "";
    reqBody.district = getData?.LGD_DISTRICT_Name || "";
    reqBody.taluk = getData?.LGD_TALUK_Name || "";
    reqBody.lgd_taluka = getData?.LGD_TALUK_CODE || "";
    reqBody.lgd_district = getData?.LGD_DISTRICT_CODE || "";
    reqBody.address = getData?.MBR_ADDRESS ? getData.MBR_ADDRESS : "";
    reqBody.dob = getData?.MBR_DOB ? getData.MBR_DOB : "";
    reqBody.aadhar_no = type == "rc" ? getData?.MBR_HASH_AADHAR : await aadharConvert(data.aadhar_no);
    reqBody.gender = getData?.MBR_GENDER ? getData.MBR_GENDER : "";
    reqBody.phone_number = getData?.MBR_MOBILE_NO ? getData.MBR_MOBILE_NO : "";
    reqBody.benf_name = getData?.MEMBER_NAME_ENG ? getData.MEMBER_NAME_ENG : "";
    return reqBody;
};



// const mappingNewBenfData = (mapData: ekyc_data, getData) => {
//     let reqBody = new other_benf_data({});
//     reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDateToEkyc(mapData.ekyc_dob) : 0;
//     reqBody.caste = getData?.MBR_CASTE || "";
//     reqBody.category = getData.MBR_CASTE_CATEGORY || "";
//     reqBody.father_name = mapData?.ekyc_co || "";
//     reqBody.education_id = getData?.MBR_EDUCATION_ID || "";
//     reqBody.district = getData?.LGD_DISTRICT_Name || "";
//     reqBody.taluk = getData?.LGD_TALUK_Name || "";
//     reqBody.address = mapData?.ekyc_dist + " " + mapData?.ekyc_vtc + " " + mapData?.ekyc_street + " " + mapData?.ekyc_house + " " + mapData?.ekyc_loc + "," + mapData?.ekyc_pc || "";
//     reqBody.dob = mapData?.ekyc_dob || "";
//     reqBody.lgd_taluka = getData?.LGD_TALUK_CODE || "";
//     reqBody.lgd_district = getData?.LGD_DISTRICT_CODE || "";
//     reqBody.aadhar_no = mapData?.aadhaarHash;
//     reqBody.gender = mapData?.ekyc_gender || "";
//     reqBody.phone_number = getData?.MBR_MOBILE_NO || "";
//     reqBody.benf_name = mapData?.ekyc_name || "";
//     reqBody.benf_unique_id = mapData?.txnNo;
//     return reqBody;
// };

const mappingNewBenfData = (mapData: ekyc_data, getData) => {
    let getOneArray = getData[0];
    if (getData !== 422) {
        let reqBody = new other_benf_data({});
        reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDateToEkyc(mapData.ekyc_dob) : 0;
        reqBody.caste = getOneArray?.MBR_CASTE || "";
        reqBody.category = getOneArray.MBR_CASTE_CATEGORY || "";
        reqBody.father_name = mapData?.ekyc_co || "";
        reqBody.education_id = getOneArray?.MBR_EDUCATION_ID || "";
        reqBody.district = mapData?.ekyc_dist || "";
        reqBody.taluk = mapData?.ekyc_subdist || "";
        reqBody.address = mapData?.ekyc_dist + " " + mapData?.ekyc_vtc + ", " + mapData?.ekyc_street + ", " + mapData?.ekyc_house + ", " + mapData?.ekyc_loc + "," + mapData?.ekyc_pc || "" || "";
        reqBody.dob = mapData?.ekyc_dob || "";
        reqBody.lgd_taluka = getOneArray?.LGD_TALUK_CODE || "";
        reqBody.lgd_district = getOneArray?.LGD_DISTRICT_CODE || "";
        reqBody.aadhar_no = mapData?.aadhaarHash;
        reqBody.gender = mapData?.ekyc_gender || "";
        reqBody.kutumba_phone_number = getOneArray?.MBR_MOBILE_NO || "";
        reqBody.benf_name = mapData?.ekyc_name || "";
        reqBody.benf_unique_id = mapData?.txnNo;
        return reqBody;
    } else {
        let reqBody = new other_benf_data({});
        reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDateToEkyc(mapData.ekyc_dob) : 0;
        reqBody.father_name = mapData?.ekyc_co || "";
        reqBody.district = mapData?.ekyc_dist || "";
        reqBody.taluk = mapData?.ekyc_subdist || "";
        reqBody.dob = mapData?.ekyc_dob || "";
        reqBody.address = mapData?.ekyc_dist + " " + mapData?.ekyc_vtc + " ," + mapData?.ekyc_street + ", " + mapData?.ekyc_house + ", " + mapData?.ekyc_loc + "," + mapData?.ekyc_pc || "";
        reqBody.aadhar_no = mapData?.aadhaarHash;
        reqBody.gender = mapData?.ekyc_gender || "";
        reqBody.benf_name = mapData?.ekyc_name || "";
        reqBody.benf_unique_id = mapData?.txnNo;
        return reqBody;
    }
};


const aadharConvert = async (no) => {
    return await convertAadharToSha256Hex(no);
}

@Service()
export class OtherBenfServices {
    constructor(
        public OtherBenfRepo: OtherBenfRepo,
        public SMSServices: SMSServices,
        public ResusableFunctions: ResusableFunctions,
        public KutumbaFunction: KutumbaDetails
    ) { }
    /* Demo Auth Apis */

    async addDemoAuthWithVersion(data) {
        const { benfName, aadharHash, user_id } = data;
        try {
            if (!user_id) return { code: 422, message: "User Id Not Provided." };
            if (!aadharHash) return { code: 422, message: "AadharHash Not Provided." };
            if (!benfName) return { code: 422, message: "BenfName Not Provided." };
            let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
            let originBenfData: any = await this.OtherBenfRepo.findDataOfLatestBenfData(aadharHash);
            if (originBenfData?.applicationStatus == COMPLETED
                && originBenfData?.ekyc_check == "Y"
            ) return { code: 422, message: `Already Registered With Order Number ${originBenfData.order_number}.` };
            let body = { aadhar_no: aadharHash };
            let getKutumbaData = await this.KutumbaFunction.KutumbaDetailsFrom(body);
            if (getKutumbaData !== 422) {
                let kutumbaData = await mappingKutmbaDetails(getKutumbaData[0], '', '');
                let checkEducationId: any = await this.OtherBenfRepo.checkEducationId(kutumbaData.education_id);
                if (checkEducationId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.` };
                kutumbaData.benf_unique_id = txnDateTime // creating uninque id
                kutumbaData.user_id = user_id; // adding user id
                await this.OtherBenfRepo.savingNewData(kutumbaData); // saving dummy table -> other_beneficiary
                let fetchData = await this.OtherBenfRepo.fetchRcUserDataWIthBenfId(kutumbaData);
                let check = fetchData.scheme_eligability == "Yes";
                let findMasterDistrict = await this.OtherBenfRepo.fetchDataFromMaster(kutumbaData);
                return {
                    ekycRequired: NO, errorInfo: !check ?
                        `You Are Not Eligible For ${findMasterDistrict.district}. Application Can Not Be Processed.` : "", data: fetchData
                };
            } else {
                let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
                let uniqueId = new Date().getTime();
                let bodyData = {
                    name: benfName,
                    uniqueId,
                    txnDateTime
                }
                let urlResult = await this.KutumbaFunction.demoAuthEkycProcess(bodyData);
                if (urlResult == 422) return { code: 422, message: EKYC_ACCESS_DENIED };
                return { ekycRequired: YES, data: { uniqueId: txnDateTime, Token: urlResult } };
            }
        } catch (e) {
            return Logger.error("Other service ##directEkycForAadhar", e);
        }
    };
    async ekycProcessWithKutumba(data) {
        const { aadharHash, user_id } = data;
        try {
            if (!user_id) return { code: 422, message: "User Id Not Provided." }
            if (!aadharHash) return { code: 422, message: "AadharHash Not Provided." }
            let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
            let originBenfData: any = await this.OtherBenfRepo.findDataOfLatestBenfData(aadharHash);
            if (originBenfData?.applicationStatus == COMPLETED
                && originBenfData?.ekyc_check == "Y"
            ) return { code: 422, message: `Already Registered With Order Number ${originBenfData.order_number}.` };
            let body = { aadhar_no: aadharHash };
            let getKutumbaData = await this.KutumbaFunction.KutumbaDetailsFrom(body);
            if (getKutumbaData !== 422) {
                let kutumbaData = await mappingKutmbaDetails(getKutumbaData[0], '', '');
                let checkEducationId: any = await this.OtherBenfRepo.checkEducationId(kutumbaData.education_id);
                if (checkEducationId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.` };
                kutumbaData.benf_unique_id = txnDateTime // creating uninque id
                kutumbaData.user_id = user_id; // adding user id
                await this.OtherBenfRepo.savingNewData(kutumbaData); // saving dummy table -> other_beneficiary
                let fetchData = await this.OtherBenfRepo.fetchRcUserDataWIthBenfId(kutumbaData);
                let check = fetchData.scheme_eligability == "Yes";
                let findMasterDistrict = await this.OtherBenfRepo.fetchDataFromMaster(kutumbaData);
                return {
                    ekycRequired: NO, errorInfo: !check ?
                        `You Are Not Eligible For ${findMasterDistrict.district}. Application Can Not Be Processed.` : "", data: fetchData
                };
            } else {
                let uniqueId = new Date().getTime();
                let bodyData = {
                    name: "EDCS",
                    uniqueId,
                    txnDateTime
                };
                let urlResult = await this.KutumbaFunction.ekycVerification(bodyData);
                if (urlResult == 422) return { code: 422, message: EKYC_ACCESS_DENIED };
                return { ekycRequired: YES, data: { uniqueId: txnDateTime, Token: urlResult } };
            }
        } catch (e) {
            return Logger.error("Other service ##directEkycForAadhar", e);
        }
    };

    async saveDemoAuthResponse(data) {
        try {
            const { uniqueId, user_id } = data;
            if (!uniqueId && !user_id) return { code: 422, message: "UniqueId And UserID Field Required" };
            let pullEkycData: any = await this.OtherBenfRepo.FetchDataFromEkyc(uniqueId);
            if (!pullEkycData) return { code: 422, message: EKYC_ACCESS_DENIED };
            if (pullEkycData?.finalStatus == 'F') return { code: 422, message: pullEkycData.errorMessage, data: {} };
            if (pullEkycData?.ekyc_state !== 'Karnataka') return { code: 422, message: "You Are The Out Of Karnataka." };

            // checking actual table
            let originBenfData: any = await this.OtherBenfRepo.findDataOfLatestBenfData(pullEkycData?.aadhaarHash);
            if (originBenfData?.applicationStatus == COMPLETED && originBenfData?.ekyc_check == "Y") return { code: 422, message: `Already Registered With Order Number ${originBenfData.order_number}.` };

            let getData = await this.KutumbaFunction.KutumbaDetailsFrom({ aadhar_no: pullEkycData.aadhaarHash });
            let mapDataOtherBenfWise = mappingNewBenfData(pullEkycData, getData);
            mapDataOtherBenfWise.user_id = user_id;

            await this.OtherBenfRepo.savingNewData(mapDataOtherBenfWise);
            let fetchData = await this.OtherBenfRepo.fetchRcUserData(mapDataOtherBenfWise);
            let check = fetchData.scheme_eligability == "Yes";
            let findMasterDistrict = await this.OtherBenfRepo.fetchDataFromMaster(mapDataOtherBenfWise);
            return {
                message: EKYC_SUCCESS, errorInfo: !check ?
                    `You Are Not Eligible For ${findMasterDistrict.district}. Application Can Not Be Processed.` : "", data: fetchData
            };
        } catch (e) {
            return Logger.error("Other service ##addDataAfterEkyc", e);
        }
    };

    /* Demo Auth Apis Ended*/
    async directEkycForAadhar(data) {
        try {
            const { user_id } = data;
            if (!user_id) return { code: 422, message: "Name And UserID Field Required" };
            let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
            let uniqueId = new Date().getTime();
            let bodyData = {
                name: "EDCS",
                uniqueId,
                txnDateTime
            }
            let urlResult = await this.KutumbaFunction.ekycVerification(bodyData);
            if (urlResult == 422) return { code: 422, message: EKYC_ACCESS_DENIED };
            return { uniqueId: txnDateTime, Token: urlResult };
        } catch (e) {
            return Logger.error("Other service ##directEkycForAadhar", e);
        }
    };
    async addDataAfterEkyc(data) {
        try {
            const { uniqueId, user_id } = data;
            if (!uniqueId && !user_id) return { code: 422, message: "UniqueId And UserID Field Required" };
            let pullEkycData: any = await this.OtherBenfRepo.FetchDataFromEkyc(uniqueId);
            if (!pullEkycData) return { code: 422, message: EKYC_ACCESS_DENIED };
            if (pullEkycData?.finalStatus == 'F') return { code: 422, message: pullEkycData.errorMessage, data: {} };
            if (pullEkycData?.ekyc_state !== 'Karnataka') return { code: 422, message: "You Are The Out Of Karnataka." };

            // checking actual table
            let originBenfData: any = await this.OtherBenfRepo.findDataOfLatestBenfData(pullEkycData?.aadhaarHash);
            if (originBenfData?.applicationStatus == COMPLETED && originBenfData?.ekyc_check == "Y") return { code: 422, message: `Already Registered With Order Number ${originBenfData.order_number}.` };

            let getData = await this.KutumbaFunction.KutumbaDetailsFrom({ aadhar_no: pullEkycData.aadhaarHash });
            let mapDataOtherBenfWise = mappingNewBenfData(pullEkycData, getData);
            mapDataOtherBenfWise.user_id = user_id;
            let findMasterDistrict = await this.OtherBenfRepo.fetchDataFromMaster(mapDataOtherBenfWise);
            mapDataOtherBenfWise.refractionist_name = findMasterDistrict.refractionist_name;
            mapDataOtherBenfWise.refractionist_mobile = findMasterDistrict.refractionist_mobile;
            await this.OtherBenfRepo.savingNewData(mapDataOtherBenfWise);
            let fetchData = await this.OtherBenfRepo.fetchRcUserData(mapDataOtherBenfWise);
            let check = fetchData.scheme_eligability == "Yes";
            return {
                message: EKYC_SUCCESS, errorInfo: !check ?
                    `You Are Not Eligible For ${findMasterDistrict.district}. Application Can Not Be Processed.` : "", data: fetchData
            };
        } catch (e) {
            return Logger.error("Other service ##addDataAfterEkyc", e);
        }
    };

    async updateAadharData(data: other_benf_data) {
        try {

            const { benf_unique_id, user_id } = data;
            if (!benf_unique_id && !user_id) return { code: 422, message: "ID And User ID Fields Required" };
            let originBenfData = await this.OtherBenfRepo.getLatestWithID(benf_unique_id);
            if (!originBenfData) {
                data.order_number = await createUniqueIdBasedOnCodes(data.user_id, 'other');
                data.type = "otherBenificiary";
                data.details = "aadhar";
                data.status = ORDER_PENDING;
                data.applicationStatus = COMPLETED;
                await this.OtherBenfRepo.updateAadharData(data);
                let findUser: any = await this.OtherBenfRepo.findOneUserWithBenfId(data);
                let checkEducationId: any = await this.OtherBenfRepo.checkEducationId(findUser.education_id);
                if (checkEducationId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.` };
                await await this.OtherBenfRepo.saveOriginalBenf(findUser);
                return { message: RESPONSEMSG.UPDATE_SUCCESS };
            } else {
                await this.OtherBenfRepo.updateAadharDataOriginal(data);
                return { message: RESPONSEMSG.UPDATE_SUCCESS };
            }
        } catch (e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };

    /* rc data */
    async addRcDataAndGet(data) {
        try {
            if (!data?.rc_no) return { code: 422, message: "RC Field Required." };
            let checkRcById = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
            if (checkRcById?.length == 0) {
                let getData = await this.KutumbaFunction.KutumbaDetailsFrom(data);
                if (getData == 422) return { code: 422, message: KUTUMBA_ACCESS_DENIED };

                for (let i = 1; i <= getData.length; i++) {
                    let reqBody = await spectclesAPiReusetData(data, getData[i - 1], "rc");
                    await this.OtherBenfRepo.createRcDataByEach(reqBody);
                }

                let rcData: any = await this.OtherBenfRepo.FatchRcData(data.rc_no);
                if (rcData.length == 0) return { code: 422, message: ACCESS_DENIED };
                (rcData || []).map(obj => (obj.phone_number.length == 10) ? obj.isPhoneNumber = "Yes" : obj.isPhoneNumber = "No");
                return rcData;
            } else {
                let rcData: any = await this.OtherBenfRepo.FatchRcData(data.rc_no);
                if (rcData.length == 0) return { code: 422, message: ACCESS_DENIED };
                (rcData || []).map(obj => (obj.phone_number.length == 10) ? obj.isPhoneNumber = "Yes" : obj.isPhoneNumber = "No");
                return rcData;
            };
        } catch (e) {
            return Logger.error("Other service ##addRcDataAndGet", e);
        }
    };

    async rcBasedOnNumberWise(reqBody) {
        try {
            const { benf_unique_id, phone_number, user_id } = reqBody;
            if (!benf_unique_id && !phone_number && !user_id) return { code: 422, message: "Id And Number Field Required." };
            let findOneMemberRC = await this.OtherBenfRepo.findOneMemberInRC(benf_unique_id);
            if (!findOneMemberRC) return { code: 422, message: ACCESS_DENIED };
            let findOneMemberOther = await this.OtherBenfRepo.findOneMemberInOther(findOneMemberRC.aadhar_no);

            let originBenfData: any = await this.OtherBenfRepo.findDataOfLatestBenfData(findOneMemberRC?.aadhar_no);
            if (findOneMemberRC.education_id.length > 0) {
                let checkinRcData = await this.OtherBenfRepo.checkSatsDuplicate(findOneMemberRC);
                if (checkinRcData) return { code: 422, message: `Already Registered In Schools With Order Number ${originBenfData.order_number}.` };
            }
            // checking actual table
            if (originBenfData?.applicationStatus == COMPLETED && originBenfData?.ekyc_check == "Y") return { code: 422, message: `Already Registered With Order Number ${originBenfData.order_number}.` };

            if (findOneMemberOther) {
                findOneMemberOther.benf_unique_id = benf_unique_id;
                if (reqBody?.case == "Yes") {
                    let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
                    let bodyData = {
                        name: findOneMemberOther.benf_name,
                        uniqueId: findOneMemberOther.benf_unique_id,
                        txnDateTime
                    }
                    let urlResult = await this.KutumbaFunction.ekycVerification(bodyData);
                    if (urlResult == 422) return { code: 422, message: EKYC_ACCESS_DENIED };
                    return { message: RESPONSEMSG.RETRIVE_SUCCESS, data: { uniqueId: txnDateTime, Token: urlResult } };
                };
                // if (findOneMemberOther.applicationStatus == COMPLETED && findOneMemberOther?.ekyc_check == "Y") return { code: 422, message: `Already Registered With Order Number ${findOneMemberOther?.order_number}` };

                findOneMemberOther.phone_number = findOneMemberOther?.phone_number
                if (phone_number !== 'Yes') {
                    let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
                    let bodyData = {
                        name: findOneMemberOther.benf_name,
                        uniqueId: findOneMemberOther.benf_unique_id,
                        txnDateTime
                    }
                    let urlResult = await this.KutumbaFunction.ekycVerification(bodyData);
                    if (urlResult == 422) return { code: 422, message: EKYC_ACCESS_DENIED };
                    await this.OtherBenfRepo.updateDataExistsRecord(findOneMemberOther);
                    return { message: RESPONSEMSG.RETRIVE_SUCCESS, data: { uniqueId: txnDateTime, Token: urlResult } };
                } else {
                    findOneMemberOther['otp'] = generateOTP();
                    let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(findOneMemberOther?.phone_number, findOneMemberOther.otp);
                    await this.ResusableFunctions.sendSmsInKannadaUnicode(findOneMemberOther?.phone_number, findOneMemberOther.otp);
                    if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                    await this.OtherBenfRepo.updateDataExistsRecord(findOneMemberOther);
                    return { message: RESPONSEMSG.OTP, data: {} };
                }
            } else {
                let finalData = await this.OtherBenfRepo.mapRcDataTOOtherBenf(findOneMemberRC);
                finalData['otp'] = generateOTP();
                finalData.user_id = user_id;
                let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
                if (phone_number !== 'Yes') {
                    let bodyData = {
                        name: finalData.benf_name,
                        uniqueId: finalData.benf_unique_id,
                        txnDateTime
                    }
                    let urlResult = await this.KutumbaFunction.ekycVerification(bodyData);
                    if (urlResult == 422) return { code: 422, message: EKYC_ACCESS_DENIED };
                    await this.OtherBenfRepo.addNewDataFromRC(finalData);
                    return { message: RESPONSEMSG.RETRIVE_SUCCESS, data: { uniqueId: txnDateTime, Token: urlResult } };
                } else {
                    let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData?.phone_number, finalData.otp);
                    await this.ResusableFunctions.sendSmsInKannadaUnicode(finalData?.phone_number, finalData.otp);
                    if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                    await this.OtherBenfRepo.addNewDataFromRC(finalData);
                    return { message: RESPONSEMSG.OTP, data: {} };
                };
            }
        } catch (e) {
            return Logger.error("Other service ##rcBasedOnNumberWise", e);
        }
    };

    async otpCheckRcMember(data) {
        try {
            const { user_id, benf_unique_id, otp } = data;
            if (!user_id && !benf_unique_id && !otp) return { code: 422, message: "Id Field Required." }
            let getData = await this.OtherBenfRepo.getAllDataByUserAndUnique(data);
            let checkOtp = getData.otp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
            let result = await this.OtherBenfRepo.fetchRcUserData(data);
            return { message: RESPONSEMSG.VALIDATE, data: result }
        } catch (e) {
            return Logger.error("Other Service ####fetchRcUserData", e);
        }
    };

    async fetchRcUserData(data) {
        try {
            const { user_id, benf_unique_id } = data;
            if (!user_id && !benf_unique_id) return { code: 422, message: "Id Field Required." }
            return await this.OtherBenfRepo.fetchRcUserData(data);
        } catch (e) {
            return Logger.error("Other Service ####fetchRcUserData", e);
        }
    };

    async updateRcAadharData(data: other_benf_data) {
        try {
            const { benf_unique_id, user_id } = data;
            if (!benf_unique_id && !user_id) return { code: 422, message: "ID And User ID Fields Required" };
            let originBenfData = await this.OtherBenfRepo.getLatestWithID(benf_unique_id);
            if (!originBenfData) {
                data.order_number = await createUniqueIdBasedOnCodes(data.user_id, 'other');
                data.type = "otherBenificiary";
                data.details = "rc";
                data.status = ORDER_PENDING;
                data.applicationStatus = COMPLETED;
                await this.OtherBenfRepo.updateAadharData(data);
                let findUser: any = await this.OtherBenfRepo.findOneUserWithBenfId(data);
                let checkEducationId: any = await this.OtherBenfRepo.checkEducationId(findUser.education_id);
                if (checkEducationId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.` };
                await this.OtherBenfRepo.saveOriginalBenf(findUser);
                return { message: RESPONSEMSG.UPDATE_SUCCESS };
            } else {
                await this.OtherBenfRepo.updateAadharDataOriginal(data);
                return { message: RESPONSEMSG.UPDATE_SUCCESS };
            }
        } catch (e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };
    async ekycResutltCheck(data) {
        try {
            const { uniqueId, benf_unique_id, user_id } = data;
            if (!benf_unique_id && !uniqueId && !user_id) return { code: 422, message: "Id Field Required" };
            let pullEkycData: any = await this.OtherBenfRepo.FetchDataFromEkyc(uniqueId);
            if (!pullEkycData) return { code: 422, message: EKYC_ACCESS_DENIED };
            if (pullEkycData?.finalStatus == "F") return { code: 422, message: pullEkycData.errorMessage };
            if (pullEkycData?.ekyc_state !== 'Karnataka') return { code: 422, message: "You Are The Out Of Karnataka." };
            let pullBenfData: any = await this.OtherBenfRepo.FetchDataFromOtherWithID(benf_unique_id);
            if (!pullBenfData) return { code: 422, message: ACCESS_DENIED };
            let checkAadharHas = pullEkycData?.aadhaarHash.toLowerCase() == pullBenfData?.aadhar_no.toLowerCase();
            if (!checkAadharHas) return { code: 422, message: "Hash Matching Failed." };
            pullBenfData.ekyc_check = 'Y';
            pullBenfData.district = pullEkycData?.ekyc_dist || "";
            pullBenfData.taluk = pullEkycData?.ekyc_subdist || "";
            // let mapData = mappingRcDataWiseNewBenfData(pullEkycData);
            pullBenfData.benf_unique_id = benf_unique_id;
            let findMasterDistrict = await this.OtherBenfRepo.fetchDataFromMaster(pullBenfData); // get master data by user
            pullBenfData.refractionist_name = findMasterDistrict.refractionist_name; // updating refractionist name
            pullBenfData.refractionist_mobile = findMasterDistrict.refractionist_mobile; // updating refractionist mobile number

            await this.OtherBenfRepo.updateOneRecordInOther(pullBenfData);
            let fetchData = await this.OtherBenfRepo.fetchRcUserData(pullBenfData);
            let check = fetchData.scheme_eligability == "Yes";
            return {
                message: EKYC_SUCCESS, errorInfo: !check ?
                    `You Are Not Eligible For ${findMasterDistrict.district}. Application Can Not Be Processed.` : "", data: fetchData
            };
        } catch (e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };

    async getBenfAllStatus(data: other_benf_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "Id Field Required." };
            let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: ACCESS_DENIED };
            return await this.OtherBenfRepo.getBenificaryStatus(data.user_id);
        } catch (e) {
            Logger.error("OtherBenfServices === getBenfAllStatus", e);
            return e;
        }
    }
    async eachStatusWise(data: other_benf_data) {
        try {
            const { benf_unique_id } = data;
            if (!benf_unique_id) return { code: 422, message: "Id Field Required." };
            return await this.OtherBenfRepo.eachStatusWise(benf_unique_id);
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async readyToDeliverOtp(data: other_benf_data) {
        try {
            const { benf_unique_id, phone_number } = data;
            if (!benf_unique_id && !phone_number) return { code: 422, message: "Id And Number Field Required." };
            data.deliveredOtp = generateOTP();
            data.status = 'ready_to_deliver'
            let getData = await this.OtherBenfRepo.findWithBenfData(benf_unique_id);
            let smsOtp = await this.ResusableFunctions.sendOtpAsReadyForDeliver(data?.phone_number, data.deliveredOtp, getData.order_number);
            if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            await this.OtherBenfRepo.updateDataWithBenfId(data);
            return { message: RESPONSEMSG.OTP, data: {} }
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async validateReadyToDeliverOtp(data: other_benf_data) {
        try {
            const { benf_unique_id } = data;
            if (!benf_unique_id) return { code: 422, message: "Id Field Required." };
            let getData = await this.OtherBenfRepo.findWithBenfData(benf_unique_id);
            let checkOtp = getData?.deliveredOtp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
            return { message: RESPONSEMSG.VALIDATE, data: {} }
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async delivered(data: other_benf_data) {
        try {
            const { benf_unique_id } = data;
            if (!benf_unique_id) return { code: 422, message: "Id Field Required." };
            data.status = 'delivered';
            await this.OtherBenfRepo.updateDataWithBenfId(data);
            return { message: RESPONSEMSG.UPDATE_SUCCESS, data: {} }
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async otpSentToNewNumber(data: other_benf_data) {
        try {
            const { benf_unique_id, phone_number } = data;
            if (!benf_unique_id && !phone_number) return { code: 422, message: "Id And Number Field Required." };
            let findWithNoAndId = await this.OtherBenfRepo.checkDataWithPhoneNumberAndId(data);
            if (findWithNoAndId.length > 4) return { code: 422, message: PHONE_REGESTERED };
            // if (findWithNoAndId) {
            //     data.otp = generateOTP();
            //     let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
            //     if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            //     await this.OtherBenfRepo.updateDataWithPhoneAndId(data);
            //     return { message: RESPONSEMSG.OTP }
            // } else {
            data.otp = generateOTP();
            // let findDataWithPhone = await this.OtherBenfRepo.checkDataWithPhoneNumber(phone_number);
            // if (findDataWithPhone) return { code: 422, message: PHONE_REGESTERED };
            let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
            await this.ResusableFunctions.sendSmsInKannadaUnicode(data?.phone_number, data.otp);
            if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            await this.OtherBenfRepo.updateDataWithPhoneAndId(data);
            return { message: RESPONSEMSG.OTP, data: {} }

            // }
        } catch (e) {
            Logger.error("OtherBenfServices ####otpSentToNewNumber", e);
            return e;
        }
    };

    async validateWithNewNumber(data: other_benf_data) {
        try {
            const { benf_unique_id } = data;
            if (!benf_unique_id) return { code: 422, message: "Id Field Required." };
            let result = await this.OtherBenfRepo.FetchDataFromOtherWithID(benf_unique_id);
            let checkOtp = result.otp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE, data: {} }
        } catch (e) {
            Logger.error("OtherBenfServices ####validateWithNewNumber", e);
            return e;
        }
    };


    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/

    async addKutumbaAaadharDetails(data: other_benf_data) {
        try {
            if (!data?.aadhar_no || !data.user_id) return { code: 422, message: "Aadhar number and user id required." };
            let bodyData = { aadhar_no: await aadharConvert(data.aadhar_no) };
            let checkOnlyAadharHash = await this.OtherBenfRepo.checkOnlyAadharHash(bodyData);
            if (checkOnlyAadharHash) {
                if (checkOnlyAadharHash?.ekyc_check == "N") {
                    if (checkOnlyAadharHash?.applicationStatus == "Completed") return { code: 422, message: "Aadhar Already Registered." };
                    let res = await this.KutumbaFunction.getDataFromEkycOutSource(checkOnlyAadharHash);
                    return (res == 422) ? { code: 422, message: "Access Denied From Ekyc." } : res;
                } else {
                    return { code: 422, message: "Already Registered." }
                }
            } else {
                let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
                if (getData == 422) return { code: 422, message: "Access Denied From Kutumba." }
                let reqBody: any = await spectclesAPiReusetData(data, getData[0], "aadhar");
                reqBody.user_id = data.user_id;

                let getAllCount = await this.OtherBenfRepo.findAll();
                let checkUndefined = (getAllCount[0]?.benf_unique_id == undefined) ? 0 : getAllCount[0]?.benf_unique_id;
                reqBody.benf_unique_id = `${Number(checkUndefined) + 1}`;
                reqBody.order_number = await createUniqueIdBasedOnCodes(reqBody.user_id);;
                let addrResult = await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(reqBody);
                let res = await this.KutumbaFunction.getDataFromEkycOutSource(addrResult);
                return (res == 422) ? { code: 422, message: "Access Denied From Ekyc." } : res;
            };
        } catch (e) {
            Logger.info("OtherBenfServices === addKutumbaAaadharDetails", e);
            return e;
        }
    };

    async updateBefDataByRcAndAadharHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no || !data?.user_id) return { code: 422, message: "Aadhar and user id is mandatory." }
            data.type = "otherBenificiary";
            data.order_number = await createUniqueIdBasedOnCodes(data?.user_id);
            data.details = "rc";
            data.applicationStatus = "Completed";
            let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(data);
            if (!checkAadharDataByHash) return { code: 422, message: "Update Failed." };
            await this.OtherBenfRepo.updateBefDataByAadhar(data);
            return { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            Logger.error("OtherBenfServices === updateBefDataByRcAndAadharHash", e);
            return e;
        }
    };

    async addKutumbaRcDetails(data: rc_data) {
        try {
            if (!data?.rc_no) return { code: 422, message: "RC Field Required." };
            let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
            if (getData == 422) return { code: 422, message: "Access Denied From Kutumba." }
            let checkRcById = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
            if (checkRcById?.length == 0) {
                for (let i = 1; i <= getData.length; i++) {
                    let reqBody = await spectclesAPiReusetData(data, getData[i - 1], "rc");
                    await this.OtherBenfRepo.createRcDataOfEach(reqBody);
                }
                return { message: "Data saved." };
            } else {
                (getData || [])?.map(async obj => {
                    let reqBody = await spectclesAPiReusetData(data, obj, "rc");
                    await this.OtherBenfRepo.updateRcDataBYEach(reqBody);
                });
                return { message: "Data saved." };
            };
        } catch (e) {
            Logger.error("OtherBenfServices === addKutumbaRcDetails", e);
            return e;
        }
    }

    async updateBefDataByAadhar(data: other_benf_data) {
        try {
            if (!data?.aadhar_no || !data.user_id) return { code: 422, message: "Aadhar_no and user id is mandatory." };
            data.type = "otherBenificiary";
            data.details = "aadhar";
            data.applicationStatus = "Completed";
            data.aadhar_no = await aadharConvert(data.aadhar_no);
            let result = await this.OtherBenfRepo.getDataByAadharHashAndUser(data);
            if (!result) return { code: 422, message: "Update Failed" };
            await this.OtherBenfRepo.updateBefDataByAadhar(data);
            return { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            Logger.error("OtherBenfServices === updateBefDataByAadhar", e);
            return e;
        }
    }

    async getDataByRcNo(data: rc_data) {
        try {
            if (!data?.rc_no) return { code: 422, message: "Rc no is mandatory." };
            let result = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
            result.map(obj => (obj.phone_number.length == 10) ? obj.phone_number = "Yes" : obj.phone_number = "No");
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            Logger.error("OtherBenfServices === getDataByRcNo", e);
            return e;
        }
    };

    async getDataByAadharHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no) return { code: 422, message: "aadhar_no is mandatory." };
            let result = await this.OtherBenfRepo.getDataByAadharHash(await aadharConvert(data.aadhar_no));
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            console.log("OtherBenfServices === getDataByAadharHash", e);
            return e;
        }
    };

    async sendOtpByAadharAndHash(data: other_benf_data) {
        try {

            if (!data?.aadhar_no && !data.user_id) return { code: 422, message: "Aadhar no is required." };
            let checkRcDataWith__rc = await this.OtherBenfRepo.__checkAadharWithRcTable(data);
            if (!checkRcDataWith__rc) return { code: 422, message: "Access Denied." };
            let checkAadharWith_Other = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
            if (data['case'] == "Yes") {
                let res = await this.KutumbaFunction.getDataFromEkycOutSource(checkAadharWith_Other);
                return (res == 422) ? { code: 422, message: "Access Denied From DBT." } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
            }
            // let checkDuplicateWithSats = await this.OtherBenfRepo.checkDuplicatesWithSats(checkAadharWith_Other);
            // if(checkDuplicateWithSats) return { code:422,  message: `You Are Already Applied In School. This Is Your ${checkDuplicateWithSats.order_number}`};
            if (checkAadharWith_Other) {
                if (checkAadharWith_Other?.ekyc_check == "N") {
                    checkAadharWith_Other.phone_number = checkRcDataWith__rc?.phone_number
                    if (checkAadharWith_Other?.phone_number?.length !== 10) {
                        let res = await this.KutumbaFunction.getDataFromEkycOutSource(checkAadharWith_Other);
                        await this.OtherBenfRepo.UpdateOtpInOtherBenficiary(checkAadharWith_Other);
                        return (res == 422) ? { code: 422, message: "Access Denied From DBT." } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
                    } else {
                        checkAadharWith_Other['otp'] = generateOTP();
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(checkAadharWith_Other?.phone_number, checkAadharWith_Other.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.OtherBenfRepo.UpdateOtpInOtherBenficiary(checkAadharWith_Other);
                        return { message: RESPONSEMSG.OTP, data: {} };
                    }
                } else {
                    return { code: 422, message: "Already Registered." }
                }
            } else {
                let finalData = await this.OtherBenfRepo.updateDataByRcAndHashUniAadharHas__(data);
                finalData['otp'] = generateOTP();
                finalData['order_number'] = await createUniqueIdBasedOnCodes(data?.user_id);
                if (finalData?.phone_number?.length !== 10) {
                    await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(finalData);
                    let res = await this.KutumbaFunction.getDataFromEkycOutSource(finalData);
                    return (res == 422) ? { code: 422, message: "Access Denied From DBT." } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
                } else {
                    let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData?.phone_number, finalData.otp);
                    if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                    await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(finalData);
                    return { message: RESPONSEMSG.OTP, data: {} };
                }
            }
        } catch (e) {
            Logger.error("OtherBenfServices === sendOtpByAadharAndHash", e);
            return e;
        }
    }

    async checkOtpByAadharAndHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && data.aadhar_no) return { code: 422, message: "Aadhar And ID Required." };
            let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
            if (!checkRcById) return { code: 422, message: "Data not exists." }
            let checkOtp = data?.otp == checkRcById.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE }
        } catch (e) {
            Logger.error("OtherBenfServices === checkOtpByAadharAndHash", e);
            return e;
        }
    }

    async getBenificaryStatus(data: other_benf_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "User id are mandatory." };
            let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: "Data not exists" };
            return await this.OtherBenfRepo.getBenificaryStatus(data);
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async statusWiseData(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id) return { code: 422, message: "Id is mandatory." };
            return await this.OtherBenfRepo.getBenificaryStatus(data.user_id);
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async statusDataByIdWith(data: other_benf_data) {
        try {
            if (!data?.user_id && !data.aadhar_no) return { code: 422, message: "User id and aadhar no are mandatory." };
            let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: "Data not exists" };
            return await this.OtherBenfRepo.statusDataByIdWith(data);
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async getRcBasedOnAadharData(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && !data.user_id) return { code: 422, message: "Aadhar And Id Required." };
            let checkUser = await this.OtherBenfRepo.getRcBasedOnAadharDataUniId(data);
            if (checkUser.length == 0) return { code: 422, message: "Data not exists" }
            return checkUser;
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async readyTODeliver(data: other_benf_data) {
        try {
            if (data.phone_number.length !== 10) return { code: 422, message: "Enter valid number." }
            if (!data?.phone_number || !data?.benf_unique_id) return { code: 422, message: "Id and phone number is mandatory." };
            let checkBenfUniqId = await this.OtherBenfRepo.checkBenfUniId(data.benf_unique_id);
            if (!checkBenfUniqId) return { code: 422, message: "Data not exists" };
            let sixDigitsOtp = generateOTP();
            let smsSend = await this.ResusableFunctions.sendOtpAsSingleSms(data.phone_number, sixDigitsOtp);
            if (smsSend !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            data.otp = sixDigitsOtp;
            await this.OtherBenfRepo.readyTODeliver(data);
            return { message: RESPONSEMSG.OTP };
        } catch (e) {
            Logger.error("OtherBenfServices === readyTODeliver", e);
            return e;
        }
    };

    async deliverOtpCheck(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id || !data.otp) return { code: 422, message: "Id and otp is mandatory." };
            let checkBenByUniId = await this.OtherBenfRepo.checkBenByUniqueId(data);
            if (!checkBenByUniId) return { code: 422, message: "Data not exists." };
            let checkOtp = data?.otp == checkBenByUniId.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE }
        } catch (e) {
            Logger.error("OtherBenfServices === deliverOtpCheck", e);
            return e;
        }
    };

    async pendingToReady(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id) return { code: 422, message: "Id is mandatory." };
            let result = await this.OtherBenfRepo.pendingToReady(data);
            return (result == 422) ? { code: 422, message: "Data not exist" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            console.log("OtherBenfServices === pendingToReady", e);
            return e;
        }
    };

    async updateBenificaryEachID(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id) return { code: 422, message: "Id is mandatory." };
            let result = await this.OtherBenfRepo.updateBenificaryEachID(data);
            return (result == 422) ? { code: 422, message: "Data not exist" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            console.log("OtherBenfServices === updateBenificaryEachID", e);
            return e;
        };
    };

    async getEkycDataFromEkyc(data: other_benf_data) {
        try {
            if (!data?.aadhar_no) return { code: 422, status: "Failed", message: "Aadhar no is mandatory." };
            if (data?.aadhar_no.length > 20) {
                let ekycData = await this.OtherBenfRepo.getEkycDataFromEkyc(data?.aadhar_no);
                let kutumbaData = await this.OtherBenfRepo.getDataOnlyAadharFromKutumba(data?.aadhar_no);
                if (kutumbaData == 422) return { code: 422, message: "Access Denied Form Kutumba." };
                if (ekycData == 422) return { code: 422, message: "Access Denied Form EKYC." };
                if (ekycData.finalStatus != "S") return { code: 422, status: "Failed", message: "Ekyc Authentication Failed." };
                if (ekycData.aadhaarHash.toLowerCase() != kutumbaData?.aadhar_no?.toLowerCase()) return { code: 422, status: "Failed", message: "Aadhar Hash Not Matching." };
                await this.OtherBenfRepo.updateEkycStatusInBenf(data?.aadhar_no)
                return { code: 200, status: "Success", message: "Ekyc Completed Successfully." };
            } else {
                let convertAadhar = await convertAadharToSha256Hex(data.aadhar_no);
                let convertUpperCaseAadhar = convertAadhar.toLowerCase();
                let ekycData = await this.OtherBenfRepo.getEkycDataFromEkyc(convertUpperCaseAadhar);
                let kutumbaData = await this.OtherBenfRepo.getDataOnlyAadharFromKutumba(convertAadhar);
                if (kutumbaData == 422) return { code: 422, message: "Access Denied Form Kutumba." };
                if (ekycData == 422) return { code: 422, message: "Access Denied Form EKYC." };
                if (ekycData.finalStatus != "S") return { code: 422, status: "Failed", message: "Ekyc Authentication Failed." };
                console.log("ekycData.aadhaarHash.toLowerCase() != kutumbaData?.aadhar_no?.toLowerCase()", ekycData.aadhaarHash.toLowerCase(), kutumbaData?.aadhar_no?.toLowerCase())
                if (ekycData.aadhaarHash.toLowerCase() != kutumbaData?.aadhar_no?.toLowerCase()) return { code: 422, status: "Failed", message: "Aadhar Hash Not Matching." };
                await this.OtherBenfRepo.updateEkycStatusInBenf(convertAadhar)
                return { code: 200, status: "Success", message: "Ekyc Completed Successfully." };
            }
        } catch (e) {
            Logger.error("OtherBenfServices === getEkycDataFromEkyc", e);
            return e;
        }
    };

    async getBenificaryHistory(data: other_benf_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "User id is mandatory." };
            let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: "Data not exists" };
            let result = await this.OtherBenfRepo.getBenificaryHistory(data.user_id);
            return (result == 422) ? { code: 422, message: "Data not exists" } : result;
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };

    async otpSentToENteredNumber(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && !data.phone_number) return { code: 422, status: "Failed", message: "Aadhar no is mandatory." };
            data.aadhar_no = (data?.aadhar_no.length > 20) ? await convertAadharToSha256Hex(data.aadhar_no) : data.aadhar_no;
            let checkUserWithAadhar = await this.OtherBenfRepo.checkUserWithMobileWithAadhar(data);
            if (checkUserWithAadhar) {
                data.otp = generateOTP();
                let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
                if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                await this.OtherBenfRepo.updateOtpAndMobileNumber(data);
                return { message: RESPONSEMSG.OTP }
            } else {
                let checkUser = await this.OtherBenfRepo.checkUserWithMobile(data);
                if (checkUser) return { code: 422, message: "Mobile Number Already Registered." };
                data.otp = generateOTP();
                let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
                if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                await this.OtherBenfRepo.updateOtpAndMobileNumber(data);
            }
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };

    async otpValidateToENteredNumber(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && !data.phone_number) return { code: 422, status: "Failed", message: "Aadhar And Phone Number Is Required." };
            data.aadhar_no = (data?.aadhar_no.length > 20) ? await convertAadharToSha256Hex(data.aadhar_no) : data.aadhar_no;
            let result = await this.OtherBenfRepo.checkUserWithMobile(data);
            let checkOtp = result.otp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE }
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };
};