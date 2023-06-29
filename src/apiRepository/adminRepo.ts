import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { district_data, ekyc_data, master_data, other_benf_data, students_data, sub_centre_data, taluka_data } from "../entity";

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
                let district = AppDataSource.getRepository(district_data);
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
                return await AppDataSource.getRepository(district_data).findOneBy({ mobile_number: data.mobile_number });
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

    async getDistrictOfficerWise(data: any) {
        const { id, type } = data;
        try {
            if (id && type) {
                let result = await AppDataSource.getRepository(master_data).query(`SELECT district FROM master_data WHERE master_unique_id=${id}`);
                return await AppDataSource.getRepository(master_data).query(`SELECT * FROM master_data WHERE district='${result[0].district}' and rural_urban='${type}'`);
            } else {
                let result = await AppDataSource.getRepository(master_data).query(`SELECT district FROM master_data WHERE master_unique_id=${id}`);
                return await AppDataSource.getRepository(master_data).query(`SELECT * FROM master_data WHERE district='${result[0].district}'`);
            }
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };

    async getDistrictOfficerSelectWise(data: any) {
        const { id, type, taluka, sub } = data;
        try {
            const { type, district, taluka, sub } = data;
            if (id && type && taluka && sub) {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT village as option from master_data where unique_id=${id} and rural_urban='${type}' and district='${district}' and taluka='${taluka}' and suc_centre='${sub}'`);
            } else if (district && taluka) {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT sub_centre as option from master_data where unique_id=${id} and rural_urban='${type}' and district='${district}' and taluka='${taluka}'`);
            } else if (district) {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT taluka as option from master_data where unique_id=${id} and rural_urban='${type}' and district='${district}'`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async addSubCentreData(data: sub_centre_data) {
        try {
            data.unique_id = "1";
            return AppDataSource.getRepository(sub_centre_data).save(data);
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };

    async getAllMasters(data) {
        try {
            const { type, district, taluka, sub } = data;
            if (type && district && taluka && sub) {
                return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}' and district='${district}' and taluka='${taluka}' and sub_centre='${sub}'`);
            } else if (type && district && taluka) {
                return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}' and district='${district}' and taluka='${taluka}'`);
            } else if (type && district) {
                return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}' and district='${district}'`);
            } else if (type) {
                return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}'`);
            } else {
                return AppDataSource.getRepository(master_data).query(`select * from master_data;`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllDistricts(data) {
        try {
            const { type, district, taluka, sub } = data;
            if (type && district && taluka && sub) {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT village as option from master_data where rural_urban='${type}' and district='${district}' and taluka='${taluka}' and sub_centre='${sub}'`);
            } else if (type && district && taluka) {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT sub_centre as option from master_data where rural_urban='${type}' and district='${district}' and taluka='${taluka}'`);
            } else if (type && district) {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT taluka as option from master_data where rural_urban='${type}' and district='${district}'`);
            } else if (type) {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT district as option from master_data where rural_urban='${type}'`);
            } else {
                return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT district as option from master_data`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllTalukas(data) {
        try {
            const { type, district } = data;
            return AppDataSource.getRepository(master_data).query(`SELECT DISTINCT taluka from master_data where `);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllSearchData(data) {
        try {
            const { type, district, taluka, sub_centre, village } = data;
            return AppDataSource.getRepository(master_data).query(`select * from master_data where rural_urban='${type}' and district='${district}' and taluka='${taluka}' and sub_centre='${sub_centre}'`);
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
            let result = await masterData.findOneBy({ id: data.id });
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
            let result = await masterData.findOneBy({ unique_id: data.unique_id });
            if (!result) {
                return await AppDataSource.getRepository(district_data).save(data);
            }
            let finalData = { ...result, ...data };
            return await masterData.save(finalData);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async updateTalukaData(data) {
        try {
            let masterData = await AppDataSource.getRepository(taluka_data);
            let result = await masterData.findOneBy({ unique_id: data.unique_id });
            if (!result) {
                return await AppDataSource.getRepository(taluka_data).save(data);
            }
            let finalData = { ...result, ...data };
            return await masterData.save(finalData);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getDistrictsData(data) {
        const { type, district } = data;
        try {
            if (type && district) {
                return await AppDataSource.getRepository(master_data).query(`SELECT master_data.id, master_data.rural_urban, master_data.district, district_data.name,district_data.mobile_number 
                FROM master_data LEFT JOIN district_data ON master_data.id=district_data.unique_id where master_data.rural_urban='${type}' and district='${district}'`)
            } else if (type) {
                return await AppDataSource.getRepository(master_data).query(`SELECT master_data.id, master_data.rural_urban, master_data.district, district_data.name,district_data.mobile_number 
                FROM master_data LEFT JOIN district_data ON master_data.id=district_data.unique_id where master_data.rural_urban='${type}' GROUP BY master_data.district`);
            } else {
                return await AppDataSource.getRepository(master_data).query(`SELECT master_data.id, master_data.rural_urban, master_data.district, district_data.name,district_data.mobile_number 
                FROM master_data LEFT JOIN district_data ON master_data.id=district_data.unique_id GROUP BY master_data.district`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getReportsData(data) {
        const { type, district } = data;
        try {
            let studentsData = await AppDataSource.getRepository(students_data).query(`SELECT st.student_name as name, 
          sd.school_institute_name as details ,st.type, st.status, md.refractionist_name, md.district, md.taluka, md.sub_centre, 
          md.village, st.parent_phone_number as phone_number FROM students_data st INNER JOIN school_data sd ON 
          st.school_id=sd.school_id INNER JOIN master_data md ON st.user_id=md.user_unique_id where status='order_pending' 
          or status='ready_to_deliver' or status='delivered'`);
            let otherBenfData = await AppDataSource.getRepository(students_data).query(`SELECT ob.benf_name as name, ob.type, 
          ob.details,md.refractionist_name, md.district, md.taluka, md.sub_centre, md.village, ob.status, ob.phone_number 
          FROM other_benf_data ob INNER JOIN master_data md ON ob.user_id=md.user_unique_id where status='order_pending' or 
          status='ready_to_deliver' or status='delivered';`);
            return [...studentsData, ...otherBenfData];
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getTalukasData(data) {
        const { type, district, taluka } = data;
        try {
            if (type && district && taluka) {
                return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
                FROM master_data LEFT JOIN taluka_data ON master_data.id=taluka_data.unique_id where master_data.rural_urban='${type}' and master_data.district='${district}' and master_data.taluka='${taluka}' GROUP BY master_data.taluka`)
            } else if (type && district) {
                return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
                FROM master_data LEFT JOIN taluka_data ON master_data.id=taluka_data.unique_id where master_data.rural_urban='${type}' and master_data.district='${district}' GROUP BY master_data.taluka`);
            } else if (type) {
                return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
                FROM master_data LEFT JOIN taluka_data ON master_data.id=taluka_data.unique_id where master_data.rural_urban='${type}' GROUP BY master_data.taluka`);
            } else {
                return await AppDataSource.getRepository(taluka_data).query(`SELECT master_data.id, master_data.rural_urban, master_data.district,master_data.taluka, taluka_data.name,taluka_data.mobile_number 
                FROM master_data LEFT JOIN taluka_data ON master_data.id=taluka_data.unique_id GROUP BY master_data.taluka`);
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
};
// select * from master_data where rural_urban='rural' and district='Bagalkote(2)';
