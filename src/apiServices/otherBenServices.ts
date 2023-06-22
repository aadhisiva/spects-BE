import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { school_data } from "../entity";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { OtherBenfRepo } from "../apiRepository/otherBenRepo";
import { KutumbaDetails, convertAadharToSha256Hex } from "../utility/kutumbaDetails";
import { other_benf_data } from "../entity/other_benf_data";
import { getAgeFromBirthDate } from "../utility/resusableFun";
import { generateOTP } from "../utility/resusableFun";
import { RESPONSEMSG } from "../utility/statusCodes";
import { Methods, Tables } from "../utility/constants";
import { trackExternalLogs } from "../utility/trackerLog";
import { rc_data } from "../entity/rc_data";

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
    reqBody.aadhar_no = type == "rc" ? getData?.MBR_AADHAR_HASH : await aadharConvert(data.aadhar_no);
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
            if (data?.aadhar_no && data.user_id) {
                let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
                if (getData == 422) {
                    return { code: 422, message: "Third party api is not working." }
                }
                let reqBody: any = await spectclesAPiReusetData(data, getData[0], "aadhar");
                reqBody.user_id = data.user_id;
                let checkOnlyAadharHash = await this.OtherBenfRepo.checkOnlyAadharHash(reqBody);
                if (checkOnlyAadharHash) {
                    let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(reqBody);
                    if (!checkAadharDataByHash) {
                        return { code: 422, message: "Aadhar no is already registered." }
                    } else {
                        let updatedData = await this.OtherBenfRepo.updateBefDataByAadhar(reqBody);
                        let res = await this.KutumbaFunction.getDataFromEkycOutSource(updatedData);
                        return (res == 422) ? { code: 422, message: "Something went wrong in HSM DB." } : res;
                    }
                } else {
                    let getAllCount = await this.OtherBenfRepo.findAll();
                    let checkUndefined = (getAllCount[0]?.benf_unique_id == undefined) ? 0 : getAllCount[0]?.benf_unique_id;
                    reqBody.benf_unique_id = `${Number(checkUndefined) + 1}`;
                    reqBody.order_number = generateOTP();
                    let addrResult = await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(reqBody);
                    let res = await this.KutumbaFunction.getDataFromEkycOutSource(addrResult);
                    return (res == 422) ? { code: 422, message: "Something went wrong in HSM DB." } : res;
                };
            } else {
                return { code: 422, message: "Aadhar number and user id required." }
            }
        } catch (e) {
            console.log("OtherBenfServices === addKutumbaAaadharDetails", e);
            return e;
        }
    };

    async updateBefDataByRcAndAadharHash(data: other_benf_data) {
        try {
            if (data?.aadhar_no && data?.user_id) {
                let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(data);
                if (!checkAadharDataByHash) {
                    return { code: 422, message: "Update Failed." }
                } else {
                    await this.OtherBenfRepo.updateBefDataByAadhar(data);
                    return { message: RESPONSEMSG.UPDATE_SUCCESS };
                }
            } else {
                return { code: 422, message: "Aadhar and user id is mandatory." }
            };
        } catch (e) {
            console.log("OtherBenfServices === updateBefDataByRcAndAadharHash", e);
            return e;
        }
    };

    // async updateBefDataByRcAndAadharHash(data: other_benf_data) {
    //     try {
    //         if (data.aadhar_no && data.user_id) {
    //             let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
    //             let [result, finalData] = await this.OtherBenfRepo.updateDataByRcAndHashUniId(data);
    //             if (result) {
    //                 if (!checkRcById) {
    //                     await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(finalData);
    //                     return { message: RESPONSEMSG.UPDATE_SUCCESS };
    //                 } else {
    //                     let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(finalData);
    //                     if (!checkAadharDataByHash) {
    //                         return { code: 422, message: "Aadhar no is already registered.." }
    //                     } else {
    //                         await this.OtherBenfRepo.updateBefDataByAadhar(finalData);
    //                         return { message: RESPONSEMSG.UPDATE_SUCCESS };
    //                     }
    //                 }
    //             } else {
    //                 return { code: 422, message: "Data not exists in rc table." }
    //             }
    //         } else {
    //             return { code: 422, message: "Aadhar and user id is mandatory." }
    //         };
    //     } catch (e) {
    //         console.log("OtherBenfServices === updateBefDataByRcAndAadharHash", e);
    //         return e;
    //     }
    // };


    async addKutumbaRcDetails(data: rc_data) {
        try {
            if (data?.rc_no) {
                let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
                if (getData == 422) {
                    return { code: 422, message: "Third party api is not working." }
                }
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
            } else {
                return { code: 422, message: "Rc number is mandatory." }
            }
        } catch (e) {
            console.log("OtherBenfServices === addKutumbaRcDetails", e);
            return e;
        }
    }

    async updateBefDataByAadhar(data: other_benf_data) {
        try {
            if (data?.aadhar_no && data.user_id) {
                data.aadhar_no = await aadharConvert(data.aadhar_no);
                let result = await this.OtherBenfRepo.getDataByAadharHashAndUser(data);
                if (!result) {
                    return { code: 422, message: "Update Failed" };
                } else {
                    await this.OtherBenfRepo.updateBefDataByAadhar(data);
                    return { message: RESPONSEMSG.UPDATE_SUCCESS };
                }
            } else {
                return { code: 422, message: "Aadhar_no and user id is mandatory." }
            }
        } catch (e) {
            console.log("OtherBenfServices === updateBefDataByAadhar", e);
            return e;
        }
    }

    async getDataByRcNo(data: rc_data) {
        try {
            if (data?.rc_no) {
                let result = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
                result.map(obj => (obj.phone_number.length == 10) ? obj.phone_number = "Yes" : obj.phone_number = "No");
                return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
            } else {
                return { code: 422, message: "Rc no is mandatory." }
            }
        } catch (e) {
            console.log("OtherBenfServices === getDataByRcNo", e);
            return e;
        }
    };

    async getDataByAadharHash(data: other_benf_data) {
        try {
            if (data?.aadhar_no) {
                let result = await this.OtherBenfRepo.getDataByAadharHash(await aadharConvert(data.aadhar_no));
                return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
            } else {
                return { code: 422, message: "aadhar_no is mandatory." }
            }
        } catch (e) {
            console.log("OtherBenfServices === getDataByAadharHash", e);
            return e;
        }
    };

    async sendOtpByAadharAndHash(data: other_benf_data) {
        try {
            // if (data.aadhar_no) {
            //     let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
            //     if (!checkRcById) {
            //         return { code: 422, message: "Data not exist." }
            //     }
            //     if (!checkRcById.phone_number) {
            //         return { code: 422, message: "Phone number is null." }
            //     } else {
            //         let sixDigitsOtp = generateOTP();
            //         data.otp = sixDigitsOtp;
            //         let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(checkRcById.phone_number, data.otp);
            //         if (smsOtp !== 200) {
            //             return { code: 422, message: RESPONSEMSG.OTP_FAILED }
            //         } else {
            //             await this.OtherBenfRepo.updateDataByRcAndHashUniAadharHash(data);
            //             return { message: RESPONSEMSG.OTP };
            //         }
            //     }


            // } else {
            //     return { code: 422, message: "Aadhar no is required." }
            // };

            if (!data?.aadhar_no) return { code: 422, message: "Aadhar no is required." };
            let checkRcDataWith__Aadhar = await this.OtherBenfRepo.__checkAadharWithRcTable(data);
            if (!checkRcDataWith__Aadhar) return { code: 422, message: "Data not Exists." };
            let checkAadharWith_Other = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
            let finalData = await this.OtherBenfRepo.updateDataByRcAndHashUniAadharHas__(data);
            finalData['otp'] = generateOTP();
            if (!checkAadharWith_Other) {
                let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(checkAadharWith_Other.phone_number, finalData.otp);
                if (smsOtp !== 200) {
                    return { code: 422, message: RESPONSEMSG.OTP_FAILED }
                } else {
                    await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(finalData);
                    return { message: RESPONSEMSG.OTP };
                }
            } else {
                let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(finalData);
                if (!checkAadharDataByHash) {
                    return { code: 422, message: "Aadhar no is already registered.." }
                } else {
                    let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(checkAadharWith_Other.phone_number, finalData.otp);
                    if (smsOtp !== 200) {

                    } else {
                        await this.OtherBenfRepo.updateOnlyDataInOther({aadhar_no: finalData?.aadhar_no, otp: finalData?.otp});
                        return { message: RESPONSEMSG.OTP };
                    }
                }
            }
        } catch (e) {
            console.log("OtherBenfServices === sendOtpByAadharAndHash", e);
            return e;
        }
    }

    async checkOtpByAadharAndHash(data: other_benf_data) {
        try {
            if (data.aadhar_no) {
                let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
                if (!checkRcById) {
                    return { code: 422, message: "Data not exists." }
                } else {
                    let checkOtp = data?.otp == checkRcById.otp;
                    if (checkOtp) {
                        return { message: RESPONSEMSG.VALIDATE }
                    } else {
                        return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
                    }
                }
            } else {
                return { code: 422, message: "Aadhar no is required." }
            };
        } catch (e) {
            console.log("OtherBenfServices === checkOtpByAadharAndHash", e);
            return e;
        }
    }

    async getBenificaryStatus(data: other_benf_data) {
        try {
            if (data?.user_id) {
                let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
                if (!checkUser) return { code: 422, message: "Data not exists" };
                return await this.OtherBenfRepo.getBenificaryStatus(data.user_id);
            } else {
                return { code: 422, message: "User id are mandatory." }
            };
        } catch (e) {
            console.log("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async getRcBasedOnAadharData(data: other_benf_data) {
        try {
            if (data?.benf_unique_id) {
                let checkUser = await this.OtherBenfRepo.getRcBasedOnAadharDataUniId(data);
                if (checkUser.length == 0) return { code: 422, message: "Data not exists" }
                return checkUser;
            } else {
                return { code: 422, message: "Benf id is mandatory." }
            };
        } catch (e) {
            console.log("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async readyTODeliver(data: other_benf_data) {
        try {
            if (data.phone_number.length !== 10) {
                return { code: 422, message: "Enter valid number." }
            }
            if (data?.phone_number && data.benf_unique_id) {
                let checkBenfUniqId = await this.OtherBenfRepo.checkBenfUniId(data.benf_unique_id);
                if (!checkBenfUniqId) return { code: 422, message: "Data not exists" };
                let sixDigitsOtp = generateOTP();
                let smsSend = await this.ResusableFunctions.sendOtpAsSingleSms(data.phone_number, sixDigitsOtp);
                if (smsSend == 200) {
                    data.otp = sixDigitsOtp;
                    await this.OtherBenfRepo.readyTODeliver(data);
                    return { message: RESPONSEMSG.OTP };
                } else {
                    return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                }
            } else {
                return { code: 422, message: "Id and phone number is mandatory." };
            };
        } catch (e) {
            console.log("OtherBenfServices === readyTODeliver", e);
            return e;
        }
    };

    async deliverOtpCheck(data: other_benf_data) {
        try {
            if (data?.benf_unique_id && data.otp) {
                let checkBenByUniId = await this.OtherBenfRepo.checkBenByUniqueId(data);
                if (!checkBenByUniId) return { code: 422, message: "Data not exists." };
                let checkOtp = data?.otp == checkBenByUniId.otp;
                if (checkOtp) {
                    return { message: RESPONSEMSG.VALIDATE }
                } else {
                    return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
                }
            } else {
                return { code: 422, message: "Id and otp is mandatory." };
            };
        } catch (e) {
            console.log("OtherBenfServices === deliverOtpCheck", e);
            return e;
        }
    };

    async pendingToReady(data: other_benf_data) {
        try {
            if (data?.benf_unique_id) {
                let result = await this.OtherBenfRepo.pendingToReady(data);
                return (result == 422) ? { code: 422, message: "Data not exist" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
            } else {
                return { code: 422, message: "Id is mandatory." }
            };
        } catch (e) {
            console.log("OtherBenfServices === updateBenificaryEachID", e);
            return e;
        }
    };

    async updateBenificaryEachID(data: other_benf_data) {
        try {
            if (data?.benf_unique_id) {
                let result = await this.OtherBenfRepo.updateBenificaryEachID(data);
                return (result == 422) ? { code: 422, message: "Data not exist" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
            } else {
                return { code: 422, message: "Id is mandatory." }
            };
        } catch (e) {
            console.log("OtherBenfServices === updateBenificaryEachID", e);
            return e;
        };
    };

    async getEkycDataFromEkyc(data: other_benf_data) {
        try {
            if (data?.aadhar_no) {
                let convertAadhar = await convertAadharToSha256Hex(data.aadhar_no);
                let convertUpperCaseAadhar = convertAadhar.toUpperCase();
                let ekycData = await this.OtherBenfRepo.getEkycDataFromEkyc(convertUpperCaseAadhar);
                let kutumbaData = await this.OtherBenfRepo.getDataOnlyAadharFromKutumba(convertAadhar);
                if (ekycData == 422 || kutumbaData == 422) {
                    return { code: 500, message: "Failed" };
                } else if (ekycData.finalStatus != "S") {
                    return { code: 422, message: "Ekyc Failed." }
                } else if (ekycData.aadhaarHash.toUpperCase() != kutumbaData.aadhar_no) {
                    return { code: 422, message: "Aadhar hash not matching." }
                } else {
                    // update ekyc "yes in other benf data ---------- hereeeee
                    await this.OtherBenfRepo.updateEkycStatusInBenf(convertAadhar)
                    return { message: "Ekyc completed successfully." }
                }
            } else {
                return { code: 422, message: "Aadhar no is mandatory." }
            };
        } catch (e) {
            console.log("OtherBenfServices === updateBenificaryEachID", e);
            return e;
        }
    };

    async getBenificaryHistory(data: other_benf_data) {
        try {
            if (data?.user_id) {
                let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
                if (!checkUser) return { code: 422, message: "Data not exists" };
                let result = await this.OtherBenfRepo.getBenificaryHistory(data.user_id);
                return (result == 422) ? { code: 422, message: "Data not exists" } : result;
            } else {
                return { code: 422, message: "User id is mandatory." }
            };
        } catch (e) {
            console.log("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };
};