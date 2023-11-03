import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { demoAuthResponse, ekyc_data } from "../entity";

@Service()
export class EkycRepo {

    async saveEkycData(data) {
        try {
            return await AppDataSource.getRepository(ekyc_data).save(data);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async saveDemoAuthData(data) {
        try {
            return await AppDataSource.getRepository(demoAuthResponse).save(data);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
};
