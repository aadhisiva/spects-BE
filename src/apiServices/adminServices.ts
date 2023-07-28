import { Service } from "typedi";
import { AdminRepo } from "../apiRepository/adminRepo";
import { generateOTP } from "../utility/resusableFun";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { RESPONSEMSG } from "../utility/statusCodes";
import jwt from "jsonwebtoken";


@Service()
export class AdminServices {
    constructor(public AdminRepo: AdminRepo, public ResusableFunctions: ResusableFunctions) { }

    async login(data) {
        if (!data.mobile_number) return { code: 422, message: "Phone number cananot be null." };
        if (data.mobile_number.length !== 10) return { code: 422, message: "Phone number not valid." }
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if (!checkData) return { code: 422, message: "Data not exits." }
        let sixDigitOtp = generateOTP();
        data.otp = sixDigitOtp;
        let sendOtpMessage = await this.ResusableFunctions.sendOtpAsSingleSms(data.mobile_number, sixDigitOtp);
        if (sendOtpMessage !== 200) return { code: 422, message: RESPONSEMSG.OTP };
        await this.AdminRepo.updateLogin(data);
        return { message: RESPONSEMSG.OTP, data: {} };
    };

    async validationOtp(data, req) {
        var session;
        if (!data.mobile_number) return { code: 422, message: "Phone number cananot be null." };
        if (data.mobile_number.length !== 10) return { code: 422, message: "Phone number not valid." }
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if (!checkData) return { code: 422, message: "Data not exits." }
        let checkOtp = checkData.otp == data.otp;
        if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
        const token = jwt.sign({ user_id: checkData.unique_id }, process.env.USERFRONT_PUBLIC_KEY, { expiresIn: "2h", });
        let finalResult = { unique_id: checkData?.unique_id, type: data?.type, token };
        session = req.session;
        session.user = finalResult
        return { message: RESPONSEMSG.VALIDATE, data: {} };
    };

    async resendOtp(data) {
        if (!data.mobile_number) return { code: 422, message: "Phone number cananot be null." };
        if (data.mobile_number.length !== 10) return { code: 422, message: "Phone number not valid." }
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if (!checkData) return { code: 422, message: "Data not exits." }
        let sixDigitOtp = generateOTP();
        data.otp = sixDigitOtp;
        let sendOtpMessage = await this.ResusableFunctions.sendOtpAsSingleSms(data.mobile_number, sixDigitOtp);
        if (sendOtpMessage !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
        await this.AdminRepo.updateLogin(data);
        return { message: RESPONSEMSG.OTP, data: {} };
    };

    async getAllMasters(data) {
        return this.AdminRepo.getAllMasters(data)
    };

    async getAllOrders() {
        return this.AdminRepo.getAllOrders()
    };

    async getAllDelivered() {
        return this.AdminRepo.getAllDelivered()
    };

    async getAllPending() {
        return this.AdminRepo.getAllPending()
    };
    async getUpdatedData(data) {
        return this.AdminRepo.getUpdatedData(data)
    };
    async getTalukasData(data) {
        return this.AdminRepo.getTalukasData(data)
    };
    async getDistrictsData() {
        return this.AdminRepo.getDistrictsData()
    };
    async updateDistrictsData(data) {
        return this.AdminRepo.updateDistrictsData(data)
    };
    async updateTalukaData(data) {
        return this.AdminRepo.updateTalukaData(data)
    };

    
    //reports
    async getReportsData() {
        return this.AdminRepo.getReportsData()
    };
    async getLoginUserData(data) {
        return this.AdminRepo.getLoginUserData(data)
    };

};
