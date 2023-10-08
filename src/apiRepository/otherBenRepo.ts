import { Service } from "typedi";
import { Equal } from "typeorm";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { other_benf_data } from "../entity/other_benf_data";
import { checkEligableCandiadate, generateOTP, matchStrings } from "../utility/resusableFun";
import { ekyc_data, master_data, newDistricts, otherBeneficiary, students_data } from "../entity";
import { rc_data } from "../entity/rc_data";
import { ACCESS_DENIED, COMPLETED, DELIVERED, ORDER_PENDING, READY_TO_DELIVER } from "../utility/constants";


const dataDriven = (data = "Yes") => {
    switch (data) {
        case "Yes":
            return "Yes";
        default:
            return "No";
    }
}

@Service()
export class OtherBenfRepo {

    async FetchDataFromEkyc(id) {
        try {
            return await AppDataSource.getRepository(ekyc_data).findOneBy({ txnNo: id });
        } catch (e) {
            return Logger.error("other repo ####FetchDataFromEkyc", e);
        }
    };

    async FetchDataFromOtherBenf(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ aadhar_no: id });
        } catch (e) {
            return Logger.error("other repo ####FetchDataFromOtherBenf", e);
        }
    };
    // async savingNewData(data) {
    //     try {
    //         data.ekyc_check = "Y";
    //         data.scheme_eligability = "Yes";
    //         return await AppDataSource.getRepository(other_benf_data).save(data);
    //     } catch (e) {
    //         return Logger.error("other repo ####savingNewData", e);
    //     }
    // };
    async checkEducationId(id) {
        try {
            return await AppDataSource.getRepository(students_data).findOneBy({ sats_id: id });
        } catch (e) {
            return Logger.error("other repo ####checkEducationId", e);
        }
    };
    async updateAadharData(data) {
        try {
            let aadharData = await AppDataSource.getRepository(otherBeneficiary);
            let findData = await aadharData.findOneBy({ benf_unique_id: data.benf_unique_id });
            if (!findData) return { code: 422, message: ACCESS_DENIED };
            let newData = { ...findData, ...data };
            return await aadharData.save(newData);
        } catch (e) {
            return Logger.error("other repo ####updateAadharData", e);
        }
    };
    async updateAadharDataOriginal(data) {
        try {
            let aadharData = await AppDataSource.getRepository(other_benf_data);
            let findData = await aadharData.findOneBy({ benf_unique_id: data.benf_unique_id });
            if (!findData) return { code: 422, message: ACCESS_DENIED };
            let newData = { ...findData, ...data };
            return await aadharData.save(newData);
        } catch (e) {
            return Logger.error("other repo ####updateAadharData", e);
        }
    };
    async FatchRcData(id) {
        try {
            return await AppDataSource.getRepository(rc_data).createQueryBuilder('child')
                .select(['child.benf_unique_id as benf_unique_id', 'child.age as age', 'child.benf_name as benf_name', 'child.phone_number as phone_number'])
                .where("child.rc_no= :id", { id }).getRawMany();
        } catch (e) {
            return Logger.error("other repo ####FaechRcData", e);
        }
    };

    async findOneMemberInRC(id) {
        try {
            return await AppDataSource.getRepository(rc_data).findOneBy({ benf_unique_id: id });
        } catch (e) {
            Logger.error("OtherBenfRepo => findOneMemberInRC", e)
            return e;
        }
    };

    async findOneMemberInOther(id) {
        try {
            return await AppDataSource.getRepository(otherBeneficiary).findOneBy({ aadhar_no: id });
        } catch (e) {
            Logger.error("OtherBenfRepo => findOneMemberInOther", e)
            return e;
        }
    };

    async findOneUserWithBenfId(data) {
        try {
            let aadharData = await AppDataSource.getRepository(otherBeneficiary).findOneBy({ benf_unique_id: data.benf_unique_id, aadhar_no: data.aadhar_no });
            delete aadharData.id;
            delete aadharData.created_at;
            delete aadharData.updated_at;
            return aadharData;
        } catch (e) {
            return Logger.error("other repo ####updateAadharData", e);
        }
    };

    async saveOriginalBenf(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).save(data);
        } catch (e) {
            return Logger.error("other repo ####updateAadharData", e);
        }
    };

    async findDataOfLatestBenfData(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ aadhar_no: id });
        } catch (e) {
            Logger.error("OtherBenfRepo => findOneMemberInOther", e)
            return e;
        }
    };
    async getLatestWithID(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ benf_unique_id: id });
        } catch (e) {
            Logger.error("OtherBenfRepo => findOneMemberInOther", e)
            return e;
        }
    };

    async addNewDataFromRC(data: other_benf_data) {
        try {
            let findDistrict = await AppDataSource.getRepository(master_data).findOneBy({ unique_id: data.user_id });
            let removeExtraCharacters = findDistrict?.district.replace(/\W/g, "").replace(/\d/g, "");
            let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters.toLowerCase(), data?.district.toLowerCase());
            data.scheme_eligability = checkEligibaleOrNot;
            return await AppDataSource.getRepository(otherBeneficiary).save(data);
        } catch (e) {
            Logger.error("OtherBenfRepo => addNewDataFromRC", e)
            return e;
        }
    };

    async updateDataExistsRecord(data: otherBeneficiary) {
        try {
            let findDistrict = await AppDataSource.getRepository(master_data).findOneBy({ unique_id: data.user_id });
            let removeExtraCharacters = findDistrict?.district.replace(/\W/g, "").replace(/\d/g, "");
            let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters.toLowerCase(), data?.district.toLowerCase());
            data.scheme_eligability = checkEligibaleOrNot
            let other_repo = await AppDataSource.getRepository(otherBeneficiary)
            let result = await other_repo.findOneBy({ aadhar_no: Equal(data.aadhar_no) });
            let finalData = { ...result, ...data };
            return other_repo.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataExistsRecord", e)
            return e;
        }
    };

    async mapRcDataTOOtherBenf(data: other_benf_data) {
        try {
            let result = await AppDataSource.getRepository(rc_data).findOneBy({ aadhar_no: Equal(data.aadhar_no) });
            delete result.id;
            delete result.created_at;
            delete result.updated_at;
            delete result.user_id;
            delete data?.id;
            delete data.created_at;
            delete data.updated_at;
            delete data.user_id;
            result['kutumba_phone_number'] = result.phone_number;
            result.phone_number = "";
            return { ...result, ...data };
        } catch (e) {
            Logger.error("otherBenfRepo => mapRcDataTOOtherBenf", e)
            return e;
        }
    };

    async getAllDataByUserAndUnique(data: other_benf_data) {
        try {
            return await AppDataSource.getRepository(otherBeneficiary).findOneBy({ benf_unique_id: data.benf_unique_id, user_id: data.user_id });
        } catch (e) {
            Logger.error("otherBenfRepo => fetchRcUserData", e)
            return e;
        }
    };

    async fetchDataFromMaster(data) {
        try {
            const { user_id } = data;
            return await AppDataSource.getRepository(master_data).findOneBy({ unique_id: user_id });
        } catch (e) {
            Logger.error("otherBenfRepo ### fetchDataFromMaster", e);
        }
    }

    async fetchRcUserData(data: otherBeneficiary) {
        try {
            const { user_id, benf_unique_id } = data;
            let checkDistrict = await AppDataSource.getRepository(otherBeneficiary).createQueryBuilder('child')
                .select(['child.benf_name as benf_name', 'child.dob as dob', 'child.age as age', 'child.taluk as taluk',
                    'child.district as district', 'child.phone_number as phone_number', 'child.category as category',
                    'child.caste as caste', 'child.address as address', 'child.scheme_eligability as scheme_eligability'])
                .where("child.user_id= :user and child.benf_unique_id= :id", { user: user_id, id: benf_unique_id }).getRawOne();
            return checkDistrict;
        } catch (e) {
            Logger.error("otherBenfRepo => fetchRcUserData", e)
            return e;
        }
    };

    async savingNewData(data) {
        try {
            data.ekyc_check = "Y";
            let findDistrict = await AppDataSource.getRepository(master_data).findOneBy({ unique_id: data.user_id });
            let removeExtraCharacters = findDistrict?.district.replace(/\W/g, "").replace(/\d/g, "");
            let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters.toLowerCase(), data?.district.toLowerCase());
            data.scheme_eligability = checkEligibaleOrNot;
            return await AppDataSource.getRepository(otherBeneficiary).save(data);
        } catch (e) {
            return Logger.error("other repo ####savingNewData", e);
        }
    };



    async FetchDataFromOtherWithID(id) {
        try {
            return await AppDataSource.getRepository(otherBeneficiary).findOneBy({ benf_unique_id: id });
        } catch (e) {
            Logger.error("otherBenfRepo => FetchDataFromOtherWithID", e)
            return e;
        }
    };
    async updateOneRecordInOther(data) {
        try {
            let otherdata = await AppDataSource.getRepository(otherBeneficiary);
            let findData = await otherdata.findOneBy({ benf_unique_id: data.benf_unique_id });
            let newData = { ...findData, ...data };
            return await otherdata.save(newData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateOneRecordInOther", e)
            return e;
        }
    };

    async eachStatusWise(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).createQueryBuilder('child').
                select(['child.benf_unique_id as benf_unique_id', 'child.address as address', 'child.order_number as order_number', 'child.benf_name as benf_name',
                    'child.phone_number as phone_number', 'child.initial_image as initial_image']).where("child.benf_unique_id= :id", { id }).getRawOne();
        } catch (e) {
            Logger.error("otherBenfRepo => eachStatusWise", e)
            return e;
        }
    };
    async updateDataWithBenfId(data) {
        try {
            let otherdata = await AppDataSource.getRepository(other_benf_data);
            let findData = await otherdata.findOneBy({ benf_unique_id: data.benf_unique_id });
            let newData = { ...findData, ...data };
            return await otherdata.save(newData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataWithBenfId", e)
            return e;
        }
    };
    async checkDataWithPhoneNumber(no) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ phone_number: no });
        } catch (e) {
            Logger.error("otherBenfRepo => checkDataWithPhoneNumber", e)
            return e;
        }
    };
    async checkDataWithPhoneNumberAndId(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).find({ where: { phone_number: data.phone_number } });
        } catch (e) {
            Logger.error("otherBenfRepo => checkDataWithPhoneNumberAndId", e)
            return e;
        }
    };
    async updateDataWithPhoneAndId(data) {
        try {
            let benfData = await AppDataSource.getRepository(otherBeneficiary)
            let result = await benfData.findOneBy({ benf_unique_id: data.benf_unique_id });
            if (!result) return { code: 422, message: ACCESS_DENIED };
            let newData = { ...result, ...data };
            return await benfData.save(newData);
        } catch (e) {
            Logger.error("otherBenfRepo => checkDataWithPhoneNumberAndId", e)
            return e;
        }
    };

    /* *******************************************  ******************************************** */
    /* *******************************************  ******************************************** */
    /* *******************************************  ******************************************** */
    // old apis
    /* *******************************************  ******************************************** */
    /* *******************************************  ******************************************** */
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
            data.benf_unique_id = new Date().getFullYear() + "" + new Date().getTime();
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

    async getRcBasedOnAadharData(data: other_benf_data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_name, dob, age, taluk, district, 
                phone_number, category, caste, address, scheme_eligability from other_benf_data where aadhar_no="${data.aadhar_no}" 
                and rc_no="${data.rc_no}" and user_id="${data.user_id}"`);
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByAadharHash", e)
            return e;
        }
    };

    async getRcBasedOnAadharDataUniId(data: other_benf_data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_name, dob, age, taluk, district, 
                phone_number, category, caste, address, scheme_eligability from other_benf_data where aadhar_no='${data.aadhar_no}' and user_id='${data.user_id}'`);
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByAadharHash", e)
            return e;
        }
    };

    async findAll() {
        try {
            let res = await AppDataSource.getRepository(other_benf_data).query(`select TOP 1 benf_unique_id from other_benf_data ORDER BY id DESC`);
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
            return await AppDataSource.getRepository(other_benf_data).findOne({ where: { aadhar_no: Equal(data.aadhar_no) } });
        } catch (e) {
            Logger.error("otherBenfRepo => checkOnlyAadharHash", e)
            return e;
        }
    };

    async updateDataByRcAndHashUniId(data: other_benf_data) {
        try {
            data.order_number = generateOTP();
            let getAllCount = await this.findAll();
            data.status = ORDER_PENDING;
            let checkUndefined = (getAllCount[0]?.benf_unique_id == undefined) ? 0 : getAllCount[0]?.benf_unique_id;
            data.benf_unique_id = `${Number(checkUndefined) + 1}`;
            let result = await AppDataSource.getRepository(rc_data).findOneBy({ aadhar_no: Equal(data.aadhar_no) });
            delete result?.id;
            delete result?.created_at;
            delete result?.updated_at;
            delete result?.user_id;
            let finalData = { ...data, ...result };
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
            let result = await AppDataSource.getRepository(rc_data).findOneBy({ aadhar_no: Equal(data.aadhar_no) });
            delete result?.id;
            delete result?.created_at;
            delete result?.updated_at;
            delete result?.user_id;
            return { ...result, ...data };
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataByRcAndHash", e)
            return e;
        }
    };

    async UpdateOtpInOtherBenficiary(data: other_benf_data) {
        try {
            let other_repo = await AppDataSource.getRepository(other_benf_data)
            let result = await other_repo.findOneBy({ aadhar_no: Equal(data.aadhar_no) });
            let finalData = { ...result, ...{ otp: data?.otp, phone_number: data.phone_number } };
            return other_repo.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataByRcAndHash", e)
            return e;
        }
    };

    async updateDataByRcAndHashUniAadharHash(data: other_benf_data) {
        try {
            let other_repo = await AppDataSource.getRepository(rc_data)
            let result = other_repo.findOneBy({ aadhar_no: Equal(data.aadhar_no) });
            let finalData = { ...result, ...data };
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
    async __checkAadharWithRcTable(data: rc_data) {
        return await AppDataSource.getRepository(rc_data).findOneBy({ aadhar_no: Equal(data.aadhar_no) });
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
    async createRcDataByEach(data) {
        try {
            data.benf_unique_id = new Date().getFullYear() + "" + new Date().getTime();
            return await AppDataSource.getRepository(rc_data).save(data);
        } catch (e) {
            Logger.error("OtherBenfRepo => addDeatilsFromKutumbaAPI", e)
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

    async findWithBenfData(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ benf_unique_id: id });
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNo", e)
            return e;
        }
    };

    async checkStatusWiseData(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, address,order_number, 
            benf_name, phone_number, initial_image, status from other_benf_data where benf_unique_id='${data.benf_unique_id}'`);
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
            let result = await AppDataSource.getRepository(other_benf_data).findOne({ where: { aadhar_no: Equal(data.aadhar_no), user_id: Equal(data.user_id) } });
            return result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNoAnadAadharHash", e)
            return e;
        }
    };
    async checkDuplicatesWithSats(data) {
        try {
            let result = await AppDataSource.getRepository(students_data).createQueryBuilder('child')
                .select(['child.order_number as order_number', 'child.status as status'])
                .where("sats_id = :id", { id: data.education_id }).getRawOne();
            return result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNoAnadAadharHash", e)
            return e;
        }
    };
    async checkSatsDuplicate(data) {
        try {
            let result = await AppDataSource.getRepository(other_benf_data).createQueryBuilder('child')
                .select(['child.order_number as order_number', 'child.status as status'])
                .where("education_id = :education_id", { education_id: data.education_id }).getRawOne();
            return result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNoAnadAadharHash", e)
            return e;
        }
    };

    async getBenificaryStatus(data) {
        try {
            const { pagination, skip = 0, take = 10, user_id } = data;
            if (pagination == 'Yes') {
                let pending_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: user_id, status: ORDER_PENDING, applicationStatus: COMPLETED });
                let ready_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: user_id, status: READY_TO_DELIVER, applicationStatus: COMPLETED });
                let delivered_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: user_id, status: DELIVERED, applicationStatus: COMPLETED });
                let totalData = await AppDataSource.getRepository(other_benf_data).createQueryBuilder('other').
                    select(['other.benf_unique_id as benf_unique_id', 'other.benf_name as benf_name','other.order_number as order_number',
                            'other.address as address', 'other.status as status', 'other.phone_number as phone_number'])
                    .where("other.user_id = :id and other.applicationStatus = :applicationStatus", {id: user_id, applicationStatus: COMPLETED})
                    .orderBy('other.benf_unique_id')
                    .skip(+skip)
                    .take(+take)
                    .getRawMany();
                return {
                    take: take,
                    skip: skip,
                    total: Number(pending_count) + Number(ready_count) + Number(delivered_count),
                    pending_count: pending_count,
                    ready_count: ready_count,
                    delivered_count: delivered_count,
                    totalData
                };
            } else {
                let checkUser = this.checkLoginUser(data);
                if (!checkUser) {
                    return { code: 422, message: "Data not exits." };
                } else {
                    let pending_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: user_id, status: ORDER_PENDING, applicationStatus: COMPLETED });
                    let ready_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: user_id, status: READY_TO_DELIVER, applicationStatus: COMPLETED });
                    let delivered_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: user_id, status: DELIVERED, applicationStatus: COMPLETED });
                    let order_pending = await this.getBenfOrderPending(user_id);
                    let ready_to_deliver = await this.getBenfReayToDeliver(user_id);
                    let delivered = await this.getBenfDevliverd(user_id);
                    return {
                        total: Number(pending_count) + Number(ready_count) + Number(delivered_count),
                        pending_count: pending_count,
                        ready_count: ready_count,
                        delivered_count: delivered_count,
                        order_pending,
                        ready_to_deliver,
                        delivered
                    };
                }
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

    async statusDataByIdWith(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, address, aadhar_no,order_number, 
            benf_name, phone_number, initial_image status from other_benf_data where user_id='${data.user_id}' and aadhar_no='${data.aadhar_no}'`);
        } catch (e) {
            Logger.error("otherBenfRepo => getBenificaryStatus", e)
            return e;
        }
    };

    async getBenificaryHistory(data) {
        try {
            const { pagination, skip = 0, take = 10, user_id } = data;
            if (pagination == 'Yes') {
                return await AppDataSource.getRepository(other_benf_data).createQueryBuilder('other').
                    select(['other.benf_unique_id as benf_unique_id', 'other.benf_name as benf_name','other.order_number as order_number',
                            'other.address as address', 'other.status as status', 'other.phone_number as phone_number'])
                    .where("other.user_id = :id and other.applicationStatus = :applicationStatus and other.status = :status", 
                    {id: user_id, applicationStatus: COMPLETED, status: DELIVERED})
                    .orderBy('other.benf_unique_id')
                    .skip(skip)
                    .take(take)
                    .getRawMany();
            } else {
                return await this.getBenfDevliverd(data);
            }
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
                let newData = { status: "ready_to_deliver" };
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
            let orderPending = await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, benf_name, 
            order_number,address, status, phone_number FROM other_benf_data WHERE user_id='${data}' and status='${ORDER_PENDING}'
            and applicationStatus='Completed'`)
            return (orderPending?.length == 0) ? [] : orderPending;
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfOrderPending", e)
            return e;
        }
    };

    async getEkycDataFromEkyc(data) {
        try {
            let result = await AppDataSource.getRepository(ekyc_data).findOneBy({ aadhaarHash: data });
            return (!result) ? 422 : result;
        } catch (e) {
            Logger.error("otherBenfRepo => getEkycDataFromEkyc", e)
            return e;
        }
    };

    async getDataOnlyAadharFromKutumba(data) {
        try {
            let result = await AppDataSource.getRepository(other_benf_data).findOneBy({ aadhar_no: data });
            return (!result) ? 422 : result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataOnlyAadharFromKutumba", e)
            return e;
        }
    };

    async updateEkycStatusInBenf(data) {
        try {
            let result = await AppDataSource.getRepository(other_benf_data);
            let finOneRes = await result.findOneBy({ aadhar_no: data });
            let updatedData = { ...finOneRes, ...{ ekyc_check: "Y" } };
            return result.save(updatedData);
        } catch (e) {
            Logger.error("otherBenfRepo => getDataOnlyAadharFromKutumba", e)
            return e;
        }
    };

    async getBenfReayToDeliver(data) {
        try {
            let readyToDel = await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, benf_name,address, 
            order_number, status, phone_number FROM other_benf_data WHERE user_id='${data}' and status='${READY_TO_DELIVER}'
            and applicationStatus='Completed'`)
            return (readyToDel?.length == 0) ? [] : readyToDel;;
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfReayToDeliver", e)
            return e;
        }
    };

    async getBenfDevliverd(data) {
        try {
            let devlivered = await AppDataSource.getRepository(other_benf_data).query(`SELECT benf_unique_id, benf_name,address, 
            order_number, status, phone_number FROM other_benf_data WHERE user_id='${data}' and status='${DELIVERED}'
            and applicationStatus='Completed'`)
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
            let newData = data?.details ? { ...data, status: ORDER_PENDING } : data;
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
    async updateOtpAndMobileNumber(data) {
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

    async checkUserWithMobile(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ phone_number: data.phone_number });
        } catch (e) {
            Logger.error("otherBenfRepo => updateBefDataByAadhar", e)
            return e;
        }
    };

    async checkUserWithMobileWithAadhar(data) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ phone_number: data.phone_number, aadhar_no: data.aadhar_no });
        } catch (e) {
            Logger.error("otherBenfRepo => updateBefDataByAadhar", e)
            return e;
        }
    };
} 