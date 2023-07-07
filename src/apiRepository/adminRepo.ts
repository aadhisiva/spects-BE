import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { district_data, ekyc_data, master_data, other_benf_data, students_data, sub_centre_data, taluka_data } from "../entity";
import { Equal } from "typeorm";
import { data } from "../b";
import { state_data } from "../entity/state_data";

@Service()
export class AdminRepo {

    async addDistrictsData(data: district_data) {
        try {
            data.unique_id = "1";
            return AppDataSource.getRepository(district_data).save(data);
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };

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
            const { districtOne, districtTwo, talukaOne, talukaTwo  } = data;
            // if (type && district && taluka && sub) {
            //     return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}' and district='${district}' and taluka='${taluka}' and sub_centre='${sub}'`);
            // } else if (type && district && taluka) {
            //     return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}' and district='${district}' and taluka='${taluka}'`);
            // } else if (type && district) {
            //     return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}' and district='${district}'`);
            // } else 
            if (districtOne || districtTwo) {
                return AppDataSource.getRepository(master_data).query(`select * from master_data where district='${districtOne}' or district='${districtTwo}'`);
            } else if(talukaOne || talukaTwo){
                return AppDataSource.getRepository(master_data).query(`select * from master_data where taluka='${talukaOne}' or taluka='${talukaTwo}'`);
            } else {
                return AppDataSource.getRepository(master_data).query(`select * from master_data;`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllOrders(data) {
        try {
            let order_sats = await AppDataSource.getRepository(students_data).countBy({ status: 'order_pending' });
            let ready_sats = await AppDataSource.getRepository(students_data).countBy({ status: 'ready_to_deliver' });
            let delivered_sats = await AppDataSource.getRepository(students_data).countBy({ status: 'delivered' });
            let order_benf = await AppDataSource.getRepository(other_benf_data).countBy({ status: 'order_pending' });
            let ready_benf = await AppDataSource.getRepository(other_benf_data).countBy({ status: 'ready_to_deliver' });
            let delivered_benf = await AppDataSource.getRepository(other_benf_data).countBy({ status: 'delivered' });
            return order_benf + ready_benf + delivered_benf + order_sats + ready_sats + delivered_sats;
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllDelivered(data) {
        try {
            let delivered_sats = await AppDataSource.getRepository(students_data).countBy({ status: 'delivered' });
            let delivered_benf = await AppDataSource.getRepository(other_benf_data).countBy({ status: 'delivered' });
            return delivered_benf + delivered_sats;
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllPending(data) {
        try {
            let order_sats = await AppDataSource.getRepository(students_data).countBy({ status: 'order_pending' });
            let ready_sats = await AppDataSource.getRepository(students_data).countBy({ status: 'ready_to_deliver' });
            let order_benf = await AppDataSource.getRepository(other_benf_data).countBy({ status: 'order_pending' });
            let ready_benf = await AppDataSource.getRepository(other_benf_data).countBy({ status: 'ready_to_deliver' });
            return order_benf + ready_benf + order_sats + ready_sats;
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
            return await masterData.save(finalData);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async updateDistrictsData(data) {
        try {
            let masterData = await AppDataSource.getRepository(district_data);
            let result = await AppDataSource.getRepository(master_data).query(`select user_unique_id from master_data where district='${data.district}'`); 
           return result?.map(async (obj) => {
            var temp = Object.assign({}, obj);
                temp.unique_id = temp.user_unique_id
                temp.mobile_number= data.mobile_number,
                temp.name = data.name;
                delete temp.user_unique_id;
                let findData = await masterData.findOneBy({unique_id: obj.user_unique_id});
                if (!findData) {
                    await AppDataSource.getRepository(district_data).save(temp);
                }
                let finalData = { ...findData, ...temp };
                await masterData.save(finalData);
                return temp;
           });
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async updateTalukaData(data) {
        try {
            let masterData = await AppDataSource.getRepository(taluka_data);
            let result = await AppDataSource.getRepository(master_data).query(`select user_unique_id from master_data where taluka='${data.taluka}'`); 
            return result?.map(async (obj) => {
             var temp = Object.assign({}, obj);
                 temp.unique_id = temp.user_unique_id
                 temp.mobile_number= data.mobile_number,
                 temp.name = data.name;
                 delete temp.user_unique_id;
                 let findData = await masterData.findOneBy({unique_id: obj.user_unique_id});
                 if (!findData) {
                     await AppDataSource.getRepository(taluka_data).save(temp);
                 }
                 let finalData = { ...findData, ...temp };
                 await masterData.save(finalData);
                 return temp;
            });
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getDistrictsData(data) {
        const { district } = data;
        try {
            if (district) {
                return await AppDataSource.getRepository(master_data).query(`SELECT master_data.user_unique_id, master_data.rural_urban, master_data.district, district_data.name,district_data.mobile_number 
                FROM master_data LEFT JOIN district_data ON master_data.user_unique_id=district_data.unique_id where master_data.district='${district}'`)
            } else {
                return await AppDataSource.getRepository(master_data).query(`SELECT master_data.user_unique_id, master_data.rural_urban, master_data.district, district_data.name,district_data.mobile_number 
                FROM master_data LEFT JOIN district_data ON master_data.user_unique_id=district_data.unique_id`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getReportsData(data) {
        try {
            let studentsData = await AppDataSource.getRepository(students_data).query(`SELECT st.student_name as name, st.created_at,
          sd.school_institute_name as details ,st.type, st.status, md.refractionist_name, md.district, md.taluka, md.sub_centre, 
          md.village, st.parent_phone_number as phone_number FROM students_data st INNER JOIN school_data sd ON 
          st.school_id=sd.school_id INNER JOIN master_data md ON st.user_id=md.user_unique_id where status='order_pending' 
          or status='ready_to_deliver' or status='delivered'`);
            let otherBenfData = await AppDataSource.getRepository(other_benf_data).query(`SELECT ob.benf_name as name, ob.type, 
          ob.details,md.refractionist_name, md.district, md.taluka, md.sub_centre, md.village, ob.status, ob.phone_number, ob.created_at 
          FROM other_benf_data ob INNER JOIN master_data md ON ob.user_id=md.user_unique_id where status='order_pending' or 
          status='ready_to_deliver' or status='delivered';`);
            return [...studentsData, ...otherBenfData];
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    
    async getTalukasData(data) {
        const { districtOne, districtTwo, talukaOne, talukaTwo} = data;
        try {
            // if (type && district && taluka) {
            //     return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.user_unique_id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
            //     FROM master_data LEFT JOIN taluka_data ON master_data.user_unique_id=taluka_data.unique_id where master_data.rural_urban='${type}' and master_data.district='${district}' and master_data.taluka='${taluka}' GROUP BY master_data.taluka`)
            // } else if (type && district) {
            //     return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.user_unique_id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
            //     FROM master_data LEFT JOIN taluka_data ON master_data.user_unique_id=taluka_data.unique_id where master_data.rural_urban='${type}' and master_data.district='${district}' GROUP BY master_data.taluka`);
            // } else 
            if (districtOne || districtTwo) {
                return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.user_unique_id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
                FROM master_data LEFT JOIN taluka_data ON master_data.user_unique_id=taluka_data.unique_id where master_data.district='${districtOne}' or master_data.district='${districtTwo}'`);
            } else if(talukaOne || talukaTwo){
                return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.user_unique_id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
                FROM master_data LEFT JOIN taluka_data ON master_data.user_unique_id=taluka_data.unique_id where master_data.taluka='${talukaOne}' or master_data.taluka='${talukaTwo}'`);
            } else {
                return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.user_unique_id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
                FROM master_data LEFT JOIN taluka_data ON master_data.user_unique_id=taluka_data.unique_id`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    
    async getLoginUserData(data) {
        try{
        if(data.type == "District Officer"){
            let finOne = await AppDataSource.getRepository(district_data).findOneBy({unique_id: data.unique_id});
            console.log()
            let getAll = await AppDataSource.getRepository(district_data).query(`SELECT DISTINCT master_data.district FROM district_data INNER JOIN master_data ON master_data.user_unique_id=district_data.unique_id WHERE mobile_number='${finOne.mobile_number}'`);
            return getAll;
        } else if(data.type == "Taluka"){
            let finOne = await AppDataSource.getRepository(taluka_data).findOneBy({unique_id: data.unique_id});
            console.log()
            let getAll = await AppDataSource.getRepository(taluka_data).query(`SELECT DISTINCT master_data.taluka FROM taluka_data INNER JOIN master_data ON master_data.user_unique_id=taluka_data.unique_id WHERE mobile_number='${finOne.mobile_number}'`);
            return getAll;
        }
    } catch(e){
        Logger.error("userRepo => postUser", e)
            return e;
    }
    }
};
// select * from master_data where rural_urban='rural' and district='Bagalkote(2)';
