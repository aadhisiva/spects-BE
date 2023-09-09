import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { ekyc_data } from "../entity";
import { Equal } from "typeorm";

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

    async getDataFromEkyc(data) {
        try {
            return await AppDataSource.getRepository(ekyc_data).findOneBy({aadhaarHash :data?.aadhaarHash});
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async UpdateExistingEkycData(data) {
        try {
            let result = await AppDataSource.getRepository(ekyc_data);
            let findData = await result.findOneBy({aadhaarHash: Equal(data.aadhaarHash)});
            let newData = {...findData, ...data};
            return result.save(newData);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async createApplication(data) {
        try {
            return await AppDataSource.getRepository("").save(data);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
};
