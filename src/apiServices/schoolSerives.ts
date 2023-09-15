import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { school_data, students_data } from "../entity";
import { SchoolRepo } from "../apiRepository/schoolRepo";
import { KutumbaDetails } from "../utility/kutumbaDetails";
import { RESPONSEMSG } from "../utility/statusCodes";
import { emailSender } from "../dbConfig/emailConfig";
import schedule from "node-schedule";
import { trackExternalLogs } from "../utility/trackerLog";
import { ACCESS_DENIED, COMPLETED, DATA_SAVED, Tables } from "../utility/constants";
import Logger from "../utility/winstonLogger";

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
    reqObj['student_name'] = res.childName;
    reqObj['father_name'] = res.fatherName;
    reqObj['parent_phone_number'] = res.contactNo;
    reqObj['mother_name'] = res.motherName;
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
                if(DuplicateUser.applicationStatus !== COMPLETED){
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
            if(checkDuplicates) return {code:422, message: `You Are Already Applied With Beneficiary. This Is Your ${checkDuplicates.order_number}`};
            let req = { satsCode: data.sats_id }
            let getSchoolData = await this.KutumbaDetails.getSchoolDataFromExternal(req, "child");
            if (getSchoolData == 500) return { code: 422, message: ACCESS_DENIED }
            let reqObj = studentDataAssignToLocal(getSchoolData[0])
            reqObj.user_id = data.user_id;
            reqObj.school_id = data.school_id;
            reqObj.sats_id = data.sats_id;
            let duplicateUser = await this.SchoolRepo.getOnlyStudent(reqObj);
            if (duplicateUser) {
                if(duplicateUser.applicationStatus !== COMPLETED){
                    return { message: DATA_SAVED };
                } else {
                    return { code: 422, message: `Your Already Registered With ${duplicateUser?.order_number}.` };
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
                        let mailSend = await emailSender({...result, ...data});
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
                console.log("result", result)
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
                console.log("Res",result)
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

    async filterByValuesWise(data) {
        try {
            return await this.SchoolRepo.filterByValuesWise(data);
        } catch (e) {
            Logger.error("schoolservice ===== filterByValuesWise", e);
            return e;
        }
    }
}
