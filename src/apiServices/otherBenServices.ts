import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { school_data } from "../entity";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { OtherBenfRepo } from "../apiRepository/otherBenRepo";
import { KutumbaDetails, convertAadharToSha256Hex } from "../utility/kutumbaDetails";
import { other_benf_data } from "../entity/other_benf_data_";
import { getAgeFromBirthDate } from "../utility/resusableFun";
import { generateOTP } from "../utility/resusableFun";

const spectclesAPiReusetData = async (data, getData, type) => {
    let reqBody: any = {}
    reqBody['age'] = (getData && getData.MBR_DOB) ? getAgeFromBirthDate(getData.MBR_DOB) : 0;
    reqBody['caste'] = getData?.MBR_CASTE ? getData?.MBR_CASTE : "";
    reqBody['rc_no'] = type == "rc" ? data.rc_no : "";
    reqBody['category'] = getData?.MBR_CASTE_CATEGORY ? getData?.MBR_CASTE_CATEGORY : "";
    reqBody['father_name'] = getData?.MBR_NPR_FATHER_NAME ? getData?.MBR_NPR_FATHER_NAME : "";
    reqBody['education_id'] = getData?.MBR_EDUCATION_ID ? getData?.MBR_EDUCATION_ID : "";
    reqBody['address'] = getData?.MBR_ADDRESS ? getData?.MBR_ADDRESS : "";
    reqBody['dob'] = getData?.MBR_DOB ? getData?.MBR_DOB : "";
    reqBody['aadhar_no'] = type == "rc" ? getData.MBR_AADHAR_HASH : await aadharConvert(data.aadhar_no);
    reqBody['gender'] = getData?.MBR_GENDER ? getData?.MBR_GENDER : "";
    reqBody['phone_number'] = getData?.MBR_MOBILE_NO ? getData?.MBR_MOBILE_NO : "";
    reqBody['benf_name'] = getData?.MEMBER_NAME_ENG ? getData?.MEMBER_NAME_ENG : "";
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
            if (data?.aadhar_no && data.user_id) {
                let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
                let reqBody: any = await spectclesAPiReusetData(data, getData[0], "aadhar");
                reqBody.user_id = data.user_id;
                let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(reqBody);
                if (!checkAadharDataByHash) {
                    return await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(reqBody);
                } else {
                    await this.OtherBenfRepo.updateBefDataByAadhar(reqBody);
                    let response = await this.OtherBenfRepo.getDataByAadharHash(reqBody.aadhar_no);
                    return response;
                }
            } else {
                return { code: 422, message: "aadhar number and user id required." }
            }
        } catch (e) {
            console.log("addKutumbaAaadharDetails", e);
            return e;
        }
    }
    async addKutumbaRcDetails(data: other_benf_data) {
        try {
            if (data?.rc_no) {
                let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
                let checkRcById = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
                if (checkRcById?.length == 0) {
                    (getData || []).map(async obj => {
                        let reqBody = await spectclesAPiReusetData(data, obj, "rc");
                        await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(reqBody);
                    })
                } else {
                    (getData || []).map(async obj => {
                        let reqBody = await spectclesAPiReusetData(data, obj, "rc");
                        await this.OtherBenfRepo.updateDataByRcAndHash(reqBody);
                    })
                };
                let response = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
                return response;
            } else {
                return { code: 422, message: "rc number required." }
            }
        } catch (e) {
            console.log("addKutumbaAaadharDetails", e);
            return e;
        }
    }

    async updateBefDataByAadhar(data: other_benf_data) {
        try {
            if (data?.aadhar_no && data.user_id) {
                data.aadhar_no = await aadharConvert(data.aadhar_no);
                let result = await this.OtherBenfRepo.getDataByAadharHashAndUser(data);
                if (!result) {
                    return { code: 422, message: "data not exists." };
                } else {
                    return await this.OtherBenfRepo.updateBefDataByAadhar(data);
                }
            } else {
                return { code: 422, message: "aadhar_no and user id is mandatory." }
            }
        } catch (e) {
            console.log("updateBefDataByAadhar", e);
            return e;
        }
    }

    async getDataByRcNo(data: other_benf_data) {
        try {
            if (data?.rc_no) {
                let result = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
                return (result.length == 0) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "rc_no is mandatory." }
            }
        } catch (e) {
            console.log("updateBefDataByAadhar", e);
            return e;
        }
    };

    async getDataByAadharHash(data: other_benf_data) {
        try {
            if (data?.aadhar_no) {
                let result = await this.OtherBenfRepo.getDataByAadharHash(await aadharConvert(data.aadhar_no));
                return (!result) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "aadhar_no is mandatory." }
            }
        } catch (e) {
            console.log("updateBefDataByAadhar", e);
            return e;
        }
    };

    async sendOtpByAadharAndHash(data: other_benf_data) {
        try {
            if (data.rc_no && data.aadhar_no && data.user_id) {
                let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHash(data);
                if (!checkRcById) {
                    return { code: 422, message: "data not exists." }
                } else {
                    if (!checkRcById.phone_number) {
                        return { code: 422, message: "phone number can not be null." }
                    } else {
                        let sixDigitsOtp = generateOTP();
                        data.otp = sixDigitsOtp;
                        await this.ResusableFunctions.sendOtpAsSingleSms(checkRcById.phone_number, data.otp);
                        await this.OtherBenfRepo.updateDataByRcAndHash(data);
                        return {message: `otp sent successfully to ******${checkRcById.phone_number.slice(6,10)}`}
                    }
                }
            } else {
                return { code: 422, message: "aadhar,rc no's and user id are mandatory." }
            };
        } catch (e) {
            console.log("updateBefDataByRcAndAadharHash", e);
            return e;
        }
    }

    async checkOtpByAadharAndHash(data: other_benf_data) {
        try {
            if (data.rc_no && data.aadhar_no && data.user_id) {
                let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHash(data);
                console.log(checkRcById);
                if (!checkRcById) {
                    return { code: 422, message: "data not exists." }
                } else {
                    let checkOtp = data?.otp == checkRcById.otp;
                    if (checkOtp) {
                        return { otpMessage: "verfication successfylly.!" }
                    } else {
                        return { code: 422, message: "verification failed." }
                    }
                }
            } else {
                return { code: 422, message: "aadhar,rc no's and user id are mandatory." }
            };
        } catch (e) {
            console.log("updateBefDataByRcAndAadharHash", e);
            return e;
        }
    }

    async updateBefDataByRcAndAadharHash(data: other_benf_data) {
        try {
            if (data.rc_no && data.aadhar_no && data.user_id) {
                let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHash(data);
                if (!checkRcById) {
                    return { code: 422, message: "data not exists." }
                } else {
                    return await this.OtherBenfRepo.updateDataByRcAndHash(data);
                }
            } else {
                return { code: 422, message: "aadhar,rc no's and user id are mandatory." }
            };
        } catch (e) {
            console.log("updateBefDataByRcAndAadharHash", e);
            return e;
        }
    };

    async getBenificaryStatus(data: other_benf_data) {
        try {
            if (data?.user_id) {
                return await this.OtherBenfRepo.getBenificaryStatus(data.user_id);
            } else {
                return { code: 422, message: "user id are mandatory." }
            };
        } catch (e) {
            console.log("updateBefDataByRcAndAadharHash", e);
            return e;
        }
    };

    async getBenificaryHistory(data: other_benf_data) {
        try {
            if (data?.user_id) {
                return await this.OtherBenfRepo.getBenificaryHistory(data.user_id);
            } else {
                return { code: 422, message: "user id are mandatory." }
            };
        } catch (e) {
            console.log("updateBefDataByRcAndAadharHash", e);
            return e;
        }
    };
}