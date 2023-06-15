import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { school_data, students_data } from "../entity";
import { SchoolRepo } from "../apiRepository/schoolRepo";
import { KutumbaDetails } from "../utility/kutumbaDetails";

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
            if (data?.school_id && data.user_id) {
                let req = { sats_code: data.school_id }
                let getSchoolData = await this.KutumbaDetails.getSchoolDataFromExternal(req, "school");
                console.log("back", getSchoolData)
                if (getSchoolData == 500) {
                    return { code: 422, message: "Third party api is not working." }
                } else {
                    let reqObj = schoolDataAssignToLocal(getSchoolData[0])
                    reqObj.user_id = data.user_id;
                    reqObj.school_id = data?.school_id;
                    let checkSchoolDataById = await this.SchoolRepo.getSchoolData(reqObj);
                    if (!checkSchoolDataById) {
                        let response = await this.SchoolRepo.saveSchoolData(reqObj);
                        return response;
                    } else {
                        return await this.SchoolRepo.updateSchoolById(reqObj)
                    }
                }
            } else {
                return { code: 422, message: "school id and user id is mandatory." }
            }
        } catch (e) {
            console.log("SchoolServices ======= getSchoolDataByOutSource", e);
            return e;
        }
    };
    async getStudentDataByOutSource(data: students_data) {
        try {
            if (data?.school_id && data.user_id && data?.sats_id) {
                let req = { satsCode: data.sats_id }
                let getSchoolData = await this.KutumbaDetails.getSchoolDataFromExternal(req, "child");
                console.log("back", getSchoolData)
                if (getSchoolData == 500) {
                    return { code: 422, message: "Third party api is not working." }
                } else {
                    let reqObj = studentDataAssignToLocal(getSchoolData[0])
                    reqObj.user_id = data.user_id;
                    reqObj.school_id = data.school_id;
                    reqObj.sats_id = data.sats_id;
                    let checkSatsDataById = await this.SchoolRepo.getStudentDataById(reqObj);
                    if (!checkSatsDataById) {
                        let response = await this.SchoolRepo.saveStudentData(reqObj);
                        return response;
                    } else {
                        return await this.SchoolRepo.updateSchoolById(reqObj)
                    }
                }
            } else {
                return { code: 422, message: "school id, user id and sats id is mandatory." }
            }
        } catch (e) {
            console.log("SchoolServices ==== getStudentDataByOutSource", e);
            return e;
        }
    };

    async getSchoolData(data: school_data) {
        try {
            if (data?.school_id && data.user_id) {
                let result = await this.SchoolRepo.getSchoolData(data);
                return (!result) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "school id and user id is mandatory." }
            }
        } catch (e) {
            console.log("servicesgetSchoolData", e);
            return e;
        }
    }

    async changePendingToReadyToDeliver(data: students_data) {
        try {
            if (data?.student_unique_id) {
                let result = await this.SchoolRepo.changePendingToReadyToDeliver(data);
                return (!result) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "Id is mandatory." }
            }
        } catch (e) {
            console.log("servicesgetSchoolData", e);
            return e;
        }
    }

    async getAllSchoolDataBy(data: school_data) {
        try {
            if (data.user_id) {
                let result = await this.SchoolRepo.getAllSchoolDataBy(data);
                return (result.length == 0) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "user id is mandatory." }
            }
        } catch (e) {
            console.log("servicesgetSchoolData", e);
            return e;
        }
    }

    async updaetOrSaveSchoolData(data: school_data) {
        try {
            if (data?.school_id && data.user_id) {
                return await this.SchoolRepo.updateSchoolById(data)
            } else {
                return { code: 422, message: "school id and user id is mandatory." }
            }
        } catch (e) {
            console.log("updaetOrSaveSchoolData", e);
            return e;
        }
    }

    async getStudentData(data: students_data) {
        try {
            if (data?.school_id && data.user_id && data?.sats_id) {
                let result = await this.SchoolRepo.getStudentDataById(data);
                return (!result) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "school id, user id and sats id is mandatory." }
            }
        } catch (e) {
            console.log("getStudentData", e);
            return e;
        }
    }

    async getAllStudentData(data: students_data) {
        try {
            if (data?.school_id && data.user_id) {
                let result = await this.SchoolRepo.getAllStudentData(data);
                return (!result) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "school id, user id and is is mandatory." }
            }
        } catch (e) {
            console.log("getStudentData", e);
            return e;
        }
    }

    async getAllDelivered(data: students_data) {
        try {
            if (data?.school_id && data.user_id) {
                let result = await this.SchoolRepo.getAllDelivered(data);
                return (result.length == 0) ? { code: 422, message: "data not exists." } : result;
            } else {
                return { code: 422, message: "school id, user id and is is mandatory." }
            }
        } catch (e) {
            console.log("getStudentData", e);
            return e;
        }
    }

    async updateStudentData(data: students_data) {
        try {
            if (data?.school_id && data.user_id && data?.sats_id) {
                return await this.SchoolRepo.updateStudentData(data)
            } else {
                return { code: 422, message: "school id, user id and sats is is mandatory." }
            }
        } catch (e) {
            console.log("updateStudentData", e);
            return e;
        }
    }
}