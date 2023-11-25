import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { school_data, students_data } from "../entity";
import { SchoolRepo } from "../apiRepository/schoolRepo";
import { KutumbaDetails } from "../utility/kutumbaDetails";
import { RESPONSEMSG } from "../utility/statusCodes";
import { emailSender } from "../dbConfig/emailConfig";
import schedule from "node-schedule";
import { trackExternalLogs } from "../utility/trackerLog";
import { ACCESS_DENIED, COMPLETED, DATA_SAVED, ORDER_PENDING, Tables } from "../utility/constants";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { createUniqueIdBasedOnCodes } from "../utility/resusableFun";

const schoolDataAssignToLocal = (res) => {
    let reqObj: any = {};
    reqObj['school_institute_name'] = res.institute_name;
    reqObj['district'] = res.district;
    reqObj['address'] = res.address;
    reqObj['h_block'] = res.h_block;
    reqObj['school_incharge_contact_no'] = res.incharge_contact_no;
    reqObj['school_incharge_name'] = res.incharge_name;
    reqObj['village'] = res.village;
    return reqObj;
}

const studentDataAssignToLocal = (res) => {
    let reqObj: any = {};
    reqObj['student_name'] = res?.childName || "";
    reqObj['father_name'] = res?.fatherName || "";
    reqObj['parent_phone_number'] = res?.contactNo || "";
    reqObj['mother_name'] = res?.motherName || "";
    return reqObj;
};

@Service()
export class SchoolServices {
    constructor(public SchoolRepo: SchoolRepo, public SMSServices: SMSServices, public KutumbaDetails: KutumbaDetails) { }

    async getSchoolDataByOutSource(data: school_data) {
        try {
            if (!data?.school_id || !data.user_id) return { code: 422, message: "school id and user id is mandatory." };
            let req = { sats_code: data.school_id }
            let getSchoolData = await this.KutumbaDetails.getSchoolDataFromExternal(req, "school");
            if (getSchoolData == 500) return { code: 422, message: ACCESS_DENIED }
            let reqObj = schoolDataAssignToLocal(getSchoolData[0])
            reqObj.user_id = data.user_id;
            reqObj.school_id = data?.school_id;
            let DuplicateUser = await this.SchoolRepo.getOnlySchool(reqObj);
            if (DuplicateUser) {
                if (DuplicateUser.applicationStatus !== COMPLETED) {
                    return { message: DATA_SAVED };
                } else {
                    return { code: 422, message: "School Already Registered." };
                }
                // let checkSchoolDataById = await this.SchoolRepo.getSchoolData(reqObj);
                // if (checkSchoolDataById.length == 0) return { code: 422, message: "School id is already added." }
                // await this.SchoolRepo.updateSchoolById(reqObj);
                // return { message: "Data saved." };
            } else {
                await this.SchoolRepo.saveSchoolData(reqObj);
                return { message: DATA_SAVED };
            }
        } catch (e) {
            Logger.error("SchoolServices ======= getSchoolDataByOutSource", e);
            return e;
        }
    };
    async getStudentDataByOutSource(data: students_data) {
        try {
            if (!data?.school_id || !data.user_id || !data?.sats_id) return { code: 422, message: "School And Sats And User id Field Required." };
            let checkDuplicates = await this.SchoolRepo.checkDuplicatesWithSats(data.sats_id);
            if (checkDuplicates) return { code: 422, message: `You Are Already Applied With Beneficiary. This Is Your Order Number ${checkDuplicates.order_number}` };
            let req = { satsCode: data.sats_id }
            let getSchoolData = await this.KutumbaDetails.getSchoolDataFromExternal(req, "child");
            if (getSchoolData == 500) return { code: 422, message: ACCESS_DENIED }
            let reqObj = studentDataAssignToLocal(getSchoolData[0])
            reqObj.user_id = data.user_id;
            reqObj.school_id = data.school_id;
            reqObj.sats_id = data.sats_id;
            let duplicateUser = await this.SchoolRepo.getOnlyStudent(reqObj);
            if (duplicateUser) {
                if (duplicateUser.applicationStatus !== COMPLETED) {
                    return { message: DATA_SAVED };
                } else {
                    return { code: 422, message: `Your Already Registered With Order Number ${duplicateUser?.order_number}.` };
                }
            } else {
                await this.SchoolRepo.saveStudentData(reqObj);
                return { message: DATA_SAVED };
            }
        } catch (e) {
            Logger.error("SchoolServices ==== getStudentDataByOutSource", e);
            return e;
        }
    };

