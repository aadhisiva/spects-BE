import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { apiVersions, master_data } from "../entity";
import jwt from 'jsonwebtoken';

@Service()
export class UserRepo {
    
    async getUserByMobile(no) {
        try {
            let data = await AppDataSource.getRepository(master_data).query(`SELECT distinct sub_centre, unique_id, refractionist_mobile as user_mobile_number, district from master_data where refractionist_mobile='${no}'`);
            return data;
        } catch (e) {
            Logger.error("userRepo => getUserByMobile", e)
            return e;
        }
    };

    async getUserByMobileObj(no) {
        try {
            let result = await AppDataSource.getRepository(master_data).findOneBy({ refractionist_mobile: no });
            let data = await AppDataSource.getRepository(master_data).
                createQueryBuilder('child').select('distinct child.health_facility', 'health_facility')
                .where("child.refractionist_mobile =:id", {id: no})
                .getRawMany();
            let version = await AppDataSource.getRepository(apiVersions).find();
            const token = jwt.sign({ user_id: result.refractionist_mobile }, process.env.USERFRONT_PUBLIC_KEY, { expiresIn: "12h", });
            return {...result, ...{ res : { token: token, version: version[0].version }}};
        } catch (e) {
            Logger.error("userRepo => getUserByMobile", e)
            return e;
        }
    };

    async updateOtp(data) {
        try {
            let login_User_data = AppDataSource.getRepository(master_data);
            let result = await login_User_data.findOneBy({ refractionist_mobile: data.user_mobile_number });
            result.otp = data.otp;
            return await login_User_data.save(result);
        } catch (e) {
            Logger.error("userRepo => updateOtp", e)
            return e;
        }
    };
} 