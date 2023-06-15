import { Service } from "typedi";
import { UserRepo } from "../apiRepository/userRepo";
import { SMSServices, stringToFinalmessage } from "../utility/sms_otp";
import { login_user_data } from "../entity";
import { generateOTP } from "../utility/resusableFun";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { trackerCreateLogs } from "../utility/trackerLog";
const fetch = require('node-fetch');


@Service()
export class UserServices {
    constructor(public UserRepo: UserRepo, public SMSServices: SMSServices, public ResusableFunctions: ResusableFunctions) { }

    async postUser(data: login_user_data, hitTime) {
        let sixDigitsOtp = generateOTP();
        if (data?.user_mobile_number) {
            data.otp = sixDigitsOtp;
            let mobile_no = data?.user_mobile_number;
            let checkMobile = await this.UserRepo.getUserByMobile(mobile_no);
            if (!checkMobile) {
                let response = await this.UserRepo.postUser(data);
                await trackerCreateLogs("ADD_USER", hitTime);
                let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(data.user_mobile_number, data.otp);
                if (sendSingleSms == 200) {
                    return Object.assign(response, { otpMessage: `Otp sent succussfully to xxxxxx${mobile_no.slice(6, 10)}` });
                } else {
                    return Object.assign(response, { otpMessage: `Failed to sent otp` });
                };
            } else {
                await this.UserRepo.updateOtp(data);
                let updaetdData = await this.UserRepo.getUserByMobile(mobile_no);
                await trackerCreateLogs("UPDATE_USER", hitTime);
                let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(updaetdData.user_mobile_number, updaetdData.otp);
                if (sendSingleSms == 200) {
                    return Object.assign(updaetdData, { otpMessage: `Otp sent succussfully to xxxxxx${mobile_no.slice(6, 10)}` });
                } else {
                    return Object.assign(updaetdData, { otpMessage: `Failed to sent otp` });
                };
            }
        } else {
            return { code: 422, message: "mobilenumber is mandatory." }
        }
    }

    async validateUser(data, hitTime) {
        let result = await this.UserRepo.getUserByMobile(data.user_mobile_number);
        await trackerCreateLogs("VALIDATE_OTP", hitTime);
        let checkOtp = data?.otp == result.otp;
        if (checkOtp) {
            return { otpMessage: "verfication successfylly.!" }
        } else {
            return { code: 422, message: "verification failed." }
        }
    };

    async resendOtp(data: login_user_data, hitTime) {
        let sixDigitsOtp = generateOTP();
        data.otp = sixDigitsOtp;
        if (data.user_mobile_number) {
            await this.UserRepo.updateOtp(data);
            let updaetdData = await this.UserRepo.getUserByMobile(data.user_mobile_number);
            let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(updaetdData.user_mobile_number, updaetdData.otp)
            await trackerCreateLogs("RESEND_OTP", hitTime);
            if (sendSingleSms == 200) {
                return { otpMessage: `Otp sent succussfully to xxxxxx${data.user_mobile_number.slice(6, 10)}` };
            } else {
                return { code: 422, otpMessage: `Failed to sent otp` };
            };
        } else {
            return { code: 422, message: "please try again." }
        }
    };

    async getUser(id) {
        let data = {
            user_mobile_number: "8884179067",
            otp: "234567"
        }
        // let result = await this.UserRepo.getUser(id);
        let res = await this.ResusableFunctions.sendOtpAsSingleUnicode(data.user_mobile_number, data.otp)
        return { message: res };
    }

    async getUserBySata(data) {
        try {
            let res = await fetch("http://172.31.27.59:8084/MHTWS/services/getSchoolData", {
                body: data,
                method: "post",
                headers: {
                    "Autherization": "QWxhZGRpbjpvcGVuIHNlc2FtZQ==",
                },
            });
            console.log("REs", res.json())
            return res;
        } catch (e) {
            console.log("e", e);
            return e;
        }
    }
}