    async getSchoolData(data: school_data) {
        try {
            if (!data?.school_id || !data.user_id) return { code: 422, message: "School id and user id is mandatory." };
            let result = await this.SchoolRepo.getSchoolData(data);
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            Logger.error("SchoolServices ================= getSchoolData", e);
            return e;
        }
    }

    async changeReadyToDelivered(data: students_data) {
        try {
            if (!data?.student_unique_id) return { code: 422, message: "Id is mandatory." };
            let result = await this.SchoolRepo.changeReadyToDelivered(data);
            return (result == 422) ? { code: 422, message: "Update Failed" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            Logger.error("schoolservice ===== changeReadyToDelivered", e);
            return e;
        }
    }

    async changePendingToReady(data: students_data) {
        try {
            if (!data?.student_unique_id) return { code: 422, message: "Id is mandatory." };
            let result = await this.SchoolRepo.changePendingToReady(data);
            return (result == 422) ? { code: 422, message: "Update Failed" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            Logger.error("schoolservice ===== changePendingToReady", e);
            return e;
        }
    }

    async getAllSchoolDataBy(data: school_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "User id is mandatory." };
            let result = await this.SchoolRepo.getAllSchoolDataBy(data);
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            Logger.error("schoolservice ===== getAllSchoolDataBy", e);
            return e;
        }
    }

    async updaetOrSaveSchoolData(data: school_data) {
        try {
            if (!data?.school_id || !data?.user_id) return { code: 422, message: "School id and user id is mandatory." };
            let result = await this.SchoolRepo.updateSchoolById(data);
            return (result == 422) ? { code: 422, message: "Update Failed" } : { message: RESPONSEMSG.UPDATE_SUCCESS }
        } catch (e) {
            Logger.error("schoolservice ===== servicesgetSchoolData", e);
            return e;
        }
    }

    async getStudentData(data: students_data) {
        try {
            if (!data?.school_id || !data?.user_id || !data?.sats_id) return { code: 422, message: "School id, user id and sats id is mandatory." };
            let result = await this.SchoolRepo.getStudentDataById(data);
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            Logger.error("schoolservice ===== getStudentData", e);
            return e;
        }
    };

    async sendMailTOSchoolMail(data: school_data) {
        try {
            if (!data?.school_id || !data.user_id) return { code: 422, message: "School id, user id and sats id is mandatory." };
            data['type'] = "r";
            let result = await this.SchoolRepo.getSchoolData(data);
            if (result.length == 0) return { code: 422, message: "Data not exists." };
            if (!result[0].school_mail) return { code: 422, message: "Mail not exists." }
            const date: any = new Date(Date.now() + 2000);
            // const date: any = new Date(Date.now() + 217800000); 
            //------- adding 6 hours
            const endTime = new Date(date.getTime() + 1000);
            await schedule.scheduleJob({ start: date, end: endTime, rule: '*/1 * * * * *' }, async function () {
                await trackExternalLogs(Tables.STUDENT, "sent mail", "", '', '', data.user_id);
                let mailSend = await emailSender({ ...result, ...data });
                if (mailSend == 422) return { code: 422, message: RESPONSEMSG.MAIL_FAILED };
                Logger.info("mail send ", mailSend);
                return mailSend;
            });
            return { message: "Mail Will Send After 6 Hours." };
        } catch (e) {
            Logger.error("schoolservice ===== sendMailTOSchoolMail", e);
            return e;
        }
    };

