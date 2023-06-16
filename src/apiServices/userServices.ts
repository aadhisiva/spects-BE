import { Service } from "typedi";
import { UserRepo } from "../apiRepository/userRepo";
import { SMSServices, stringToFinalmessage } from "../utility/sms_otp";
import { login_user_data } from "../entity";
import { generateOTP } from "../utility/resusableFun";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { trackerCreateLogs } from "../utility/trackerLog";
import Logger from "../utility/winstonLogger";
import { RESPONSEMSG } from "../utility/statusCodes";
const fetch = require('node-fetch');


@Service()
export class UserServices {
    constructor(public UserRepo: UserRepo, public SMSServices: SMSServices, public ResusableFunctions: ResusableFunctions) { }

    // async postUserDAta(data: login_user_data, hitTime) {
    //     try {
    //         let sixDigitsOtp = generateOTP();
    //         if (data?.user_mobile_number) {
    //             data.otp = sixDigitsOtp;
    //             let mobile_no = data?.user_mobile_number;
    //             let checkMobile = await this.UserRepo.getUserByMobile(mobile_no);
    //             if (!checkMobile) {
    //                 let response = await this.UserRepo.postUser(data);
    //                 await trackerCreateLogs("ADD_USER", hitTime);
    //                 let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(data.user_mobile_number, data.otp);
    //                 if (sendSingleSms == 200) {
    //                     return Object.assign(response, { otpMessage: `Otp sent succussfully to xxxxxx${mobile_no.slice(6, 10)}` });
    //                 } else {
    //                     return Object.assign(response, { otpMessage: `Failed to sent otp` });
    //                 };
    //             } else {
    //                 return { code: 422, message: "Invalid mobile number." }
    //                 // await this.UserRepo.updateOtp(data);
    //                 // let updaetdData = await this.UserRepo.getUserByMobile(mobile_no);
    //                 // await trackerCreateLogs("UPDATE_USER", hitTime);
    //                 // let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(updaetdData.user_mobile_number, updaetdData.otp);
    //                 // if (sendSingleSms == 200) {
    //                 //     return Object.assign(updaetdData, { otpMessage: `Otp sent succussfully to xxxxxx${mobile_no.slice(6, 10)}` });
    //                 // } else {
    //                 //     return Object.assign(updaetdData, { otpMessage: `Failed to sent otp` });
    //                 // };
    //             }
    //         } else {
    //             return { code: 422, message: "mobilenumber is mandatory." }
    //         }
    //     } catch (e) {
    //         console.log("UserServices ====== postUser", e);
    //         Logger.error("UserServices ====== postUser", e);
    //         return e;
    //     }
    // };

    async addUser(data){
        return this.UserRepo.postUser(data);
    };

    async postUser(data: login_user_data, hitTime) {
        try {
            let sixDigitsOtp = generateOTP();
            if (data.user_mobile_number.length !== 10) {
                return { code: 422, message: "Enter valid number." }
            }
            if (data?.user_mobile_number) {
                data.otp = sixDigitsOtp;
                let mobile_no = data?.user_mobile_number;
                let checkMobile = await this.UserRepo.getUserByMobile(mobile_no);
                console.log("checmo", checkMobile[0].user_mobile_number)
                await trackerCreateLogs("ADD_USER", hitTime);
                if (checkMobile.length == 0) {
                    return { code: 422, message: "Invalid mobile number." }
                } else {
                    let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(checkMobile[0].user_mobile_number, data.otp);
                    await this.UserRepo.updateOtp(data);
                    if (sendSingleSms == 200) {
                        return { message: RESPONSEMSG.OTP, data: checkMobile }
                    } else {
                        return { code: 422, message: RESPONSEMSG.OTP_FAILED }
                    }
                }
            } else {
                return { code: 422, message: "mobilenumber is mandatory." }
            }
        } catch (e) {
            console.log("UserServices ====== postUser", e);
            Logger.error("UserServices ====== postUser", e);
            return e;
        }
    }

    async validateUser(data, hitTime) {
        try {
            if (data?.user_mobile_number.length !== 10) {
                return { code: 422, message: "Enter valid number." }
            }
            let result = await this.UserRepo.getUserByMobileObj(data.user_mobile_number);
            await trackerCreateLogs("VALIDATE_OTP", hitTime);
            let checkOtp = data?.otp == result.otp;
            if (checkOtp) {
                return { message: RESPONSEMSG.VALIDATE };
            } else {
                return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
            }
        } catch (e) {
            console.log("UserServices ====== validateUser", e);
            Logger.error("UserServices ====== validateUser", e);
            return e;
        }
    };

    async resendOtp(data: login_user_data, hitTime) {
        try {
            let sixDigitsOtp = generateOTP();
            data.otp = sixDigitsOtp;
            if (data.user_mobile_number.length !== 10) {
                return { code: 422, message: "Enter valid number." }
            }
            if (data?.user_mobile_number) {
                let updatedData = await this.UserRepo.getUserByMobileObj(data.user_mobile_number);
                let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(updatedData.user_mobile_number, updatedData.otp)
                await this.UserRepo.updateOtp(data);
                await trackerCreateLogs("RESEND_OTP", hitTime);
                if (sendSingleSms == 200) {
                    return { message: RESPONSEMSG.OTP };
                } else {
                    return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                };
            } else {
                return { code: 422, message: "Mobile number is mandtory." }
            }
        } catch (e) {
            console.log("UserServices ====== validateUser", e);
            Logger.error("UserServices ====== validateUser", e);
            return e;
        }
    };
}