import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { district_data, master_data, sub_centre_data, taluka_data } from "../entity";
import { state_data } from "../entity/state_data";
import { PrameterizedQueries } from "../utility/resusableFun";

@Service()
export class AdminRepo {
    async updateLogin(data) {
        try {
            if (data.type == "state_admin") {
                let district = AppDataSource.getRepository(state_data);
                let result = await district.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await district.save(finalData);
            } else if (data.type == "district_officer") {
                let district = AppDataSource.getRepository(district_data);
                let result = await district.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await district.save(finalData);
            } else if (data.type == "taluka") {
                let taluka = AppDataSource.getRepository(taluka_data);
                let result = await taluka.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await taluka.save(finalData);
            } else if (data.type == "subcenter") {
                let sub_centre = AppDataSource.getRepository(sub_centre_data);
                let result = await sub_centre.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await sub_centre.save(finalData);
            }
            return AppDataSource.getRepository(district_data)
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };

    async checkTypeWiseLoginData(data) {
        try {
            if (data.type == "state_admin") {
                return await AppDataSource.getRepository(state_data).findOneBy({ mobile_number: data.mobile_number });
            } else if (data.type == "district_officer") {
                return await AppDataSource.getRepository(district_data).findOneBy({ mobile_number: data.mobile_number })
            } else if (data.type == "taluka") {
                return await AppDataSource.getRepository(taluka_data).findOneBy({ mobile_number: data.mobile_number })
            } else if (data.type == "subcenter") {
                return await AppDataSource.getRepository(sub_centre_data).findOneBy({ mobile_number: data.mobile_number })
            }
            return AppDataSource.getRepository(district_data)
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };

    async login(data: district_data) {
        try {
            data.unique_id = "1";
            return AppDataSource.getRepository(district_data).save(data);
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };
    async getAllMasters(data) {
        try {
            const { districts, talukas } = data;
            if (districts) {
                if(!Array.isArray(districts)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (districts).find(obj => /^[A-Za-z0-9()\s]*$/.test(obj) === true); 
                if (matchArray === undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'CALL get_districtOff_refractinoist(?,?,?,?,?,?,?,?,?,?)';
                let getParamsData = PrameterizedQueries(districts);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result[0];
            } else if (talukas) {
                if(!Array.isArray(talukas)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (talukas).find(obj => /^[A-Za-z0-9()\s]*$/.test(obj) === true); 
                if (matchArray === undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'CALL get_districtOff_taluka(?,?,?,?,?,?,?,?,?,?)';
                let getParamsData = PrameterizedQueries(talukas);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result[0];
            } else {
                let query = `CALL GetAllMasters()`;
                let result = await AppDataSource.getRepository(master_data).query(query);
                return result[0];
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllOrders() {
        try {
            let query = `CALL get_all_count()`;
            let result = await AppDataSource.getRepository(master_data).query(query);
            return result[0];
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllDelivered() {
        try {
            let query = `CALL get_all_delivered()`;
            let result = await AppDataSource.getRepository(master_data).query(query);
            return result[0];
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllPending() {
        try {
            let query = `CALL get_all_pending()`;
            let result = await AppDataSource.getRepository(master_data).query(query);
            return result[0];
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getUpdatedData(data) {
        try {
            let masterData = await AppDataSource.getRepository(master_data);
            let result = await masterData.findOneBy({ user_unique_id: data.user_unique_id });
            let finalData = { ...result, ...data };
            await masterData.save(finalData);
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async updateDistrictsData(data) {
        try {
            let masterData = await AppDataSource.getRepository(district_data);
            let query = `select user_unique_id from master_data where district=?`;
            let result = await AppDataSource.getRepository(master_data).query(query, [data.district]);
            result?.map(async (obj) => {
                var temp = Object.assign({}, obj);
                temp.unique_id = temp.user_unique_id
                temp.mobile_number = data.mobile_number,
                    temp.name = data.name;
                delete temp.user_unique_id;
                let findData = await masterData.findOneBy({ unique_id: obj.user_unique_id });
                if (!findData) {
                    await AppDataSource.getRepository(district_data).save(temp);
                }
                let finalData = { ...findData, ...temp };
                await masterData.save(finalData);
                return temp;
            });
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async updateTalukaData(data) {
        try {
            let masterData = await AppDataSource.getRepository(taluka_data);
            let query = `select user_unique_id from master_data where taluka=?`
            let result = await AppDataSource.getRepository(master_data).query(query, [data.taluka]);
            result?.map(async (obj) => {
                var temp = Object.assign({}, obj);
                temp.unique_id = temp.user_unique_id
                temp.mobile_number = data?.mobile_number,
                    temp.name = data?.name;
                delete temp.user_unique_id;
                let findData = await masterData.findOneBy({ unique_id: obj.user_unique_id });
                if (!findData) {
                    await AppDataSource.getRepository(taluka_data).save(temp);
                }
                let finalData = { ...findData, ...temp };
                await masterData.save(finalData);
                return temp;
            });
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getReportsData() {
        try {
            let otherQuery = `CALL get_reports_other_benf_data()`;
            let otherResult = await AppDataSource.getRepository(master_data).query(otherQuery);
            let query = `CALL get_reports_students_data()`;
            let result = await AppDataSource.getRepository(master_data).query(query);
            return [...otherResult[0], ...result[0]];
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getTalukasData(data) {
        const { districts, talukas } = data;
        try {
            if (districts) {
                if(!Array.isArray(districts)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (districts).find(obj => /^[A-Za-z0-9()\s]*$/.test(obj) === true); 
                if (matchArray === undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'CALL get_districtOff_taluka_districts(?,?,?,?,?,?,?,?,?,?)';
                let getParamsData = PrameterizedQueries(districts);
                let result = await AppDataSource.getRepository(taluka_data).query(query, getParamsData);
                return result[0];
            } else if (talukas) {
                if(!Array.isArray(talukas)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (talukas).find(obj => /^[A-Za-z0-9()\s]*$/.test(obj) === true); 
                if (matchArray === undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'CALL get_districtOff_taluka_districts(?,?,?,?,?,?,?,?,?,?)';
                let getParamsData = PrameterizedQueries(districts);
                let result = await AppDataSource.getRepository(taluka_data).query(query, getParamsData);
                return result[0];
            } else {
                let query = 'CALL get_districtOff_talukaAll()';
                let result = await AppDataSource.getRepository(taluka_data).query(query);
                return result[0];
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getDistrictsData() {
        try {
            let query = 'CALL get_all_districts()';
                let result = await AppDataSource.getRepository(master_data).query(query);
                return result[0];
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getLoginUserData(data) {
        try {
            if (data.type == "District Officer") {
                let finOne = await AppDataSource.getRepository(district_data).findOneBy({ unique_id: data.unique_id });
                let query = `CALL get_user_districtWise(?)`;
                let result = await AppDataSource.getRepository(district_data).query(query, [finOne?.mobile_number]);
                return result[0];
            } else if (data.type == "Taluka") {
                let finOne = await AppDataSource.getRepository(taluka_data).findOneBy({ unique_id: data.unique_id });
                let query = `CALL get_user_talukaWise(?)`;
                let result = await AppDataSource.getRepository(taluka_data).query(query, [finOne?.mobile_number]);
                return result[0];
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    }
};
