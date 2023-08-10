import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { OtherBenfRepo } from "../apiRepository/otherBenRepo";
import { KutumbaDetails, convertAadharToSha256Hex } from "../utility/kutumbaDetails";
import { other_benf_data } from "../entity/other_benf_data";
import { createUniqueIdBasedOnCodes, getAgeFromBirthDate } from "../utility/resusableFun";
import { generateOTP } from "../utility/resusableFun";
import { RESPONSEMSG } from "../utility/statusCodes";
import { rc_data } from "../entity/rc_data";
import Logger from "../utility/winstonLogger";

const spectclesAPiReusetData = async (data, getData, type) => {
    let reqBody = new other_benf_data({});
    reqBody.age = getData?.MBR_DOB ? getAgeFromBirthDate(getData.MBR_DOB) : 0;
    reqBody.caste = getData?.MBR_CASTE ? getData.MBR_CASTE : "null";
    reqBody.rc_no = type == "rc" ? data?.rc_no : "null";
    reqBody.category = getData?.MBR_CASTE_CATEGORY ? getData.MBR_CASTE_CATEGORY : "null";
    reqBody.father_name = getData?.MBR_NPR_FATHER_NAME ? getData.MBR_NPR_FATHER_NAME : "null";
    reqBody.education_id = getData?.MBR_EDUCATION_ID ? getData.MBR_EDUCATION_ID : "null";
    reqBody.address = getData?.MBR_ADDRESS ? getData.MBR_ADDRESS : "null";
    reqBody.dob = getData?.MBR_DOB ? getData.MBR_DOB : "null";
    reqBody.aadhar_no = type == "rc" ? getData?.MBR_HASH_AADHAR : await aadharConvert(data.aadhar_no);
    reqBody.gender = getData?.MBR_GENDER ? getData.MBR_GENDER : "null";
    reqBody.phone_number = getData?.MBR_MOBILE_NO ? getData.MBR_MOBILE_NO : "null";
    reqBody.benf_name = getData?.MEMBER_NAME_ENG ? getData.MEMBER_NAME_ENG : "null";
    return reqBody;
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

    async addKutumbaAaadharDetails(data: other_benf_data) {
        try {
            if (!data?.aadhar_no || !data.user_id) return { code: 422, message: "Aadhar number and user id required." };
            let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
            if (getData == 422) return { code: 422, message: "Third party api is not working." }
            let reqBody: any = await spectclesAPiReusetData(data, getData[0], "aadhar");
            reqBody.user_id = data.user_id;
            let checkOnlyAadharHash = await this.OtherBenfRepo.checkOnlyAadharHash(reqBody);
            if (checkOnlyAadharHash) {
                return { code: 422, message: "Aadhar no is already registered." }
                // let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(reqBody);
                // if (!checkAadharDataByHash) return { code: 422, message: "Aadhar no is already registered." }
                //     let updatedData = await this.OtherBenfRepo.updateBefDataByAadhar(reqBody);
                //     let res = await this.KutumbaFunction.getDataFromEkycOutSource(updatedData);
                //     return (res == 422) ? { code: 422, message: "Something went wrong in HSM DB." } : res;
            } else {
                let getAllCount = await this.OtherBenfRepo.findAll();
                let checkUndefined = (getAllCount[0]?.benf_unique_id == undefined) ? 0 : getAllCount[0]?.benf_unique_id;
                reqBody.benf_unique_id = `${Number(checkUndefined) + 1}`;
                reqBody.order_number = await createUniqueIdBasedOnCodes(reqBody.user_id);;
                let addrResult = await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(reqBody);
                let res = await this.KutumbaFunction.getDataFromEkycOutSource(addrResult);
                return (res == 422) ? { code: 422, message: "Something went wrong in HSM DB." } : res;
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
            data.details = "rc";
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
            if (!data?.rc_no) return { code: 422, message: "Rc number is mandatory." };
            let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
            if (getData == 422) return { code: 422, message: "Third party api is not working." }
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
            if (data?.aadhar_no) return { code: 422, message: "aadhar_no is mandatory." };
            let result = await this.OtherBenfRepo.getDataByAadharHash(await aadharConvert(data.aadhar_no));
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            console.log("OtherBenfServices === getDataByAadharHash", e);
            return e;
        }
    };

    async sendOtpByAadharAndHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no) return { code: 422, message: "Aadhar no is required." };
            let checkRcDataWith__Aadhar = await this.OtherBenfRepo.__checkAadharWithRcTable(data);
            if (!checkRcDataWith__Aadhar) return { code: 422, message: "Data not Exists." };
            let checkAadharWith_Other = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
            let finalData = await this.OtherBenfRepo.updateDataByRcAndHashUniAadharHas__(data);
            finalData['otp'] = generateOTP();
            finalData['order_number'] = createUniqueIdBasedOnCodes(data?.user_id);
            if (!checkAadharWith_Other) {
                let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData?.phone_number, finalData.otp);
                if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(finalData);
                return { message: RESPONSEMSG.OTP };
            } else {
                // let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(finalData);
                // if (!checkAadharDataByHash) {
                return { code: 422, message: "Aadhar no is already registered.." }
                // } else {
                //     let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData.phone_number, finalData.otp);
                //     if (smsOtp !== 200)  return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                //         await this.OtherBenfRepo.updateOnlyDataInOther({aadhar_no: finalData?.aadhar_no, otp: finalData?.otp});
                //         return { message: RESPONSEMSG.OTP };
                // }
            }
        } catch (e) {
            Logger.error("OtherBenfServices === sendOtpByAadharAndHash", e);
            return e;
        }
    }

    async checkOtpByAadharAndHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no) return { code: 422, message: "Aadhar no is required." };
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
            return await this.OtherBenfRepo.getBenificaryStatus(data.user_id);
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async getRcBasedOnAadharData(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id) return { code: 422, message: "Benf id is mandatory." };
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
            let convertAadhar = await convertAadharToSha256Hex(data.aadhar_no);
            let convertUpperCaseAadhar = convertAadhar.toUpperCase();
            let ekycData = await this.OtherBenfRepo.getEkycDataFromEkyc(convertUpperCaseAadhar);
            let kutumbaData = await this.OtherBenfRepo.getDataOnlyAadharFromKutumba(convertAadhar);
            if (ekycData == 422 || kutumbaData == 422) {
                return { code: 500, status: "Failed", message: "Ekyc response is not getting." };
            } else if (ekycData.finalStatus != "S") {
                return { code: 422, status: "Failed", message: "Ekyc Respone Failed." }
            } else if (ekycData.aadhaarHash.toUpperCase() != kutumbaData.aadhar_no) {
                return { code: 422, status: "Failed", message: "Aadhar hash not matching." }
            } else {
                // update ekyc "yes in other benf data ---------- hereeeee
                await this.OtherBenfRepo.updateEkycStatusInBenf(convertAadhar)
                return { code: 200, status: "Success", message: "Ekyc completed successfully." }
            }
        } catch (e) {
            Logger.error("OtherBenfServices === updateBenificaryEachID", e);
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
};