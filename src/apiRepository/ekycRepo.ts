import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { nanoid } from "nanoid";
import { login_user_data } from "../entity/login_user_data";
import { AppDataSource } from "../dbConfig/mysql";

@Service()
export class EkycRepo {
    async createCallbackUrl(data) {
        try {
            return AppDataSource.getRepository("").save(data);
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
