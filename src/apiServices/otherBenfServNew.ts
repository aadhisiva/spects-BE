import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { KutumbaDetails, convertAadharToSha256Hex } from "../utility/kutumbaDetails";
import { other_benf_data } from "../entity/other_benf_data";
import { createUniqueIdBasedOnCodes, getAgeFromBirthDate, getAgeFromBirthDateToEkyc } from "../utility/resusableFun";
import { generateOTP } from "../utility/resusableFun";
import { RESPONSEMSG } from "../utility/statusCodes";
import Logger from "../utility/winstonLogger";
import { ekyc_data } from "../entity";
import { ACCESS_DENIED, COMPLETED, EKYC_ACCESS_DENIED, EKYC_SUCCESS, KUTUMBA_ACCESS_DENIED, PHONE_REGESTERED } from "../utility/constants";
import { NewBenfRepo } from "../apiRepository/otherBenfRepoNew";

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



const mappingNewBenfData = (mapData: ekyc_data, getData) => {
    let getOneArray = getData[0];
    if(getData !== 422){
        let reqBody = new other_benf_data({});
        reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDateToEkyc(mapData.ekyc_dob) : 0;
        reqBody.caste = getOneArray?.MBR_CASTE || "";
        reqBody.category = getOneArray.MBR_CASTE_CATEGORY || "";
        reqBody.father_name = mapData?.ekyc_co || "";
        reqBody.education_id = getOneArray?.MBR_EDUCATION_ID || "";
        reqBody.district = getOneArray?.LGD_DISTRICT_Name || "";
        reqBody.taluk = getOneArray?.LGD_TALUK_Name || "";
        reqBody.address = getOneArray?.MBR_ADDRESS || ""
        reqBody.dob = mapData?.ekyc_dob || "";
        reqBody.lgd_taluka = getOneArray?.LGD_TALUK_CODE || "";
        reqBody.lgd_district = getOneArray?.LGD_DISTRICT_CODE || "";
        reqBody.aadhar_no = mapData?.aadhaarHash;
        reqBody.gender = mapData?.ekyc_gender || "";
        reqBody.phone_number = getOneArray?.MBR_MOBILE_NO || "";
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
        reqBody.address = mapData?.ekyc_dist + " " + mapData?.ekyc_vtc + " " + mapData?.ekyc_street + " " + mapData?.ekyc_house + " " + mapData?.ekyc_loc + "," + mapData?.ekyc_pc || "";
        reqBody.aadhar_no = mapData?.aadhaarHash;
        reqBody.gender = mapData?.ekyc_gender || "";
        reqBody.benf_name = mapData?.ekyc_name || "";
        reqBody.benf_unique_id = mapData?.txnNo;
        return reqBody;
    }
};


const mappingRcDataWiseNewBenfData = (mapData: ekyc_data) => {
    let reqBody = new other_benf_data({});
    reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDateToEkyc(mapData.ekyc_dob) : 0;
    reqBody.father_name = mapData?.ekyc_co || "";
    reqBody.dob = mapData?.ekyc_dob || "";
    reqBody.district = mapData?.ekyc_dist || ""
    reqBody.gender = mapData?.ekyc_gender || "";
    reqBody.benf_name = mapData?.ekyc_name || "";
    return reqBody;
};


const aadharConvert = async (no) => {
    return await convertAadharToSha256Hex(no);
}

@Service()
export class NewOtherBenfServices {
    constructor(
        public NewBenfRepo: NewBenfRepo,
        public SMSServices: SMSServices,
        public ResusableFunctions: ResusableFunctions,
        public KutumbaFunction: KutumbaDetails
    ) { }

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
            let pullEkycData: any = await this.NewBenfRepo.FetchDataFromEkyc(uniqueId);
            if (!pullEkycData) return { code: 422, message: EKYC_ACCESS_DENIED };
            if (pullEkycData?.finalStatus == 'F') return { code: 422, message: pullEkycData.errorMessage, data: {} };
            let originBenfData: any = await this.NewBenfRepo.findDataOfLatestBenfData(pullEkycData?.aadhaarHash);

            // checking actual table
            if (originBenfData.applicationStatus == COMPLETED && originBenfData.ekyc_check == "Y")
                return { code: 422, message: `Already Registered With Order Number ${originBenfData.order_number}.` };

