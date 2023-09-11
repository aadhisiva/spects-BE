import { Service } from "typedi";
import { Equal } from "typeorm";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { ekyc_data, master_data, students_data, otherBeneficiary, other_benf_data } from "../entity";
import { rc_data } from "../entity/rc_data";
import { ACCESS_DENIED } from "../utility/constants";


@Service()
export class NewBenfRepo {

    async FetchDataFromEkyc(id) {
        try {
            return await AppDataSource.getRepository(ekyc_data).findOneBy({ txnNo: id });
        } catch (e) {
            return Logger.error("other repo ####FetchDataFromEkyc", e);
        }
    };

    async FetchDataFromOtherBenf(id) {
        try {
            return await AppDataSource.getRepository(otherBeneficiary).findOneBy({ aadhar_no: id });
        } catch (e) {
            return Logger.error("other repo ####FetchDataFromOtherBenf", e);
        }
    };

    async findDataOfLatestBenfData(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ aadhar_no: id });
        } catch (e) {
            return Logger.error("other repo ####FetchDataFromOtherBenf", e);
        }
    };
    async savingNewData(data) {
        try {
            data.ekyc_check = "Y";
            let findDistrict = await AppDataSource.getRepository(master_data).findOneBy({ unique_id: data.user_id });
            let removeExtraCharacters = findDistrict?.district.replace(/\W/g, "").replace(/\d/g, "");
            data.scheme_eligability = removeExtraCharacters.toLowerCase() == data.district.toLowerCase() ? "Yes" : "No";
            return await AppDataSource.getRepository(otherBeneficiary).save(data);
        } catch (e) {
            return Logger.error("other repo ####savingNewData", e);
        }
    };
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
            let findData = await aadharData.findOneBy({ benf_unique_id: data.benf_unique_id, user_id: data.user_id });
            if (!findData) return { code: 422, message: ACCESS_DENIED };
            let newData = { ...findData, ...data };
            return await aadharData.save(newData);
        } catch (e) {
            return Logger.error("other repo ####updateAadharData", e);
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

    async addNewDataFromRC(data: otherBeneficiary) {
        try {
            let findDistrict = await AppDataSource.getRepository(master_data).findOneBy({ unique_id: data.user_id });
            let removeExtraCharacters = findDistrict?.district.replace(/\W/g, "").replace(/\d/g, "");
            data.scheme_eligability = removeExtraCharacters.toLowerCase() == data.district.toLowerCase() ? "Yes" : "No";
            return await AppDataSource.getRepository(otherBeneficiary).save(data);
        } catch (e) {
            Logger.error("OtherBenfRepo => addNewDataFromRC", e)
            return e;
        }
    };

    async updateDataExistsRecord(data: otherBeneficiary) {
        try {
            let other_repo = await AppDataSource.getRepository(otherBeneficiary)
            let result = await other_repo.findOneBy({ aadhar_no: Equal(data.aadhar_no) });
            let finalData = { ...result, ...{ otp: data?.otp, phone_number: data.phone_number } };
            return other_repo.save(finalData);
        } catch (e) {
            Logger.error("otherBenfRepo => updateDataExistsRecord", e)
            return e;
        }
    };

    async mapRcDataTOOtherBenf(data: otherBeneficiary) {
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
            return { ...result, ...data };
        } catch (e) {
            Logger.error("otherBenfRepo => mapRcDataTOOtherBenf", e)
            return e;
        }
    };

    async getAllDataByUserAndUnique(data: otherBeneficiary) {
        try {
            return await AppDataSource.getRepository(otherBeneficiary).findOneBy({ benf_unique_id: data.benf_unique_id, user_id: data.user_id });
        } catch (e) {
            Logger.error("otherBenfRepo => fetchRcUserData", e)
            return e;
        }
    };

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
    async checkDistrictMatch(data, id) {
        let findDistrict = await AppDataSource.getRepository(master_data).findOneBy({ unique_id: id });
        let removeExtraCharacters = findDistrict?.district.replace(/\W/g, "").replace(/\d/g, "");
        return removeExtraCharacters.toLowerCase() == data.district.toLowerCase();
    }
    async FetchDataFromOtherWithID(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ benf_unique_id: id });
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
            return await AppDataSource.getRepository(other_benf_data).findOneBy({ phone_number: data.phone_number, benf_unique_id: data.benf_unique_id });
        } catch (e) {
            Logger.error("otherBenfRepo => checkDataWithPhoneNumberAndId", e)
            return e;
        }
    };
    async updateDataWithPhoneAndId(data) {
        try {
            let benfData = await AppDataSource.getRepository(other_benf_data)
            let result = await benfData.findOneBy({ phone_number: data.phone_number, benf_unique_id: data.benf_unique_id });
            if (!result) return { code: 422, message: ACCESS_DENIED };
            let newData = { ...result, ...data };
            return await benfData.save(newData);
        } catch (e) {
            Logger.error("otherBenfRepo => checkDataWithPhoneNumberAndId", e)
            return e;
        }
    };

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

    async checkDuplicatesWithSats(data) {
        try {
            let result = await AppDataSource.getRepository(otherBeneficiary).createQueryBuilder('child')
                .select(['child.order_number as order_number', 'child.status as status'])
                .where("education_id = :education_id", { education_id: data.education_id }).getRawOne();
            return result;
        } catch (e) {
            Logger.error("otherBenfRepo => getDataByRcNoAnadAadharHash", e)
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


    
    async getBenificaryStatus(id) {
        try {
            let checkUser = this.checkLoginUser(id);
            if (!checkUser) {
                return { code: 422, message: ACCESS_DENIED };
            } else {
                let pending_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: id, status: 'order_pending', applicationStatus: 'Completed' });
                let ready_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: id, status: 'ready_to_deliver', applicationStatus: 'Completed' });
                let delivered_count = await AppDataSource.getRepository(other_benf_data).countBy({ user_id: id, status: 'delivered', applicationStatus: 'Completed' });
                let order_pending = await this.getBenfOrderPending(id);
                let ready_to_deliver = await this.getBenfReayToDeliver(id);
                let delivered = await this.getBenfDevliverd(id);
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
        } catch (e) {
            Logger.error("otherBenfRepo => getBenificaryStatus", e)
            return e;
        }
    };

    async getBenfOrderPending(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).createQueryBuilder('ob').
            select(['ob.benf_unique_id as benf_unique_id', 'ob.benf_name as benf_name', 'ob.address as address','ob.order_number as order_number',
            'ob.status as status', 'ob.phone_number as phone_number']).where("ob.user_id= :user and ob.status= :status and ob.applicationStatus= :appStatus",
            {user: id, status: 'order_pending', appStatus: 'Completed'}).getRawMany();
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfOrderPending", e)
            return e;
        }
    };

    
    async getBenfReayToDeliver(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).createQueryBuilder('ob').
            select(['ob.benf_unique_id as benf_unique_id', 'ob.benf_name as benf_name', 'ob.address as address','ob.order_number as order_number',
            'ob.status as status', 'ob.phone_number as phone_number']).where("ob.user_id= :user and ob.status= :status and ob.applicationStatus= :appStatus",
            {user: id, status: 'ready_to_deliver', appStatus: 'Completed'}).getRawMany();
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfReayToDeliver", e)
            return e;
        }
    };

    async getBenfDevliverd(id) {
        try {
            return await AppDataSource.getRepository(other_benf_data).createQueryBuilder('ob').
            select(['ob.benf_unique_id as benf_unique_id', 'ob.benf_name as benf_name', 'ob.address as address','ob.order_number as order_number',
            'ob.status as status', 'ob.phone_number as phone_number']).where("ob.user_id= :user and ob.status= :status and ob.applicationStatus= :appStatus",
            {user: id, status: 'delivered', appStatus: 'Completed'}).getRawMany();
        } catch (e) {
            Logger.error("otherBenfRepo => getBenfDevliverd", e)
            return e;
        }
    };


    /* *******************************************  ******************************************** */
    /* *******************************************  ******************************************** */
    /* *******************************************  ******************************************** */
    // old apis
    /* *******************************************  ******************************************** */
    /* *******************************************  ******************************************** */
   
}