    async sendMailTOSchoolMailDelivered(data: school_data) {
        try {
            if (!data?.school_id || !data.user_id) return { code: 422, message: "School id, user id is mandatory." };
            data['type'] = "d";
            let result = await this.SchoolRepo.getSchoolData(data);
            if (result.length == 0) return { code: 422, message: "Data not exists." };
            if (!result[0].school_mail) return { code: 422, message: "Mail not exists." }
            // const date: any = new Date(Date.now() + 60000);
            const date: any = new Date(Date.now() + 2000);
            // const date: any = new Date(Date.now() + 217800000);
            // ------- adding 6 hours
            const endTime = new Date(date.getTime() + 1000);
            await schedule.scheduleJob({ start: date, end: endTime, rule: '*/1 * * * * *' }, async function () {
                await trackExternalLogs(Tables.STUDENT, "sent mail", "", '', '', data.user_id);
                let mailSend = await emailSender({ ...result, ...data });
                if (mailSend == 422) return { code: 422, message: RESPONSEMSG.MAIL_FAILED }
                Logger.info("mail send ", mailSend);
                return mailSend;
            });
            return { message: "mail will send after 6 hours." }
        } catch (e) {
            Logger.error("schoolservice ===== sendMailTOSchoolMailDelivered", e);
            return e;
        }
    };

    async getAllStudentData(data: students_data) {
        try {
            if (!data?.school_id || !data?.user_id) return { code: 422, message: "school id, user id and is is mandatory." };
            let result = await this.SchoolRepo.getAllStudentData(data);
            return (!result) ? { code: 422, message: "Data not exists." } : { ...result, ...data };
        } catch (e) {
            Logger.error("schoolservice ===== getAllStudentData", e);
            return e;
        }
    }
    async getImageStudentWise(data: students_data) {
        try {
            let result = await this.SchoolRepo.getImageStudentWise(data);
            return result;
        } catch (e) {
            Logger.error("schoolservice ===== getAllStudentData", e);
            return e;
        }
    }

