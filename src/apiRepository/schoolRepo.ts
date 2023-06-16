import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { nanoid } from "nanoid";
import { AppDataSource } from "../dbConfig/mysql";
import { school_data, students_data } from "../entity";
import { Equal } from "typeorm";
import { generateOTP } from "../utility/resusableFun";

@Service()
export class SchoolRepo {

    async getSchoolDataById(school_id) {
        try {
            return await AppDataSource.getRepository(school_data).findOneBy({ school_id });
        } catch (e) {
            Logger.error("schoolRepo => getSchoolDataById", e)
            return e;
        }
    };
    // async findAllSchools() {
    //     try {
    //         return await AppDataSource.getRepository(school_data).count();
    //     } catch (e) {
    //         Logger.error("schoolRepo => getSchoolDataById", e)
    //         return e;
    //     }
    // };

    async findAllStudents() {
        try {
            return await AppDataSource.getRepository(students_data).query(`select student_unique_id from students_data ORDER BY id DESC LIMIT 1`);
            // return await AppDataSource.getRepository(students_data).query(`select top 1 student_unique_id from students_data ORDER BY id DESC`);
        } catch (e) {
            Logger.error("schoolRepo => findAllStudents", e)
            return e;
        }
    };

    async saveSchoolData(data: school_data) {
        try {
            let findLength = await this.findDescOrderWise();
            data.school_unique_id = (findLength?.length == 0)? 1 : findLength[0].school_unique_id + 1;
            return await AppDataSource.getTreeRepository(school_data).save(data);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async findDescOrderWise() {
        try {
            return await AppDataSource.getTreeRepository(school_data).query(`select school_unique_id from school_data ORDER BY id DESC LIMIT 1`); 
            // return await AppDataSource.getTreeRepository(school_data).query(`select top 1 school_unique_id from school_data ORDER BY id DESC`); 
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getSchoolData(data: school_data) {
        try {
            return await AppDataSource.getTreeRepository(school_data).query(`SELECT school_id, school_mail, school_incharge_contact_no, school_institute_name,village, taluk, district from school_data WHERE user_id= '${data.user_id}' and school_id='${data.school_id}'`);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e);
            return e;
        }
    };

    async changeReadyToDelivered(data: students_data) {
        try {
            let idData = await AppDataSource.getTreeRepository(students_data);
            let getData = await idData.findOneBy({student_unique_id: data.student_unique_id});
            if(!getData){
                return 422;
            } else {
                let newData = {status: "delivered", image: data.image}
                let updateResult = {...getData, ...newData};
                return idData.save(updateResult);
            }
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async changePendingToReady(data: students_data) {
        try {
            let idData = await AppDataSource.getTreeRepository(students_data);
            let getData = await idData.findOneBy({student_unique_id: data.student_unique_id});
            if(!getData){
                return 422;
            } else {
                let newData = {status: "ready_to_deliver"}
                let updateResult = {...getData, ...newData};
                return idData.save(updateResult);
            }
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllSchoolDataBy(data: school_data) {
        try {
            return await AppDataSource.getTreeRepository(school_data).query(`SELECT school_id, school_institute_name, school_incharge_contact_no, taluk, district FROM school_data WHERE user_id ='${data.user_id}'`)
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async saveStudentData(data: students_data) {
        try {
            let findCount = await this.findAllStudents();
            data.student_unique_id = (findCount?.length == 0)? 1 : findCount[0].school_unique_id + 1;
            data.order_number = generateOTP();
            return await AppDataSource.getTreeRepository(students_data).save(data);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getStudentDataById(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).query(`SELECT s.sats_id, s.dob, s.age, 
                h.school_institute_name, h.school_id, s.gender, s.father_name, s.parent_phone_number FROM students_data 
                as s INNER JOIN school_data as h ON h.school_id = '${data.school_id}' where s.user_id='${data.user_id}' and s.sats_id='${data.sats_id}'`)
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllStudentData(data: students_data) {
        try {
            let order_pending = await this.getAllOrderPending(data);
            let ready_to_deliver = await this.getAllReadyToDeliver(data);
            let delivered = await this.getAllDelivered(data);
            return {order_pending, ready_to_deliver, delivered};
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllOrderPending(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).query(`SELECT student_unique_id, student_name, order_number,sats_id, status FROM students_data WHERE status='order_pending' and user_id='${data.user_id}' and school_id='${data.school_id}'`);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllReadyToDeliver(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).query(`SELECT student_unique_id, student_name, order_number,sats_id, status FROM students_data WHERE status='ready_to_deliver' and user_id='${data.user_id}' and school_id='${data.school_id}'`);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllDelivered(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).query(`SELECT student_unique_id, student_name, order_number,sats_id, status FROM students_data WHERE status='delivered' and user_id='${data.user_id}' and school_id='${data.school_id}'`);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async updateSchoolById(data: school_data) {
        try {
            let schoolDataBase = AppDataSource.getRepository(school_data);
            let result = await schoolDataBase.findOneBy({ school_id: Equal(data.school_id), user_id: Equal(data.user_id) });
            if (!result) {
                return 422;
            } else {
                let finalData = { ...result, ...data }
                return await schoolDataBase.save(finalData);
            }
        } catch (e) {
            Logger.error("schoolRepo => updateSchoolById", e)
            return e;
        }
    };

    async updateStudentData(data: students_data) {
        try {
            let studentDataBase = AppDataSource.getRepository(students_data);
            let result = await studentDataBase.findOneBy({ school_id: data.school_id, user_id: data.user_id, sats_id: data.sats_id });
            if (!result) {
                return 422;
            } else {
                data.status = "order_pending";
                let finalData = { ...result, ...data }
                return await studentDataBase.save(finalData);
            }
        } catch (e) {
            Logger.error("schoolRepo => updateSchoolById", e)
            return e;
        }
    };
} 