import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { ekyc_data } from "../entity";

@Service()
export class EkycRepo {

    async saveEkycData(data) {
        try {
            return AppDataSource.getRepository(ekyc_data).save(data);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async createApplication(data) {
        try {
            return AppDataSource.getRepository("").save(data);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
};
