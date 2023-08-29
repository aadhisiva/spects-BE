import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { other_benf_data, school_data, students_data } from "../entity";
import { Between, Equal, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { createUniqueIdBasedOnCodes } from "../utility/resusableFun";

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

    async findAllStudents() {
        try {
            return await AppDataSource.getRepository(students_data).query(`select top 1 student_unique_id from students_data ORDER BY id DESC`);
        } catch (e) {
            Logger.error("schoolRepo => findAllStudents", e)
            return e;
        }
    };

    async saveSchoolData(data: any) {
        try {
            let findLength = await this.findDescOrderWise();
            data.school_unique_id = (findLength?.length == 0) ? 1 : `${Number(findLength[0].school_unique_id) + 1}`;
            return await AppDataSource.getTreeRepository(school_data).save(data);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async findDescOrderWise() {
        try {
            return await AppDataSource.getTreeRepository(school_data).query(`select top 1 school_unique_id from school_data ORDER BY id DESC`);
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

    async getOnlySchool(data: school_data) {
        try {
            return await AppDataSource.getTreeRepository(school_data).findOneBy({ school_id: Equal(data.school_id) });
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e);
            return e;
        }
    };

    async changeReadyToDelivered(data: students_data) {
        try {
            let idData = await AppDataSource.getTreeRepository(students_data);
            let getData = await idData.findOneBy({ student_unique_id: data.student_unique_id });
            if (!getData) {
                return 422;
            } else {
                let newData = { status: "delivered", image: data.image }
                let updateResult = { ...getData, ...newData };
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
            let getData = await idData.findOneBy({ student_unique_id: data.student_unique_id });
            if (!getData) {
                return 422;
            } else {
                let newData = { status: "ready_to_deliver" }
                let updateResult = { ...getData, ...newData };
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

    async saveStudentData(data: any) {
        try {
            let findCount = await this.findAllStudents();
            data.student_unique_id = (findCount?.length == 0) ? 1 :`${Number(findCount[0].student_unique_id) + 1}`;
            data.order_number = await createUniqueIdBasedOnCodes(data.user_id);
            return await AppDataSource.getTreeRepository(students_data).save(data);
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getStudentDataById(data: students_data) {
        try {
            let result = await AppDataSource.getTreeRepository(students_data).query(`SELECT s.sats_id, s.dob, s.age,h.address, s.order_number,  
            h.school_institute_name, s.student_name, h.school_id, s.gender, s.father_name, s.parent_phone_number FROM students_data 
            as s INNER JOIN school_data as h ON s.school_id ='${data.school_id}' where s.user_id='${data.user_id}' and s.sats_id='${data.sats_id}';`)
            return result;
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getOnlyStudent(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).findOneBy({ sats_id: Equal(data.sats_id) });
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllStudentData(data: students_data) {
        try {
            let pending_count = await AppDataSource.getRepository(students_data).countBy({ user_id: data.user_id, status: 'order_pending' })
            let ready_count = await AppDataSource.getRepository(students_data).countBy({ user_id: data.user_id, status: 'ready_to_deliver' })
            let delivered_count = await AppDataSource.getRepository(students_data).countBy({ user_id: data?.user_id, status: 'delivered' });
            let order_pending = await this.getAllOrderPending(data);
            let ready_to_deliver = await this.getAllReadyToDeliver(data);
            let delivered = await this.getAllDelivered(data);
            return {
                total: Number(pending_count) + Number(ready_count) + Number(delivered_count),
                pending_count: pending_count,
                ready_count: ready_count,
                delivered_count: delivered_count,
                order_pending,
                ready_to_deliver,
                delivered
            };
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllOrderPending(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).createQueryBuilder('child')
                .select(['child.student_unique_id as student_unique_id', 'child.order_number as order_number',
                    'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
                .where("child.user_id= :user_id and child.school_id= :school_id and child.status= :status",
                    { user_id: data?.user_id, school_id: data?.school_id, status: 'order_pending' }).getRawMany();
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllReadyToDeliver(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).createQueryBuilder('child')
                .select(['child.student_unique_id as student_unique_id', 'child.order_number as order_number',
                    'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
                .where("child.user_id= :user_id and child.school_id= :school_id and child.status= :status",
                    { user_id: data?.user_id, school_id: data?.school_id, status: 'ready_to_deliver' }).getRawMany();
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllDelivered(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).createQueryBuilder('child')
                .select(['child.student_unique_id as student_unique_id', 'child.order_number as order_number',
                    'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
                .where("child.user_id= :user_id and child.school_id= :school_id and child.status= :status",
                    { user_id: data?.user_id, school_id: data?.school_id, status: 'delivered' }).getRawMany();
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
                data.type = "school";
                let finalData = { ...result, ...data }
                return await studentDataBase.save(finalData);
            }
        } catch (e) {
            Logger.error("schoolRepo => updateSchoolById", e)
            return e;
        }
    };

    async filterByValuesWise(data) {
        const { type, user_id, school_id, sats_id, status, state_date, end_date } = data;
        try {
            if (!user_id && !type) return { code: 422, message: "User Id, Type And Status Required." };
            if (type == "school") {
                if (!school_id) return { code: 422, message: "School Id Required." };
                if (!sats_id) return { code: 422, message: "Sats Id Required." };
                if (!status) return { code: 422, message: "Status Id Required." };
                if (!state_date && !end_date) {
                    return await AppDataSource.getRepository(students_data).find(
                        {
                            where: {
                                user_id: Equal(user_id),
                                school_id: Equal(school_id),
                                sats_id: Equal(sats_id),
                                status: Equal(status),
                            }
                        });
                } else {
                    return await AppDataSource.getRepository(students_data).find(
                        {
                            where: {
                                user_id: Equal(user_id),
                                school_id: Equal(school_id),
                                sats_id: Equal(sats_id),
                                status: Equal(status),
                                created_at: Between(new Date(state_date), new Date(end_date))
                            }
                        });
                }
            } else if (type == "other") {
                if (!status) return { code: 422, message: "Status Id Required." };
                if (!state_date && !end_date) return { code: 422, message: "Dates are Required." };
                return await AppDataSource.getRepository(other_benf_data).find(
                    {
                        where:
                        {
                            user_id: Equal(user_id),
                            status: Equal(status),
                            created_at: Between(new Date(state_date), new Date(end_date))
                        }
                    });
            } else {
                return { code: 422, message: "Enter ProperType." };
            };
        } catch (e) {
            Logger.error("schoolRepo => updateSchoolById", e)
            return e;
        }
    };
} 