            let getData = await this.KutumbaFunction.KutumbaDetailsFrom({ aadhar_no: pullEkycData.aadhaarHash });
            let mapDataOtherBenfWise = mappingNewBenfData(pullEkycData, getData);
            console.log()
            mapDataOtherBenfWise.user_id = user_id;

            await this.NewBenfRepo.savingNewData(mapDataOtherBenfWise);
            let fetchData = await this.NewBenfRepo.fetchRcUserData(mapDataOtherBenfWise);
            let check = fetchData.scheme_eligability == "Yes";
            return { message: EKYC_SUCCESS, errorInfo: check ? "District Matching Failed." : "", data: fetchData };
        } catch (e) {
            return Logger.error("Other service ##addDataAfterEkyc", e);
        }
    };

    async updateAadharData(data: other_benf_data) {
        try {

            const { benf_unique_id, user_id } = data;
            if (!benf_unique_id && !user_id) return { code: 422, message: "ID And User ID Fields Required" };
            data.order_number = await createUniqueIdBasedOnCodes(data.user_id);
            data.type = "otherBenificiary";
            data.details = "aadhar";
            data.status = 'order_pending';
            data.applicationStatus = "Completed";
            await this.NewBenfRepo.updateAadharData(data);
            let findUser: any = await this.NewBenfRepo.findOneUserWithBenfId(data);
            let checkEducationId: any = await this.NewBenfRepo.checkEducationId(findUser.education_id);
            if (checkEducationId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.` };
            await await this.NewBenfRepo.saveOriginalBenf(findUser);
            return { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };

    /* rc data */
    async addRcDataAndGet(data) {
        try {
            if (!data?.rc_no) return { code: 422, message: "RC Field Required." };
            let checkRcById = await this.NewBenfRepo.getDataByRcNo(data.rc_no);
            if (checkRcById?.length == 0) {
                let getData = await this.KutumbaFunction.KutumbaDetailsFrom(data);
                if (getData == 422) return { code: 422, message: KUTUMBA_ACCESS_DENIED };

                for (let i = 1; i <= getData.length; i++) {
                    let reqBody = await spectclesAPiReusetData(data, getData[i - 1], "rc");
                    await this.NewBenfRepo.createRcDataByEach(reqBody);
                }

                let rcData: any = await this.NewBenfRepo.FatchRcData(data.rc_no);
                if (rcData.length == 0) return { code: 422, message: ACCESS_DENIED };
                (rcData || []).map(obj => (obj.phone_number.length == 10) ? obj.isPhoneNumber = "Yes" : obj.isPhoneNumber = "No");
                return rcData;
            } else {

                // (getData || [])?.map(async obj => {
                //     let reqBody = await spectclesAPiReusetData(data, obj, "rc");
                //     await this.NewBenfRepo.updateRcDataBYEach(reqBody);
                // });
                let rcData: any = await this.NewBenfRepo.FatchRcData(data.rc_no);
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
            let findOneMemberRC = await this.NewBenfRepo.findOneMemberInRC(benf_unique_id);
            if (!findOneMemberRC) return { code: 422, message: ACCESS_DENIED };
            let findOneMemberOther = await this.NewBenfRepo.findOneMemberInOther(findOneMemberRC.aadhar_no);
            if (findOneMemberOther) {
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
                if (findOneMemberOther.applicationStatus == COMPLETED && findOneMemberOther?.ekyc_check == "Y") return { code: 422, message: `Already Registered With Order Number ${findOneMemberOther?.order_number}` };

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
                    await this.NewBenfRepo.updateDataExistsRecord(findOneMemberOther);
                    return { message: RESPONSEMSG.RETRIVE_SUCCESS, data: { uniqueId: txnDateTime, Token: urlResult } };
                } else {
                    findOneMemberOther['otp'] = generateOTP();
                    let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(findOneMemberOther?.phone_number, findOneMemberOther.otp);
                    if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                    await this.NewBenfRepo.updateDataExistsRecord(findOneMemberOther);
                    return { message: RESPONSEMSG.OTP, data: {} };
                }
            } else {
                if (findOneMemberRC?.education_id) {
                    let checkinRcData = await this.NewBenfRepo.checkDuplicatesWithSats(findOneMemberRC);
                    if (checkinRcData) return { code: 422, message: `You Are Already Applied In School With Order Number ${checkinRcData.order_number}` };
                    let finalData = await this.NewBenfRepo.mapRcDataTOOtherBenf(findOneMemberRC);

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
                        await this.NewBenfRepo.addNewDataFromRC(finalData);
                        return { message: RESPONSEMSG.RETRIVE_SUCCESS, data: { uniqueId: txnDateTime, Token: urlResult } };
                    } else {
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData?.phone_number, finalData.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.NewBenfRepo.addNewDataFromRC(finalData);
                        return { message: RESPONSEMSG.OTP, data: {} };
                    };
                } else {
                    let finalData = await this.NewBenfRepo.mapRcDataTOOtherBenf(findOneMemberRC);

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
                        await this.NewBenfRepo.addNewDataFromRC(finalData);
                        return { message: RESPONSEMSG.RETRIVE_SUCCESS, data: { uniqueId: txnDateTime, Token: urlResult } };
                    } else {
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData?.phone_number, finalData.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.NewBenfRepo.addNewDataFromRC(finalData);
                        return { message: RESPONSEMSG.OTP, data: {} };
                    };
                }
            }
        } catch (e) {
            return Logger.error("Other service ##rcBasedOnNumberWise", e);
        }
    };

    async throughRcApply(reqBody) {
        try {
            const { benf_unique_id, user_id } = reqBody;
            if (!benf_unique_id && !user_id) return { code: 422, message: "Id Field Required." };
            let findOneMemberRC = await this.NewBenfRepo.findOneMemberInRC(benf_unique_id);
            if (!findOneMemberRC) return { code: 422, message: ACCESS_DENIED };
            let findOneMemberOther = await this.NewBenfRepo.findOneMemberInOther(findOneMemberRC.aadhar_no);

            // checking actual table
            let originBenfData: any = await this.NewBenfRepo.findDataOfLatestBenfData(findOneMemberRC?.aadhaarHash);
            if (originBenfData.applicationStatus == COMPLETED)
            return { code: 422, message: `Already Registered With Order Number ${originBenfData.order_number}.` };

            if (findOneMemberOther) {
                let fetchData = await this.NewBenfRepo.fetchRcUserData(findOneMemberOther);
                let check = fetchData.scheme_eligability == "Yes";
                return { message: EKYC_SUCCESS, errorInfo: check ? "District Matching Failed." : "", data: fetchData };
            } else {
                let finalData = await this.NewBenfRepo.mapRcDataTOOtherBenf(findOneMemberRC);
                finalData.user_id = user_id;
                await this.NewBenfRepo.addNewDataFromRC(finalData);
                let fetchData = await this.NewBenfRepo.fetchRcUserData(finalData);
                let check = fetchData.scheme_eligability == "Yes";
                return { message: RESPONSEMSG.RETRIVE_SUCCESS, errorInfo: check ? "District Matching Failed." : "", data : fetchData };
            }
        } catch (e) {
            return Logger.error("Other service ##rcBasedOnNumberWise", e);
        }
    };

    async otpCheckRcMember(data) {
        try {
            const { user_id, benf_unique_id, otp } = data;
            if (!user_id && !benf_unique_id && !otp) return { code: 422, message: "Id Field Required." }
            let getData = await this.NewBenfRepo.getAllDataByUserAndUnique(data);
            let checkOtp = getData.otp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
            let result = await this.NewBenfRepo.fetchRcUserData(data);
            return { message: RESPONSEMSG.VALIDATE, data: result }
        } catch (e) {
            return Logger.error("Other Service ####fetchRcUserData", e);
        }
    };

    async fetchRcUserData(data) {
        try {
            const { user_id, benf_unique_id } = data;
            if (!user_id && !benf_unique_id) return { code: 422, message: "Id Field Required." }
            return await this.NewBenfRepo.fetchRcUserData(data);
        } catch (e) {
            return Logger.error("Other Service ####fetchRcUserData", e);
        }
    };

    async updateRcAadharData(data: other_benf_data) {
        try {
            const { benf_unique_id, user_id } = data;
            if (!benf_unique_id && !user_id) return { code: 422, message: "ID And User ID Fields Required" };
            data.order_number = await createUniqueIdBasedOnCodes(data.user_id);
            data.type = "otherBenificiary";
            data.details = "rc";
            data.status = 'order_pending';
            data.applicationStatus = "Completed";
            await this.NewBenfRepo.updateAadharData(data);
            let findUser: any = await this.NewBenfRepo.findOneUserWithBenfId(data);
            let checkEducationId: any = await this.NewBenfRepo.checkEducationId(findUser.education_id);
            if (checkEducationId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.` };
            await this.NewBenfRepo.saveOriginalBenf(findUser);
            return { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };
    async ekycResutltCheck(data) {
        try {
            const { uniqueId, benf_unique_id, user_id } = data;
            if (!benf_unique_id && !uniqueId && !user_id) return { code: 422, message: "Id Field Required" };
            let pullEkycData: any = await this.NewBenfRepo.FetchDataFromEkyc(uniqueId);
            if (!pullEkycData) return { code: 422, message: EKYC_ACCESS_DENIED };
            if (pullEkycData?.finalStatus == "F") return { code: 422, message: pullEkycData.errorMessage };
            let pullBenfData: any = await this.NewBenfRepo.FetchDataFromOtherWithID(benf_unique_id);
            if (!pullBenfData) return { code: 422, message: ACCESS_DENIED };
            let checkAadharHas = pullEkycData?.aadhaarHash.toLowerCase() == pullBenfData?.aadhar_no.toLowerCase();
            if (!checkAadharHas) return { code: 422, message: "Hash Matching Failed." };
            pullBenfData.ekyc_check = 'Y';
            // let mapData = mappingRcDataWiseNewBenfData(pullEkycData);
            pullBenfData.benf_unique_id = benf_unique_id;
            await this.NewBenfRepo.updateOneRecordInOther(pullBenfData);
            let fetchData = await this.NewBenfRepo.fetchRcUserData(pullBenfData);
            return { message: EKYC_SUCCESS, data: fetchData };
        } catch (e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };

    async getBenfAllStatus(data: other_benf_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "Id Field Required." };
            let checkUser = await this.NewBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: ACCESS_DENIED };
            return await this.NewBenfRepo.getBenificaryStatus(data.user_id);
        } catch (e) {
            Logger.error("OtherBenfServices === getBenfAllStatus", e);
            return e;
        }
    }
    async eachStatusWise(data: other_benf_data) {
        try {
            const { benf_unique_id } = data;
            if (!benf_unique_id) return { code: 422, message: "Id Field Required." };
            return await this.NewBenfRepo.eachStatusWise(benf_unique_id);
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
            let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
            if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            await this.NewBenfRepo.updateDataWithBenfId(data);
            return { code: 422, message: RESPONSEMSG.OTP }
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async validateReadyToDeliverOtp(data: other_benf_data) {
        try {
            const { benf_unique_id } = data;
            if (!benf_unique_id) return { code: 422, message: "Id Field Required." };
            let getData = await this.NewBenfRepo.FetchDataFromOtherWithID(benf_unique_id);
            let checkOtp = getData.deliveredOtp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
            return { code: 422, message: RESPONSEMSG.VALIDATE }
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
            await this.NewBenfRepo.updateDataWithBenfId(data);
            return { message: RESPONSEMSG.UPDATE_SUCCESS }
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async otpSentToNewNumber(data: other_benf_data) {
        try {
            const { benf_unique_id, phone_number } = data;
            if (!benf_unique_id && !phone_number) return { code: 422, message: "Id And Number Field Required." };
            let findWithNoAndId = await this.NewBenfRepo.checkDataWithPhoneNumberAndId(data);
            if (findWithNoAndId) {
                data.otp = generateOTP();
                let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
                if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                await this.NewBenfRepo.updateDataWithPhoneAndId(data);
                return { message: RESPONSEMSG.OTP }
            } else {
                let findDataWithPhone = await this.NewBenfRepo.checkDataWithPhoneNumber(phone_number);
                if (findDataWithPhone) return { code: 422, message: PHONE_REGESTERED };
                let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
                if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                await this.NewBenfRepo.updateDataWithPhoneAndId(data);
                return { message: RESPONSEMSG.OTP }

            }
        } catch (e) {
            Logger.error("OtherBenfServices ####otpSentToNewNumber", e);
            return e;
        }
    };

    async validateWithNewNumber(data: other_benf_data) {
        try {
            const { benf_unique_id } = data;
            if (!benf_unique_id) return { code: 422, message: "Id Field Required." };
            let result = await this.NewBenfRepo.FetchDataFromOtherWithID(benf_unique_id);
            let checkOtp = result.otp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE }
        } catch (e) {
            Logger.error("OtherBenfServices ####validateWithNewNumber", e);
            return e;
        }
    };
    
    async getBenificaryHistory(data: other_benf_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "User Field Required." };
            let result = await this.NewBenfRepo.getBenfDevliverd(data.user_id);
            return (result == 422) ? { code: 422, message: "Data not exists" } : result;
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };


    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/

}