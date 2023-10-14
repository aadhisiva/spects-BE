import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { master_data, other_benf_data, school_data, students_data } from "../entity";
import { Between, Equal, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { createUniqueIdBasedOnCodes } from "../utility/resusableFun";
import { COMPLETED, DELIVERED, ORDER_PENDING, READY_TO_DELIVER } from "../utility/constants";

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

    async checkDuplicatesWithSats(data) {
        try {
            return await AppDataSource.getTreeRepository(other_benf_data).findOneBy({ education_id: data });;
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

    async getAllSchoolDataBy(data) {
        try {
            const { pagination, take, skip } = data;
            if (pagination == 'Yes') {
                let totalData = await AppDataSource.getTreeRepository(school_data).createQueryBuilder('child')
                    .select(['child.school_unique_id as school_unique_id', 'child.school_id as school_id', 'child.school_institute_name as school_institute_name',
                        'child.school_incharge_contact_no as school_incharge_contact_no', 'child.taluk as taluk', 'child.district as district'])
                    .where("child.user_id= :user_id", { user_id: data?.user_id })
                    .orderBy('child.school_unique_id')
                    .skip(skip)
                    .take(take)
                    .getRawMany();
                return {
                    take: take,
                    skip: skip,
                    totalData
                };
            } else {
                return await AppDataSource.getTreeRepository(school_data).query(`SELECT school_id, school_institute_name, 
                    school_incharge_contact_no, taluk, district FROM school_data WHERE user_id ='${data.user_id}'`)
            }
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async saveStudentData(data: any) {
        try {
            let findCount = await this.findAllStudents();
            data.student_unique_id = (findCount?.length == 0) ? 1 : `${Number(findCount[0].student_unique_id) + 1}`;
            data.order_number = await createUniqueIdBasedOnCodes(data.user_id, 'school');
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
            as s INNER JOIN school_data as h ON s.school_id=h.school_id where s.user_id='${data.user_id}' and s.sats_id='${data.sats_id}' and s.school_id='${data.school_id}';`)
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

    async getAllStudentData(data) {
        try {
            const { pagination, take, skip, user_id, school_id } = data;
            if (pagination == 'Yes') {
                let pending_count = await AppDataSource.getRepository(students_data).countBy({ user_id: user_id, school_id: school_id, status: ORDER_PENDING, applicationStatus: COMPLETED });
                let ready_count = await AppDataSource.getRepository(students_data).countBy({ user_id: user_id, school_id: school_id, status: READY_TO_DELIVER, applicationStatus: COMPLETED });
                let delivered_count = await AppDataSource.getRepository(students_data).countBy({ user_id: user_id, school_id: school_id, status: DELIVERED, applicationStatus: COMPLETED });
                let totalData = await AppDataSource.getTreeRepository(students_data).createQueryBuilder('child')
                    .select(['child.student_unique_id as student_unique_id', 'child.order_number as order_number',
                        'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
                    .where("child.user_id= :user_id and child.school_id= :school_id and applicationStatus= :appStatus",
                        { user_id: user_id, school_id: school_id, appStatus: COMPLETED })
                    .orderBy('child.student_unique_id')
                    .skip(skip)
                    .take(take)
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
                let pending_count = await AppDataSource.getRepository(students_data).countBy({ user_id: data.user_id, status: ORDER_PENDING, applicationStatus: COMPLETED })
                let ready_count = await AppDataSource.getRepository(students_data).countBy({ user_id: data.user_id, status: READY_TO_DELIVER, applicationStatus: COMPLETED })
                let delivered_count = await AppDataSource.getRepository(students_data).countBy({ user_id: data?.user_id, status: DELIVERED, applicationStatus: COMPLETED });
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
            }
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
                .where("child.user_id= :user_id and child.school_id= :school_id and child.status= :status and applicationStatus= :appStatus",
                    { user_id: data?.user_id, school_id: data?.school_id, status: ORDER_PENDING, appStatus: COMPLETED }).getRawMany();
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getImageStudentWise(data: students_data) {
        try {
            return await AppDataSource.getTreeRepository(students_data).query(`select image from students_data where student_unique_id='${data.student_unique_id}'`);
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
                .where("child.user_id= :user_id and child.school_id= :school_id and child.status= :status and applicationStatus= :appStatus",
                    { user_id: data?.user_id, school_id: data?.school_id, status: READY_TO_DELIVER, appStatus: COMPLETED }).getRawMany();
        } catch (e) {
            Logger.error("schoolRepo => postSchoolData", e)
            return e;
        }
    };

    async getAllDelivered(data) {
        try {
            const { pagination, take, skip, user_id, school_id } = data;
            if (pagination == 'Yes') {
                let pending_count = await AppDataSource.getRepository(students_data).countBy({ user_id: user_id, school_id: school_id, status: ORDER_PENDING, applicationStatus: COMPLETED });
                let ready_count = await AppDataSource.getRepository(students_data).countBy({ user_id: user_id, school_id: school_id, status: READY_TO_DELIVER, applicationStatus: COMPLETED });
                let delivered_count = await AppDataSource.getRepository(students_data).countBy({ user_id: user_id, school_id: school_id, status: DELIVERED, applicationStatus: COMPLETED });
                let totalData = await AppDataSource.getTreeRepository(students_data).createQueryBuilder('child')
                    .select(['child.student_unique_id as student_unique_id', 'child.order_number as order_number',
                        'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
                    .where("child.user_id= :user_id and child.school_id= :school_id and child.status= :status and applicationStatus= :appStatus",
                        { user_id: data?.user_id, school_id: data?.school_id, status: DELIVERED, appStatus: COMPLETED })
                    .orderBy('child.student_unique_id')
                    .skip(skip)
                    .take(take)
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
                return await AppDataSource.getTreeRepository(students_data).createQueryBuilder('child')
                    .select(['child.student_unique_id as student_unique_id', 'child.order_number as order_number',
                        'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
                    .where("child.user_id= :user_id and child.school_id= :school_id and child.status= :status and applicationStatus= :appStatus",
                        { user_id: data?.user_id, school_id: data?.school_id, status: DELIVERED, appStatus: COMPLETED })
                    .getRawMany();
            }
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
                data.applicationStatus = "Completed";
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
            const { user_id } = data;
            let studentDataBase = await AppDataSource.getRepository(students_data);
            let refractionistData = await AppDataSource.getRepository(master_data).findOneBy({unique_id: user_id});
            let result = await studentDataBase.findOneBy({ school_id: data.school_id, user_id: data.user_id, sats_id: data.sats_id });
            if (!result) {
                return 422;
            } else {
                data.status = ORDER_PENDING;
                data.type = "school";
                data.applicationStatus = "Completed";
                data.refractionist_name = refractionistData.refractionist_name;
                data.refractionist_mobile = refractionistData.refractionist_mobile
                let finalData = { ...result, ...data }
                return await studentDataBase.save(finalData);
            }
        } catch (e) {
            Logger.error("schoolRepo => updateSchoolById", e)
            return e;
        }
    };

} 