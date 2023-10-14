import { Service } from "typedi";
import { AdminRepo } from "../apiRepository/adminRepo";
import { generateOTP } from "../utility/resusableFun";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { RESPONSEMSG } from "../utility/statusCodes";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../dbConfig/mysql";
import { district_data } from "../entity";

const switchFunctionForTypeWise = async (data) => {
    switch (data?.type) {
        case "district_officer":
            return await AppDataSource.getRepository(district_data).createQueryBuilder('child').andWhere
        case "taluka":
        case "taluka":
        case "phco":
    }

}
@Service()
export class AdminServices {
    constructor(public AdminRepo: AdminRepo, public ResusableFunctions: ResusableFunctions) { }

    async login(data) {
        if (!data.mobile_number) return { code: 422, message: "Phone Number Cannot Be Null." };
        if (data.mobile_number.length !== 10) return { code: 422, message: "Phone Number Not Valid." }
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if (checkData == 422) return { code: 422, message: "Access Denied." }
        let sixDigitOtp = generateOTP();
        data.otp = sixDigitOtp;
        let sendOtpMessage = await this.ResusableFunctions.sendOtpAsSingleSms(data.mobile_number, sixDigitOtp);
        if (sendOtpMessage !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED, actualMessage: sendOtpMessage };
        await this.AdminRepo.updateLogin(data);
        return { message: RESPONSEMSG.OTP, data: {} };
    };

    async validationOtp(data, req) {
        var session;
        if (!data.mobile_number) return { code: 422, message: "Phone Number Cannot Be Null." };
        if (data.mobile_number.length !== 10) return { code: 422, message: "Phone Number Not Valid." }
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if (checkData == 422) return { code: 422, message: "Access Denied." }
        let checkOtp = checkData.otp == data?.otp;
        if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED };
        const token = jwt.sign({ user_id: checkData.code }, process.env.USERFRONT_PUBLIC_KEY, { expiresIn: "12h", });
        let finalResult = { unique_id: checkData?.code, isIntialLogin: checkData?.is_initial_login, type: data?.type, token, codes: checkData?.codes };
        session = req.session;
        session.user = finalResult
        return { message: RESPONSEMSG.VALIDATE, data: {} };
    };

    async resendOtp(data) {
        if (!data.mobile_number) return { code: 422, message: "Phone Number Cannot Be Null." };
        if (data.mobile_number.length !== 10) return { code: 422, message: "Phone Number Not Valid." }
        let checkData = await this.AdminRepo.checkTypeWiseLoginData(data);
        if (checkData == 422) return { code: 422, message: "Access Denied." }
        let sixDigitOtp = generateOTP();
        data.otp = sixDigitOtp;
        let sendOtpMessage = await this.ResusableFunctions.sendOtpAsSingleSms(data.mobile_number, sixDigitOtp);
        if (sendOtpMessage !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
        await this.AdminRepo.updateLogin(data);
        return { message: RESPONSEMSG.OTP, data: {} };
    };
    /* state login data */
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
    async addNewDataWithExistsRow(data) {
        return this.AdminRepo.addNewDataWithExistsRow(data)
    };

    async getTalukasData(data) {
        return this.AdminRepo.getTalukasData(data)
    };
    /* ------------------------------------------------------------------------------------------------- */
    /* phco */
    async getPhcosData(data) {
        return this.AdminRepo.getPhcosData(data)
    };
    async updatePhcoData(data) {
        return this.AdminRepo.updatePhcoData(data)
    };
    async updatePhcoScreeningData(data) {
        return this.AdminRepo.updatePhcoScreeningData(data)
    };

    async getPhcoWiseData(data) {
        return this.AdminRepo.getPhcoWiseData(data)
    };
    /* ------------------------------------------------------------------------------------------------- */
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
    async getReportsData(data) {
        return this.AdminRepo.getReportsData(data)
    };
    async getLoginUserData(data) {
        return this.AdminRepo.getLoginUserData(data)
    };


    async uniqueDistricts(data) {
        return this.AdminRepo.uniqueDistricts(data)
    };

    async searchData(data) {
        return this.AdminRepo.searchData(data)
    };

    async searchDataStateAndDistrictWise(data) {
        return this.AdminRepo.searchDataStateAndDistrictWise(data)
    };

    async eachDataIdWise(data) {
        return this.AdminRepo.eachDataIdWise(data)
    };

    async refractionistReports(data) {
        return this.AdminRepo.refractionistReports(data)
    };

    async makeNullToValues(data) {
        return this.AdminRepo.makeNullToValues(data)
    };

};