    async getAllDelivered(data: students_data) {
        try {
            if (!data?.school_id || !data?.user_id) return { code: 422, message: "school id, user id and is is mandatory." };
            let result = await this.SchoolRepo.getAllDelivered(data);
            return (result?.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            Logger.error("schoolservice ===== getAllDelivered", e);
            return e;
        }
    }

    async updateStudentData(data: students_data) {
        try {
            if (!data?.school_id || !data?.user_id || !data?.sats_id) return { code: 422, message: "School id, user id and sats is is mandatory." };
            let result = await this.SchoolRepo.updateStudentData(data)
            return (result == 422) ? { code: 422, message: "Update Failed" } : { message: RESPONSEMSG.UPDATE_SUCCESS }
        } catch (e) {
            Logger.error("schoolservice ===== updateStudentData", e);
            return e;
        }
    }

    async allExternalApis(data: students_data) {
        const { type, id } = data;
        try {
            if (type == 'school') {
                let req = { sats_code: id }
                return await this.KutumbaDetails.getSatsChecking(req, "school");
            } else if (type == 'child') {
                let req = { satsCode: id }
                return await this.KutumbaDetails.getSatsChecking(req, "child");
            } else if (type == "kutumba") {
                return await this.KutumbaDetails.KutumbDetailsForPersonChecking(data);
            }
        } catch (e) {
            Logger.error("schoolservice ===== allExternalApis", e);
            return e;
        }
    };

    async bulkUploadStudentsData(eachRow) {
        try {
            let req = { sats_code: eachRow.school_id }
            let getSchoolData = await this.KutumbaDetails.getSchoolDataFromExternal(req, "school");

            if (getSchoolData == 500) {
                return { ...eachRow, ...{ Error: "School Id Not Found." } }
            } else {
                let mapSchoolData = schoolDataAssign(eachRow);
                let schoolData = await AppDataSource.getRepository(school_data);
                let findData = await schoolData.findOneBy({ school_id: mapSchoolData.school_id })
                let newData = { ...findData, ...mapSchoolData };
                await schoolData.save(newData);
                // studentData
                let checkDuplicates = await this.SchoolRepo.checkDuplicatesWithSats(eachRow.sats_id);
                if (checkDuplicates) {
                    return { ...eachRow, ...{ Error: `You Are Already Applied With Beneficiary. This Is Your Order Number ${checkDuplicates.order_number}` } };
                } else {
                    let req = { satsCode: eachRow.sats_id }
                    let getStudentsData = await this.KutumbaDetails.getSchoolDataFromExternal(req, "child");
                    if (getStudentsData == 500) {
                        return { ...eachRow, ...{ Error: `Student Id Not Found.` } };
                    } else {
                        let mappedStudents = await studentDataAssign(eachRow);
                        let duplicateUser = await AppDataSource.getRepository(students_data);
                        let findSats = await duplicateUser.findOneBy({ sats_id: mappedStudents.sats_id });
                        let newData = { ...findSats, ...mappedStudents };
                        await duplicateUser.save(newData);
                    }
                }
            }
        } catch (e) {
            Logger.error("schoolservice ===== allExternalApis", e);
            return e;
        }
    }

}

const schoolDataAssign = (res) => {
    let reqObj = new school_data({});
    reqObj['school_institute_name'] = res?.school_name;
    reqObj['district'] = res?.District || "";
    reqObj['address'] = res?.address || "";
    reqObj['h_block'] = res?.h_block || "";
    reqObj['school_incharge_contact_no'] = res.HeadMater_mobile || "";
    reqObj['school_mail'] = res.school_mail || "";
    reqObj['school_incharge_name'] = res?.HeadMaster_name || "";
    reqObj['village'] = res?.village || "";
    reqObj.user_id = res.user_id || "";
    reqObj.school_id = res?.school_id || "";
    reqObj.applicationStatus = COMPLETED;
    reqObj.school_unique_id = 'SC' + String(new Date().getTime()).slice(7,14) + new Date().getMilliseconds();
    return reqObj;
};

const studentDataAssign =  async (res) => {
    let reqObj = new students_data({});
    reqObj['student_name'] = res?.student_name || "";
    reqObj['father_name'] = res?.father_name || "";
    reqObj['dob'] = res?.dob || "";
    reqObj['age'] = res?.age || "";
    reqObj['parent_phone_number'] = res?.parent_mobile || "";
    reqObj['mother_name'] = res?.motherName || "";
    reqObj.user_id = res?.user_id || "";
    reqObj.school_id = res?.school_id || "";
    reqObj.sats_id = res?.sats_id || "";
    reqObj.refractionist_name = res?.refractionist_name || "";
    reqObj.refractionist_mobile = res?.refractionist_mobile || "";
    reqObj.gender = res?.gender || "";
    reqObj.right_eye_sph_plus = res?.right_sph.includes("-") == true ? "" : res?.right_sph.replace('+', '');
    reqObj.right_eye_sph_minus = res?.right_sph.includes("-") == true ? res?.right_sph.replace('-', '') : "";
    reqObj.right_eye_cyl_plus = res?.right_cyl.includes("-") == true ? "" : res?.right_cyl.replace('+', '');
    reqObj.right_eye_cyl_minus = res?.right_cyl.includes("-") == true ? res?.right_cyl.replace('-', '') : "";
    reqObj.right_eye_axis = res?.right_axis || "";
    reqObj.right_eye_va = res?.right_va || "";
    reqObj.left_eye_sph_plus = res?.left_sph.includes("-") == true ? "" : res?.left_sph.replace('+', '');
    reqObj.left_eye_sph_minus = res?.left_sph.includes("-") == true ? res?.left_sph.replace('-', '') : "";
    reqObj.left_eye_cyl_plus = res?.left_cyl.includes("-") == true ? "" : res?.left_cyl.replace('+', '');
    reqObj.left_eye_cyl_minus = res?.left_cyl.includes("-") == true ? res?.left_cyl.replace('-', '') : "";
    reqObj.left_eye_axis = res?.left_axis || "";
    reqObj.left_eye_va = res?.left_va || "";
    reqObj.frame_size = res?.frame_size || "";
    reqObj.frame_type = res?.frame_type || "";
    reqObj.applicationStatus = COMPLETED;
    reqObj.district = res?.District || "";
    reqObj.status = ORDER_PENDING;
    reqObj.type = 'school';
    reqObj.village = res?.village || "";
    reqObj.order_number = await createUniqueIdBasedOnCodes(res?.user_id, 'school');
    reqObj.student_unique_id =  'ST' + String(new Date().getTime()).slice(7,14) + new Date().getMilliseconds();
    return reqObj;
}
