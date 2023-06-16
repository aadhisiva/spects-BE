import { Service } from "typedi";
import { getRepository} from "typeorm";
import Logger from "../utility/winstonLogger";
import { nanoid } from "nanoid";
import { login_user_data } from "../entity/login_user_data";
import { AppDataSource } from "../dbConfig/mysql";

@Service()
export class UserRepo {
    async postUser(data: login_user_data) {
        try {
            return await AppDataSource.getRepository(login_user_data).save(data);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getUserByMobile(no) {
        try {
            return await AppDataSource.getRepository(login_user_data).query(`SELECT user_unique_id, user_mobile_number, refractionist_id, type from login_user_data where user_mobile_number='${no}'`);
        } catch (e) {
            Logger.error("userRepo => getUserByMobile", e)
            return e;
        }
    };

    async getUserByMobileObj(no) {
        try {
            return await AppDataSource.getRepository(login_user_data).findOneBy({user_mobile_number: no});
        } catch (e) {
            Logger.error("userRepo => getUserByMobile", e)
            return e;
        }
    };

    async cehckOtpUser(data) {
        try {
            let login_User_data = AppDataSource.getRepository(login_user_data);
            let result = await login_User_data.findOneBy({user_mobile_number: data.user_mobile_number, otp: data.otp });
            if(!result){
            result.otp = result.otp;
             return await login_User_data.save(result);
            }
        } catch (e) {
            Logger.error("userRepo => cehckOtpUser", e)
            return e;
        }
    };

    async updateOtp(data) {
        try {
            let login_User_data = AppDataSource.getRepository(login_user_data);
            let result = await login_User_data.findOneBy({user_mobile_number: data.user_mobile_number });
            console.log("otp", data.otp);
            result.otp = data.otp;
            return await login_User_data.save(result);
        } catch (e) {
            Logger.error("userRepo => updateOtp", e)
            return e;
        }
    };
} 