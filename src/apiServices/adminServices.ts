import { Service } from "typedi";
import { AdminRepo } from "../apiRepository/adminRepo";
import { SMSServices } from "../utility/sms_otp";
import { generateOTP } from "../utility/resusableFun";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { RESPONSEMSG } from "../utility/statusCodes";

@Service()
export class AdminServices {
    constructor(public AdminRepo: AdminRepo, public ResusableFunctions : ResusableFunctions) { }

    async login(data) {
        if(!data.mobile_number) return {code: 422, message : "Phone number cananot be null."};
        if(data.mobile_number.length !== 10) return {code: 422, message : "Phone number not valid."}
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if(!checkData) return {code: 422, message: "Data not exits."}
        let sixDigitOtp = generateOTP();
        data.otp= sixDigitOtp;
        let sendOtpMessage = await this.ResusableFunctions.sendOtpAsSingleSms(data.mobile_number, sixDigitOtp);
        if(sendOtpMessage !==200) return {code: 422, message: RESPONSEMSG.OTP_FAILED};
        let userData = await this.AdminRepo.updateLogin(data);
        return {message: RESPONSEMSG.OTP, data: userData};
    };

    async validationOtp(data) {
        if(!data.mobile_number) return {code: 422, message : "Phone number cananot be null."};
        if(data.mobile_number.length !== 10) return {code: 422, message : "Phone number not valid."}
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if(!checkData) return {code: 422, message: "Data not exits."}
        let checkOtp = checkData.otp == data.otp;
        if(!checkOtp) return {code: 422, message: RESPONSEMSG.VALIDATE_FAILED}
        return {message: RESPONSEMSG.VALIDATE, data: checkData};
    };

    async resendOtp(data) {
        if(!data.mobile_number) return {code: 422, message : "Phone number cananot be null."};
        if(data.mobile_number.length !== 10) return {code: 422, message : "Phone number not valid."}
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if(!checkData) return {code: 422, message: "Data not exits."}
        let sixDigitOtp = generateOTP();
        data.otp= sixDigitOtp;
        let sendOtpMessage = await this.ResusableFunctions.sendOtpAsSingleSms(data.mobile_number, sixDigitOtp);
        if(sendOtpMessage !==200) return {code: 422, message: "Otp sent failed."};
        await this.AdminRepo.updateLogin(data);
        return {message: RESPONSEMSG.OTP, data: checkData};
    };

    async getAllMasters(data) {
        return this.AdminRepo.getAllMasters(data)
    };

    async getAllOrders(data) {
        return this.AdminRepo.getAllOrders(data)
    };

    async getAllDelivered(data) {
        return this.AdminRepo.getAllDelivered(data)
    };

    async getAllPending(data) {
        return this.AdminRepo.getAllPending(data)
    };
    async getUpdatedData(data) {
        return this.AdminRepo.getUpdatedData(data)
    };
    async getDistrictsData(data) {
        return this.AdminRepo.getDistrictsData(data)
    };
    async getTalukasData(data) {
        return this.AdminRepo.getTalukasData(data)
    };
    async updateDistrictsData(data) {
        return this.AdminRepo.updateDistrictsData(data)
    };
    async updateTalukaData(data) {
        return this.AdminRepo.updateTalukaData(data)
    };
    //reports
    async getReportsData(data) {
        return this.AdminRepo.getReportsData(data)
    };
    async getLoginUserData(data) {
        return this.AdminRepo.getLoginUserData(data)
    };

};
