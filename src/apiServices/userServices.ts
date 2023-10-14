import { Service } from "typedi";
import { UserRepo } from "../apiRepository/userRepo";
import { SMSServices } from "../utility/sms_otp";
import { generateOTP } from "../utility/resusableFun";
import { ResusableFunctions } from "../utility/smsServceResusable";
import Logger from "../utility/winstonLogger";
import { RESPONSEMSG } from "../utility/statusCodes";


@Service()
export class UserServices {
    constructor(public UserRepo: UserRepo, public SMSServices: SMSServices, public ResusableFunctions: ResusableFunctions) { }

    async postUser(data) {
        try {
            let sixDigitsOtp = generateOTP();
            if (!data?.user_mobile_number) return { code: 422, message: "mobilenumber is mandatory." };
            if (data.user_mobile_number.length !== 10) return { code: 422, message: "Enter valid number." };
            data.otp = sixDigitsOtp;
            let mobile_no = data?.user_mobile_number;
            let checkMobile = await this.UserRepo.getUserByMobile(mobile_no);
            if (checkMobile?.length == 0) return { code: 422, message: "Data not exists." };
            let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(checkMobile[0]?.user_mobile_number, data.otp);
            await this.ResusableFunctions.sendSmsInKannadaUnicode(checkMobile[0]?.user_mobile_number, data.otp);
            await this.UserRepo.updateOtp(data);
            if (sendSingleSms !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            return { message: RESPONSEMSG.OTP, data: checkMobile };
        } catch (e) {
            Logger.error("UserServices ====== postUser", e?.message);
        }
    }

    async validateUser(data) {
        try {
            if (!data?.user_mobile_number || !data?.otp) return { code: 422, message: "mobilenumber and otp is mandatory." };
            if (data?.user_mobile_number.length !== 10) return { code: 422, message: "Enter valid number." };
            let result = await this.UserRepo.getUserByMobileObj(data.user_mobile_number);
            let checkOtp = data?.otp == result.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
            return { message: RESPONSEMSG.VALIDATE, data: result?.res };
        } catch (e) {
            Logger.error("UserServices ====== validateUser", e);
            return e;
        }
    };

    async resendOtp(data) {
        try {
            let sixDigitsOtp = generateOTP();
            data.otp = sixDigitsOtp;
            if (data?.user_mobile_number.length !== 10) return { code: 422, message: "Enter valid number." };
            if (!data?.user_mobile_number) return { code: 422, message: "Mobile number is mandtory." };
            let updatedData = await this.UserRepo.getUserByMobileObj(data.user_mobile_number);
            if(!updatedData) return {code : 422, message: "Data not exists."};
            let sendSingleSms = await this.ResusableFunctions.sendOtpAsSingleSms(updatedData.refractionist_mobile, data.otp)
            await this.ResusableFunctions.sendSmsInKannadaUnicode(updatedData.refractionist_mobile, data.otp);
            await this.UserRepo.updateOtp(data);
            if (sendSingleSms !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            return { message: RESPONSEMSG.OTP };
        } catch (e) {
            Logger.error("UserServices ====== validateUser", e);
            return e;
        }
    };
}