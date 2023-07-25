import { Service } from "typedi";
import { Equal } from "typeorm";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { other_benf_data } from "../entity/other_benf_data";
import { generateOTP } from "../utility/resusableFun";
import { ekyc_data } from "../entity";
import { rc_data } from "../entity/rc_data";


const dataDriven = (data = "Yes") => {
    switch(data) {
        case "Yes":
            return "Yes";
        default:
            return "No";
    }
}

@Service()
export class OtherBenfRepo {
    async addDeatilsFromKutumbaAPI(data: other_benf_data) {
        try {
            data.scheme_eligability = dataDriven();
            return await AppDataSource.getRepository(other_benf_data).save(data);
        } catch (e) {
            Logger.error("OtherBenfRepo => addDeatilsFromKutumbaAPI", e)
            return e;
        }
    };
    async createRcDataOfEach(data: rc_data) {
        try {
            return await AppDataSource.getRepository(rc_data).save(data);
        } catch (e) {
            Logger.error("OtherBenfRepo => addDeatilsFromKutumbaAPI", e)
            return e;
        }
    };

    async getDataByAadharHash(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_name, dob, age, taluk, district, 
                phone_number, category, caste, address, scheme_eligability from other_benf_data where aadhar_no='${data}'`);
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByAadharHash", e)
            return e;
        }
    };

    async getRcBasedOnAadharData(data :other_benf_data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_name, dob, age, taluk, district, 
                phone_number, category, caste, address, scheme_eligability from other_benf_data where aadhar_no="${data.aadhar_no}" 
                and rc_no="${data.rc_no}" and user_id="${data.user_id}"`);
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByAadharHash", e)
            return e;
        }
    };

    async getRcBasedOnAadharDataUniId(data :other_benf_data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_name, dob, age, taluk, district, 
                phone_number, category, caste, address, scheme_eligability from other_benf_data where benf_unique_id="${data.benf_unique_id}"`);
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByAadharHash", e)
            return e;
        }
    };

    async findAll() {
        try {
            // let res = await AppDataSource.getRepository(other_benf_data).query(`select TOP 1 benf_unique_id from other_benf_data ORDER BY id DESC`);
            let res = await AppDataSource.getRepository(other_benf_data).query(`select benf_unique_id from other_benf_data ORDER BY id DESC LIMIT 1`);
            return res;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByAadharHash", e)
            return e;
        }
    };

    async getDataByAadharHashAndUser(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOne({ where: { aadhar_no: Equal(data.aadhar_no), user_id: Equal(data.user_id) } });
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByAadharHashAndUser", e)
            return e;
        }
    };

    async checkOnlyAadharHash(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOne({ where: { aadhar_no: Equal(data.aadhar_no)}});
        } catch (e) {
            Logger.error("otherBenfRepo => checkOnlyAadharHash", e)
            return e;
        }
    };

    async updateDataByRcAndHashUniId(data: other_benf_data) {
        try {
            data.order_number = generateOTP();
            let getAllCount = await this.findAll();
            data.status= "order_pending";
            let checkUndefined = (getAllCount[0]?.benf_unique_id == undefined) ? 0 : getAllCount[0]?.benf_unique_id;
            data.benf_unique_id = `${Number(checkUndefined) + 1}`;
            let result = await AppDataSource.getRepository(rc_data).findOneBy({ aadhar_no: Equal(data.aadhar_no)});
            delete result?.id;
            delete result?.created_at;
            delete result?.updated_at;
            delete result?.user_id;
            let finalData = { ...data, ...result};
            return [result, finalData];
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataByRcAndHash", e)
            return e;
        }
    };

    async updateDataByRcAndHashUniAadharHas__(data: other_benf_data) {
        try {
            let getAllCount = await this.findAll();
            let checkUndefined = (getAllCount[0]?.benf_unique_id == undefined) ? 0 : getAllCount[0]?.benf_unique_id;
            data.benf_unique_id = `${Number(checkUndefined) + 1}`;
            let result = await AppDataSource.getRepository(rc_data).findOneBy({ aadhar_no: Equal(data.aadhar_no)});
            if(!result) return {code: 422, message: "Data not exists."}
            delete result?.id;
            delete result?.created_at;
            delete result?.updated_at;
            delete result?.user_id;
            return { ...result, ...data};
            // return await AppDataSource.getRepository(rc_data).save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataByRcAndHash", e)
            return e;
        }
    };

    async updateDataByRcAndHashUniAadharHash(data: other_benf_data) {
        try {
            let other_repo = await AppDataSource.getRepository(rc_data)
            let result = other_repo.findOneBy({ aadhar_no: Equal(data.aadhar_no)});
            let finalData = { ...result, ...data};
            return other_repo.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataByRcAndHash", e)
            return e;
        }
    };
    async updateDataByRcAndHash(data) {
        try {
            data.order_number = generateOTP();
            let otherBenfDataBase = AppDataSource.getRepository(other_benf_data);
            let result = await otherBenfDataBase.findOneBy({ rc_no: data.rc_no, aadhar_no: data.aadhar_no });
            let finalData = { ...result, ...data }
            return await otherBenfDataBase.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataByRcAndHash", e)
            return e;
        }
    };
    async updateRcDataBYEach(data) {
        try {
            let rcDataBase = AppDataSource.getRepository(rc_data);
            let result = await rcDataBase.findOneBy({ rc_no: data.rc_no, aadhar_no: data.aadhar_no });
            let finalData = { ...result, ...data }
            return await rcDataBase.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataByRcAndHash", e)
            return e;
        }
    };
     // rc_Data 
     async __checkAadharWithRcTable(data: rc_data){
        return await AppDataSource.getRepository(rc_data).findOneBy({aadhar_no: Equal(data.aadhar_no)});
     }

    async getDataByRcNo(data) {
        try {
            let result = await AppDataSource.getRepository(rc_data).query(`SELECT rc_no, aadhar_no, phone_number, age, benf_name from rc_data where rc_no='${data}'`);
            return result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNo", e)
            return e;
        }
    };

    async checkLoginUser(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ user_id: data });
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNo", e)
            return e;
        }
    };

    // async getDataByRcNo(data) {
    //     try {
    //         let result = await AppDataSource.getRepository(other_benf_data).find({ where: { rc_no: Equal(data) } });
    //         return result;
    //     } catch (e) {
    //         Logger.error("otherBenfRepo => getDataByRcNo", e)
    //         return e;
    //     }
    // };

    async getDataByRcNoAnadAadharHash(data) {
        try {
            let result = await AppDataSource.getRepository(other_benf_data).findOne({ where: { rc_no: Equal(data.rc_no), aadhar_no: Equal(data.aadhar_no), user_id: Equal(data.user_id) } });
            return result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNoAnadAadharHash", e)
            return e;
        }
    };

    async getDataByRcNoAnadAadharHashWithUniId(data) {
        try {
            let result = await AppDataSource.getRepository(other_benf_data).findOne({ where: { aadhar_no: Equal(data.aadhar_no) } });
            return result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNoAnadAadharHash", e)
            return e;
        }
    };

    async getBenificaryStatus(data) {
        try {
            let checkUser = this.checkLoginUser(data);
            if (!checkUser) {
                return {code: 422, message: "Data not exits."};
            } else {
                let pending_count = await AppDataSource.getRepository(other_benf_data).query(`SELECT COUNT(*) as count FROM other_benf_data WHERE status='order_pending' and user_id='${data.user_id}';`)
                let ready_count = await AppDataSource.getRepository(other_benf_data).query(`SELECT COUNT(*) as count FROM other_benf_data WHERE status='ready_to_deliver' and user_id='${data.user_id}';`)
                let delivered_count = await AppDataSource.getRepository(other_benf_data).query(`SELECT COUNT(*) as count FROM other_benf_data WHERE status='delivered' and user_id='${data.user_id}';`)
                let order_pending = await this.getBenfOrderPending(data);
                let ready_to_deliver = await this.getBenfReayToDeliver(data);
                let delivered = await this.getBenfDevliverd(data);
                return { 
                    total: Number(pending_count[0].count)+Number(ready_count[0].count)+Number(delivered_count[0].count), 
                    pending_count: pending_count[0].count,
                    ready_count: ready_count[0].count,
                    delivered_count: delivered_count[0].count, 
                    order_pending, 
                    ready_to_deliver, 
                    delivered 
                };
            }
        } catch (e) {
            Logger.error("otherBenfRepo => getBenificaryStatus", e)
            return e;
        }
    };

    async checkBenfUniId(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ benf_unique_id: data });
        } catch (e) {
            Logger.error("otherBenfRepo => getBenificaryStatus", e)
            return e;
        }
    };

    async getBenificaryHistory(data) {
        try {
            return await this.getBenfDevliverd(data);
        } catch (e) {
            Logger.error("otherBenfRepo => getBenificaryHistory", e)
            return e;
        }
    };

    async checkBenByUniqueId(data) {
        try {
            let checkData = await AppDataSource.getRepository(other_benf_data).findOneBy({ benf_unique_id: data.benf_unique_id });
            return checkData;
        } catch (e) {
            Logger.error("otherBenfRepo => checkBenByUniqueId", e)
            return e;
        }
    };

    async readyTODeliver(data) {
        try {
            let otherBenfDataBase = AppDataSource.getRepository(other_benf_data);
            let result = await otherBenfDataBase.findOneBy({ benf_unique_id: data.benf_unique_id });
            let finalData = { ...result, ...data }
            return await otherBenfDataBase.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => readyTODeliver", e)
            return e;
        }
    };

    async pendingToReady(data: other_benf_data) {
        try {
            let otherBenfDataBase = AppDataSource.getRepository(other_benf_data);
            let result = await otherBenfDataBase.findOneBy({ benf_unique_id: data.benf_unique_id });
            if (!result) {
                return 422;
            } else {
                let newData = { status: "ready_to_deliver"};
                let finalData = { ...result, ...newData };
                return await otherBenfDataBase.save(finalData);
            }
        } catch (e) {
            Logger.error("otherBenfRepo => updateBenificaryEachID", e)
            return e;
        }
    };

    async updateBenificaryEachID(data: other_benf_data) {
        try {
            let otherBenfDataBase = AppDataSource.getRepository(other_benf_data);
            let result = await otherBenfDataBase.findOneBy({ benf_unique_id: data.benf_unique_id });
            if (!result) {
                return 422;
            } else {
                let newData = { status: "delivered", image: data.image };
                let finalData = { ...result, ...newData };
                return await otherBenfDataBase.save(finalData);
            }
        } catch (e) {
            Logger.error("otherBenfRepo => updateBenificaryEachID", e)
            return e;
        }
    };

    async getBenfOrderPending(data) {
        try {
            let orderPending = await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, benf_name, order_number, status, phone_number FROM other_benf_data WHERE user_id='${data}' and status='order_pending'`)
            return (orderPending?.length == 0) ? [] : orderPending;
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfOrderPending", e)
            return e;
        }
    };

    async getEkycDataFromEkyc(data) {
        try {
            let result = await AppDataSource.getRepository(ekyc_data).findOneBy({aadhaarHash : data});
            return (!result) ? 422 : result;
        } catch (e) {
            Logger.error("otherBenfRepo => getEkycDataFromEkyc", e)
            return e;
        }
    };

    async getDataOnlyAadharFromKutumba(data) {
        try {
            let result = await AppDataSource.getRepository(other_benf_data).findOneBy({aadhar_no: data});
            return (!result) ? 422 : result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataOnlyAadharFromKutumba", e)
            return e;
        }
    };

    async updateEkycStatusInBenf(data) {
        try {
            let result = await AppDataSource.getRepository(other_benf_data);
            let finOneRes = await result.findOneBy({aadhar_no: data});
            let updatedData = {...finOneRes, ...{ekyc_check: "Y"}};
            return result.save(updatedData);
        } catch (e) {
            Logger.error("otherBenfRepo => getDataOnlyAadharFromKutumba", e)
            return e;
        }
    };

    async getBenfReayToDeliver(data) {
        try {
            let readyToDel = await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, benf_name, order_number, status, phone_number FROM other_benf_data WHERE user_id='${data}' and status='ready_to_deliver'`)
            return (readyToDel?.length == 0) ? [] : readyToDel;;
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfReayToDeliver", e)
            return e;
        }
    };

    async getBenfDevliverd(data) {
        try {
            let devlivered = await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, benf_name, order_number, status, phone_number FROM other_benf_data WHERE user_id='${data}' and status='delivered'`)
            return (devlivered?.length == 0) ? [] : devlivered;;
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfDevliverd", e)
            return e;
        }
    };

    async updateBefDataByAadhar(data: other_benf_data) {
        try {
            let otherBenfDataBase = AppDataSource.getRepository(other_benf_data);
            let result = await otherBenfDataBase.findOneBy({ aadhar_no: data.aadhar_no });
            let newData = data?.details ? { ...data, status: "order_pending"}: data;
            let finalData = { ...result, ...newData }
            return await otherBenfDataBase.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateBefDataByAadhar", e)
            return e;
        }
    };

    async updateOnlyDataInOther(data) {
        try {
            let otherBenfDataBase = AppDataSource.getRepository(other_benf_data);
            let result = await otherBenfDataBase.findOneBy({ aadhar_no: data.aadhar_no });
            let finalData = { ...result, ...data }
            return await otherBenfDataBase.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateBefDataByAadhar", e)
            return e;
        }
    };
} 