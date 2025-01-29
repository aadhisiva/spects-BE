import { Brackets, Equal } from "typeorm";
import jsonwebtoken, { Algorithm } from "jsonwebtoken";
import { Service } from "typedi";
import crypto from "crypto";

import { response200, response400, response404, responseForError200, responseForSpec200 } from "../utils/resBack";
import { checkEligableCandiadate, convertAadharToSha256Hex, createUniqueIdBasedOnCodes, generateOTP } from "../utils/resuableCode";
import { apiErrorHandler } from "../utils/reqResHandler";
import { repoNames, repository } from "../db/repos";
import { AADHAR_PROCESS, ACCESS_DENIED, ACCESS_DENIED_OTHER, ACCESS_DENIED_RC, COMPLETED, DELIVERED, EKYC_ACCESS_DENIED, EKYC_SUCCESS, KUTUMBA_ACCESS_DENIED, NO, ORDER_PENDING, OTHER_BENEFICIARY, PHONE_REGESTERED, READY_TO_DELIVER, RESPONSEAPI_MESSAGE, YES } from "../utils/constants";
import { demoAuthEkycProcess, ekycVerification, fetchDataFromKutumba, fetchDataFromKutumbaForCheck, getCalulateAgeFromDob, getSchoolDataFromExternal, getSchoolDataFromExternalForCheck, mappingKutmbaDetails } from "../utils/kutumba/kutumbaInt";
import { SchoolData } from "../entities/schoolData";
import { OtherBenfData } from "../entities/otherBenfData";
import { EkycData } from "../entities/ekycData";
import { OtherBenfDataDummy } from "../entities/otherBenfDataDum";
import { RESPONSEMSG } from "../utils/statusCodes";
import path from "path";
import { DemoAuthResponse } from "../entities/demoAuthResponse";
import { RcData } from "../entities/rcData";
import { sendOtpAsReadyForDeliver, sendOtpAsSingleSms, sendSmsInKannadaUnicode } from "../utils/smsServceResusable";

const options = {
  expiresIn: '12h', // Token expiration time
  algorithm: 'HS256' as Algorithm, // Use a secure algorithm (HS256 is symmetric, RS256 is asymmetric)
};

export const secretKey = crypto.randomBytes(32).toString('hex'); // Replace with a pre-shared secret key

const schoolDataAssignToLocal = (res: any) => {
  let reqObj: any = {};
  reqObj['school_institute_name'] = res.institute_name;
  reqObj['district'] = res.district;
  reqObj['address'] = res.address;
  reqObj['h_block'] = res.h_block;
  reqObj['school_incharge_contact_no'] = res.incharge_contact_no;
  reqObj['school_incharge_name'] = res.incharge_name;
  reqObj['village'] = res.village;
  return reqObj;
};

const studentDataAssignToLocal = (res: any) => {
  let reqObj: any = {};
  reqObj['student_name'] = res?.childName || "";
  reqObj['father_name'] = res?.fatherName || "";
  reqObj['parent_phone_number'] = res?.contactNo || "";
  reqObj['mother_name'] = res?.motherName || "";
  return reqObj;
};

@Service()
export class MobileController {
  constructor() { };

  async loginWithoutEncryption(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body };
    const { Mobile } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (Mobile.length !== 10) return response400(res, "Enter valid number");
    bodyData.Otp = generateOTP()
    try {
      let fetchedVersion = await repository.versionRepo.find();
      bodyData.Version = fetchedVersion[0].Version;

      let findData = await repository.userDataRepo.findOneBy({ Mobile: Equal(Mobile) });
      if (!findData) return response404(res, "User not found");
      let smsOtp = await sendOtpAsSingleSms(Mobile, bodyData.Otp);
      if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);
      let newData = { ...findData, ...bodyData };
      await repository.userDataRepo.save(newData);
      let fecthedRecord = await repository.userDataRepo.createQueryBuilder('vs')
        .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=vs.DistrictCode and md.TalukCode=vs.TalukCode and md.PhcoCode=vs.PhcoCode and md.SubCenterCode=vs.SubCenterCode')
        .select([`DISTINCT vs.UserId as UserId, 
            CONCAT('D-',md.DistrictName,'-S-',md.SubCenterName) as assignedSubCenter`
        ])
        .where("vs.Mobile = :Mobile", { Mobile: Mobile })
        .getRawMany();
      return response200(res, { Otp: bodyData?.Otp, mappedRes: fecthedRecord }, "Retireved successFully");
    } catch (error) {
      console.log(error)
      return apiErrorHandler(error, req, res);
    };
  };

  async resendOtp(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body };
    const { Mobile } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (Mobile.length !== 10) return response400(res, "Enter valid number");
    bodyData.Otp = generateOTP()
    try {
      let fetchedVersion = await repository.versionRepo.find();
      bodyData.Version = fetchedVersion[0].Version;

      let findData = await repository.userDataRepo.findOneBy({ Mobile: Equal(Mobile) });
      if (!findData) return response404(res, "User not found");
      let smsOtp = await sendOtpAsSingleSms(Mobile, bodyData.Otp);
      if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);
      let newData = { ...findData, ...bodyData };
      await repository.userDataRepo.save(newData);
      return response200(res, {}, "Retireved successFully");
    } catch (error) {
      console.log(error)
      return apiErrorHandler(error, req, res);
    };
  };

  async getSubcenters(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body };
    const { Mobile, UserId } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    try {
        let result = jsonwebtoken.sign({ UserId: UserId }, process.env.SECRET_KEY!, options)
      return response200(res, result, "Retireved successFully");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async verifyOtp(req: any, res: any): Promise<any> {
    const bodyData = { ...req.body };
    const { Mobile, Otp, UserId } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!Otp) return response400(res, "Missing 'Otp' in req formate");
    if (Mobile.length !== 10) return response400(res, "Enter valid number");
    try {
      let result = await repository.userDataRepo.findOneBy({ Mobile: Equal(Mobile) });
      if (!result) return response404(res, "User not found");
      if (result.Otp !== Otp) return response400(res, RESPONSEAPI_MESSAGE.OTP_VERFIY_FAILED);
      let findObj = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
      let newData = { ...findObj, ...{ Otp: Otp } };
      await repository.userDataRepo.save(newData);
      let token = jsonwebtoken.sign({ UserId: UserId },
        process.env.SECRET_KEY!, options)
      return response200(res, token, RESPONSEAPI_MESSAGE.OTP_VERFIY);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  /* school table apis */
  async addSchoolData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { school_id, UserId } = bodyData;

    if (!school_id) return response400(res, "Missing 'school_id' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");

    let reqForSchool = { sats_code: school_id }

    try {
      let checkDuplicate: any = await repository.schoolDataRepo.findOneBy({ school_id: Equal(school_id) });
      if (checkDuplicate) {
        if(checkDuplicate.applicationStatus == COMPLETED) return response400(res, "School Already Registered.");
        await repository.schoolDataRepo.save({ ...checkDuplicate,  ...{UserId}});
        return response200(res, {}, RESPONSEAPI_MESSAGE.FETCHED);
      } 
      let schoolData = await getSchoolDataFromExternal(reqForSchool, 'school');
      if (schoolData == 500) response404(res, "No Data Found");
      let mergedData = schoolDataAssignToLocal(schoolData[0]);
      mergedData.UserId = UserId;
      mergedData.school_id = school_id;
      await repository.schoolDataRepo.save(mergedData);
      return response200(res, {}, RESPONSEAPI_MESSAGE.DATA_SAVED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getSchoolData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { school_id, UserId } = bodyData;

    if (!school_id) return response400(res, "Missing 'school_id' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    try {
      let fecthedRecord = await repository.schoolDataRepo.find({
        where: {
          UserId: UserId, school_id: school_id
        },
        select: ['school_id', 'school_mail', 'school_incharge_contact_no', 'school_incharge_name', 'village', 'taluk', 'district', 'school_institute_name']
      });
      return response200(res, fecthedRecord, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAllSchoolsData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { pagination, take = 10, skip = 0, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (pagination !== "Yes") return response400(res, "Missing 'pagination' in req formate");
    try {
      let totalData = await repository.schoolDataRepo.createQueryBuilder('child')
        .select(['child.id as school_unique_id', 'child.school_id as school_id', 'child.school_institute_name as school_institute_name',
          'child.school_incharge_contact_no as school_incharge_contact_no', 'child.taluk as taluk', 'child.district as district'])
        .where("child.UserId= :UserId", { UserId: UserId })
        .orderBy('child.id')
        .skip(skip)
        .take(take)
        .getRawMany();
      let result = {
        take: take,
        skip: skip,
        totalData
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async UpdateSchoolData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { school_id, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!school_id) return response400(res, "Missing 'school_id' in req formate");
    try {
      let fecthedRecord = await repository.schoolDataRepo.findOneBy({ school_id: Equal(school_id), UserId: Equal(UserId) });
      if (!fecthedRecord) return response404(res, "No Data Found");
      bodyData.applicationStatus = COMPLETED;
      await repository.schoolDataRepo.save({ ...fecthedRecord, ...bodyData })
      return response200(res, {}, RESPONSEAPI_MESSAGE.UPDATED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  /* student table apis */
  async addStudentData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { sats_id, school_id, UserId } = bodyData;

    if (!school_id) return response400(res, "Missing 'school_id' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!sats_id) return response400(res, "Missing 'sats_id' in req formate");

    let reqForStudent = { satsCode: sats_id }
    try {
      let checkStudentId = await repository.otherBenfDataRepo.findOneBy({ education_id: Equal(sats_id) });
      if (checkStudentId) return response400(res, `You Are Already Applied With Beneficiary. This Is Your Order Number ${checkStudentId?.order_number}`);

      let studnetData = await getSchoolDataFromExternal(reqForStudent, 'child');
      if (studnetData == 500) return response404(res, "No Data Found");
      let mergedData = studentDataAssignToLocal(studnetData[0]);
      mergedData.UserId = UserId;
      mergedData.school_id = school_id;
      mergedData.sats_id = sats_id;
      let checkDuplicate = await repository.studentDataRepo.findOneBy({ sats_id: Equal(sats_id) });
      if (checkDuplicate) {
        if (checkDuplicate.applicationStatus == COMPLETED) return response400(res, "Studnet Already Registered.");
        //`Your Already Registered With Order Number ${duplicateUser?.order_number}.`
        await repository.studentDataRepo.save({ ...checkDuplicate, ...mergedData });
        return response200(res, {}, RESPONSEAPI_MESSAGE.DATA_UPDATED);
      };
      mergedData.order_number = await createUniqueIdBasedOnCodes(UserId, 'school');
      await repository.studentDataRepo.save(mergedData);
      return response200(res, {}, RESPONSEAPI_MESSAGE.DATA_SAVED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async ChangeStudentStatusToDeliver(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { student_unique_id, UserId, image } = bodyData;

    if (!student_unique_id) return response400(res, "Missing 'student_unique_id' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!image) return response400(res, "Missing 'image' in req formate");
    try {
      let fecthedRecord = await repository.studentDataRepo.findOneBy({ id: Equal(student_unique_id), UserId: Equal(UserId) });
      bodyData.status = DELIVERED;
      bodyData.image = image;
      await repository.studentDataRepo.save({ ...fecthedRecord, ...bodyData })
      return response200(res, {}, RESPONSEAPI_MESSAGE.UPDATED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async ChangeStudentStatusToReady(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { student_unique_id, UserId, image } = bodyData;

    if (!student_unique_id) return response400(res, "Missing 'student_unique_id' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    try {
      let fecthedRecord = await repository.studentDataRepo.findOneBy({ id: Equal(student_unique_id), UserId: Equal(UserId) });
      bodyData.status = READY_TO_DELIVER;
      await repository.studentDataRepo.save({ ...fecthedRecord, ...bodyData })
      return response200(res, {}, RESPONSEAPI_MESSAGE.UPDATED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getStudentData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { school_id, sats_id, UserId } = bodyData;

    if (!school_id) return response400(res, "Missing 'school_id' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!sats_id) return response400(res, "Missing 'sats_id' in req formate");
    try {
      let fecthedRecord = await repository.studentDataRepo.createQueryBuilder('st')
        .innerJoinAndSelect(SchoolData, 'sd', 'sd.school_id=st.school_id')
        .select([`st.sats_id as sats_id, st.dob as dob, sd.address as address, st.order_number as order_number, sd.school_institute_name as school_institute_name,
        st.student_name as student_name, st.age as age, sd.school_id as school_id, st.gender as gender, st.father_name as father_name, st.parent_phone_number as parent_phone_number`
        ])
        .where("st.UserId = :UserId and st.sats_id = :sats_id and st.school_id = :school_id", { UserId, sats_id, school_id })
        .getRawMany();
      return response200(res, fecthedRecord, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAllStudentData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { pagination, take, skip, school_id, searchTerm, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (pagination !== "Yes") return response400(res, "Missing 'pagination' in req formate");
    try {
      let deliveredCount = await repository.studentDataRepo.createQueryBuilder("child")
        .where("child.UserId= :UserId and child.school_id= :school_id and child.applicationStatus= :appStatus",
          { UserId: UserId, school_id: school_id, appStatus: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("child.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("child.student_name like :term", { term: `%${searchTerm}%` })
            .orWhere("child.sats_id like :term", { term: `%${searchTerm}%` })
            .orWhere("child.status like :term", { term: `%${searchTerm}%` })
        }))
        .getCount();
      let readyCount = await repository.studentDataRepo.createQueryBuilder("child")
        .where("child.UserId= :UserId and child.school_id= :school_id and child.applicationStatus= :appStatus",
          { UserId: UserId, school_id: school_id, appStatus: READY_TO_DELIVER })
        .andWhere(new Brackets(qb => {
          qb.where("child.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("child.student_name like :term", { term: `%${searchTerm}%` })
            .orWhere("child.sats_id like :term", { term: `%${searchTerm}%` })
            .orWhere("child.status like :term", { term: `%${searchTerm}%` })
        }))
        .getCount();
      let pendingCount = await repository.studentDataRepo.createQueryBuilder("child")
        .where("child.UserId= :UserId and child.school_id= :school_id and child.applicationStatus= :appStatus",
          { UserId: UserId, school_id: school_id, appStatus: ORDER_PENDING })
        .andWhere(new Brackets(qb => {
          qb.where("child.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("child.student_name like :term", { term: `%${searchTerm}%` })
            .orWhere("child.sats_id like :term", { term: `%${searchTerm}%` })
            .orWhere("child.status like :term", { term: `%${searchTerm}%` })
        }))
        .getCount();
      let totalData = await repository.studentDataRepo.createQueryBuilder('child')
        .select(['child.id as student_unique_id', 'child.order_number as order_number',
          'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
        .where("child.UserId = :UserId and child.school_id = :school_id and child.applicationStatus = :appStatus",
          { UserId: UserId, school_id: school_id, appStatus: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("child.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("child.student_name like :term", { term: `%${searchTerm}%` })
            .orWhere("child.sats_id like :term", { term: `%${searchTerm}%` })
            .orWhere("child.status like :term", { term: `%${searchTerm}%` })
        }))
        .orderBy('child.CreatedDate', 'DESC')
        .skip(+skip)
        .take(+take)
        .getRawMany();
      let result = {
        take: take,
        skip: skip,
        total: Number(pendingCount) + Number(readyCount) + Number(deliveredCount),
        pending_count: pendingCount,
        ready_count: readyCount,
        delivered_count: deliveredCount,
        totalData
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAllDelivereData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { pagination, take = 10, skip = 0, school_id, searchTerm, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (pagination !== "Yes") return response400(res, "Missing 'pagination' in req formate");
    try {
      let count = await repository.studentDataRepo.createQueryBuilder('child')
        .select(['child.id as student_unique_id', 'child.order_number as order_number',
          'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
        .where("child.UserId= :UserId and child.school_id= :school_id and child.status= :status and child.applicationStatus= :appStatus",
          { UserId: UserId, school_id: school_id, status: DELIVERED, appStatus: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("child.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("child.student_name like :term", { term: `%${searchTerm}%` })
            .orWhere("child.sats_id like :term", { term: `%${searchTerm}%` })
            .orWhere("child.status like :term", { term: `%${searchTerm}%` })
        }))
        .getCount();
      let totalData = await repository.studentDataRepo.createQueryBuilder('child')
        .select(['child.id as student_unique_id', 'child.order_number as order_number',
          'child.student_name as student_name', 'child.sats_id as sats_id', 'child.status as status'])
        .where("child.UserId= :UserId and child.school_id= :school_id and child.status= :status and child.applicationStatus= :appStatus",
          { UserId: UserId, school_id: school_id, status: DELIVERED, appStatus: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("child.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("child.student_name like :term", { term: `%${searchTerm}%` })
            .orWhere("child.sats_id like :term", { term: `%${searchTerm}%` })
            .orWhere("child.status like :term", { term: `%${searchTerm}%` })
        }))
        .orderBy('child.CreatedDate', 'DESC')
        .skip(+skip)
        .take(+take)
        .getRawMany();
      let result = {
        take: take,
        skip: skip,
        total: count,
        totalData
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async UpdateStudnetData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { school_id, sats_id, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!school_id) return response400(res, "Missing 'school_id' in req formate");
    if (!sats_id) return response400(res, "Missing 'sats_id' in req formate");
    try {
      let fecthedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
      if (!fecthedUser) return response404(res, "No User Found");
      let fecthedRecord = await repository.studentDataRepo.findOneBy({ school_id: Equal(school_id), UserId: Equal(UserId), sats_id: Equal(sats_id) });
      if (!fecthedRecord) return response404(res, "No Data Found");
      bodyData.applicationStatus = COMPLETED;
      bodyData.status = ORDER_PENDING;
      bodyData.type = "school";
      bodyData.refractionist_name = fecthedUser.Name;
      bodyData.refractionist_mobile = fecthedUser.Mobile;
      await repository.studentDataRepo.save({ ...fecthedRecord, ...bodyData })
      return response200(res, {}, RESPONSEAPI_MESSAGE.UPDATED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getImageStudentWise(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { student_unique_id, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!student_unique_id) return response400(res, "Missing 'student_unique_id' in req formate");
    try {
      let fecthedRecord = await repository.studentDataRepo.find({
        where:
          { id: student_unique_id, UserId: UserId }
        , select: ["image"]
      });
      return response200(res, fecthedRecord, RESPONSEAPI_MESSAGE.UPDATED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };
  /* ended student table related apis */

  /* other beneficiary table related apis */
 async checkAllApis(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { type, aadhar_no, rc_no, id } = bodyData;
    try {
    if (!type) return response400(res, "Missing 'type' in req formate");
    if(type == "KA"){
      let reqForDemoAuth = { aadhar_no: convertAadharToSha256Hex(aadhar_no) };
      let result = await fetchDataFromKutumbaForCheck(reqForDemoAuth);
      return response200(res, result, "Fetched");
    } else if(type == "KR") {
      let result = await fetchDataFromKutumbaForCheck({rc_no: rc_no});
      return response200(res, result, "Fetched");
    } else if(type == "SC") {
      let reqForSchool = { sats_code: id }
      let studnetData = await getSchoolDataFromExternalForCheck(reqForSchool, 'child');
      return response200(res, studnetData, "Fetched");
    } else if(type == "ST") {
      let reqForStudent = { satsCode: id }
      let studnetData = await getSchoolDataFromExternalForCheck(reqForStudent, 'child');
      return response200(res, studnetData, "Fetched");
    } else {
      return response400(res, "send correct type value");
    }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async addDemoAuthWithVersion(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { benfName, aadharHash, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benfName) return response400(res, "Missing 'benfName' in req formate");
    if (!aadharHash) return response400(res, "Missing 'aadharHash' in req formate");

    // let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
    try {
      let fetchAadharRecord = await repository.otherBenfDataRepo.findOneBy({ aadhar_no: Equal(aadharHash) });
      if (fetchAadharRecord?.applicationStatus == COMPLETED) return response400(res, `Already Registered With Order Number ${fetchAadharRecord.order_number}.`);
      let reqForDemoAuth = { aadhar_no: aadharHash };
      let getKutumbaData = await fetchDataFromKutumba(reqForDemoAuth);
      if (getKutumbaData !== 422 && getKutumbaData[0]?.LGD_DISTRICT_Name) {
        let kutumbaData = await mappingKutmbaDetails(getKutumbaData[0], '', '');
        let checkSatsId = await repository.studentDataRepo.findOneBy({ sats_id: Equal(kutumbaData.education_id) });
        if (checkSatsId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkSatsId.order_number}.` };
        let newData = { ...kutumbaData, ...bodyData };
        newData.benf_name = benfName;
        newData.aadhar_no = aadharHash;
        newData.type = OTHER_BENEFICIARY;
        newData.details = AADHAR_PROCESS;
        newData.status = ORDER_PENDING;
        newData.applicationStatus = COMPLETED;
        newData.ekyc_check = 'Kutumba';
        newData.order_number = await createUniqueIdBasedOnCodes(UserId, 'other');
        let fecthedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
        newData.refractionist_name = fecthedUser?.Name;
        newData.refractionist_mobile = fecthedUser?.Mobile;
        newData.UserId = UserId;
        let savedDummyData = await saveOriginalData(newData);
        if (savedDummyData?.scheme_eligability !== "Yes") return { code: 422, message: `You Are Not Eligible For ${savedDummyData.district}. Application Can Not Be Processed.` };
        await repository.otherBenfDataRepo.save(bodyData);
        return responseForSpec200(res, {}, "Data Saved SuccessFully", NO);
      } else {
        let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
        let uniqueId = new Date().getTime();
        let bodyData = {
          name: benfName || "edcs",
          uniqueId,
          txnDateTime
        }
        let check = await demoAuthEkycProcess(bodyData);
        if (check == 422) return response400(res, EKYC_ACCESS_DENIED);
        return responseForSpec200(res, { uniqueId: txnDateTime, Token: check }, RESPONSEAPI_MESSAGE.FETCHED, YES);
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async addRcDataWithVersion(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { rc_no, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!rc_no) return response400(res, "Missing 'rc_no' in req formate");

    try {
      let checkRcRecords = await repository.rcDataRepo.find({ where: { rc_no: Equal(rc_no) } });
      if (checkRcRecords.length == 0) {
        let fetchData = await fetchDataFromKutumba(bodyData);
        if (fetchData == 422) return response400(res, KUTUMBA_ACCESS_DENIED);

        for (let i = 1; i <= fetchData.length; i++) {
          let mappedData: any = await mappingEachRcData(bodyData, fetchData[i - 1], "rc");
          await repository.rcDataRepo.save(mappedData);
        };

        let fetchRcRecords = await repository.rcDataRepo.find({ where: { rc_no: Equal(rc_no) } });
        if (fetchRcRecords.length == 0) return response400(res, ACCESS_DENIED);
        (fetchRcRecords || []).map((obj: any) => (obj.phone_number.length == 10) ? obj.isPhoneNumber = "Yes" : obj.isPhoneNumber = "No");
        return response200(res, fetchRcRecords, RESPONSEAPI_MESSAGE.FETCHED);
      } else {
        (checkRcRecords || []).map((obj: any) => (obj.phone_number.length == 10) ? obj.isPhoneNumber = "Yes" : obj.isPhoneNumber = "No");
        return response200(res, checkRcRecords, RESPONSEAPI_MESSAGE.FETCHED);
      };
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async saveDemoAuthResponse(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { uniqueId, district, UserId, aadharHash, benfName } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!uniqueId) return response400(res, "Missing 'uniqueId' in req formate");
    // if (!district) return response400(res, "Missing 'district' in req formate");

    // let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
    try {
      let checkDemoTxn = await repository.demoAuthResponseRepo.findOneBy({ txnNo: Equal(uniqueId) });
      if (!checkDemoTxn) return response400(res, EKYC_ACCESS_DENIED);
      if (checkDemoTxn?.finalStatus == 'F') return response400(res, checkDemoTxn.aadhaarDemoAuthError);
      // checking actual table
      let checkBenfData = await repository.otherBenfDataRepo.findOneBy({ aadhar_no: Equal(checkDemoTxn.aadhaarHash) });
      if (checkBenfData?.applicationStatus == COMPLETED && checkBenfData?.ekyc_check == "Y") return response400(res, `Already Registered With Order Number ${checkBenfData.order_number}.`);
      let checkaAdharHash = checkDemoTxn?.aadhaarHash?.toLowerCase() == aadharHash?.toLowerCase();
      if (!checkaAdharHash) return response400(res, "AadharHash Matching Failed.");
      if (!(checkDemoTxn?.nameMatchStatus == "S") || !(Number(checkDemoTxn?.nameMatchScore) > 50)) return response400(res, "As Per Aadhar, Your Name Has Not Matched.");
      bodyData.benf_name = benfName;
      bodyData.aadhar_no = aadharHash;
      bodyData.benf_unique_id = new Date().getFullYear() + "" + new Date().getTime();
      bodyData.type = OTHER_BENEFICIARY;
      bodyData.details = AADHAR_PROCESS;
      bodyData.status = ORDER_PENDING;
      bodyData.applicationStatus = COMPLETED;
      bodyData.order_number = await createUniqueIdBasedOnCodes(UserId, 'other');
      bodyData.ekyc_check = 'DEMO';
      let fecthedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
      bodyData.refractionist_name = fecthedUser?.Name;
      bodyData.refractionist_mobile = fecthedUser?.Mobile;
      let savedDummyData = await saveOriginalData(bodyData);
      if (savedDummyData?.scheme_eligability !== "Yes") return { code: 422, message: `You Are Not Eligible For ${savedDummyData.district}. Application Can Not Be Processed.` };
      await repository.otherBenfDataRepo.save(bodyData);
      return response200(res, {}, "Data Saved SuccessFully");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async ekycProcessWithKutumba(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, aadharHash } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!aadharHash) return response400(res, "Missing 'aadharHash' in req formate");

    try {
      let fetchAadharRecord = await repository.otherBenfDataRepo.findOneBy({ aadhar_no: Equal(aadharHash) });
      if (fetchAadharRecord?.applicationStatus == COMPLETED) return response400(res, `Already Registered With Order Number ${fetchAadharRecord.order_number}.`);
      let reqForDemoAuth = { aadhar_no: aadharHash };
      let getKutumbaData = await fetchDataFromKutumba(reqForDemoAuth);
      if (getKutumbaData !== 422 && getKutumbaData[0]?.LGD_DISTRICT_Name) {
        let kutumbaData: any = await mappingKutmbaDetails(getKutumbaData[0], '', '');
        let checkSatsId = await repository.studentDataRepo.findOneBy({ sats_id: Equal(kutumbaData.education_id) });
        if (checkSatsId) return response400(res, `Your Already Applied In School With Order Number ${checkSatsId.order_number}.`);
        kutumbaData.UserId = UserId; // adding user id
        kutumbaData.ekyc_check = 'Kutumba'; // adding ekyc check
        let fecthedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
        kutumbaData.refractionist_name = fecthedUser?.Name;
        kutumbaData.refractionist_mobile = fecthedUser?.Mobile;
        kutumbaData.UserId = UserId;
        let savedDummyData = await saveOriginalData(kutumbaData);
        let checkSavedData = await repository.otherBenfDataRepo.createQueryBuilder('child')
          .select(['child.benf_name as benf_name', 'child.id as benf_unique_id', 'child.dob as dob', 'child.age as age', 'child.taluk as taluk',
            'child.district as district', 'child.phone_number as phone_number', 'child.category as category',
            'child.caste as caste', 'child.address as address', 'child.scheme_eligability as scheme_eligability'])
          .where("child.UserId= :UserId and child.id= :id", { UserId: UserId, id: savedDummyData.id })
          .getRawOne();
        checkSavedData.phone_number = '';
        let check = checkSavedData.scheme_eligability == "Yes" ? "" : `You Are Not Eligible For ${checkSavedData.district}. Application Can Not Be Processed.`;
        return responseForSpec200(res, checkSavedData, RESPONSEAPI_MESSAGE.FETCHED, NO, check);
      } else {
        let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
        let uniqueId = new Date().getTime();
        let bodyData = {
          name: "Edcs",
          uniqueId,
          txnDateTime
        }
        let check = await ekycVerification(bodyData);
        if (check == 422) return response400(res, EKYC_ACCESS_DENIED);
        return responseForSpec200(res, { uniqueId: txnDateTime, Token: check }, RESPONSEAPI_MESSAGE.FETCHED, YES, "");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async addAadharDataWithVersion(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");

    try {
      let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
      let uniqueId = new Date().getTime();
      let bodyData = {
        name: "Edcs",
        uniqueId,
        txnDateTime
      }
      let check = await ekycVerification(bodyData);
      if (check == 422) return response400(res, EKYC_ACCESS_DENIED);
      return response200(res, { uniqueId: txnDateTime, Token: check }, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async addDataAfterEkyc(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, uniqueId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!uniqueId) return response400(res, "Missing 'uniqueId' in req formate");

    try {
      let checkEkycData = await repository.ekycDataRepo.findOneBy({ txnNo: Equal(uniqueId) });
      if (!checkEkycData) return response400(res, EKYC_ACCESS_DENIED);
      if (checkEkycData?.finalStatus == "F") return response400(res, checkEkycData.errorMessage);
      if (checkEkycData?.ekyc_state !== "Karnataka") return response400(res, "You Are The Out Of Karnataka.");
      // checking actual table
      let checkOtherBenf = await repository.otherBenfDataRepo.findOneBy({ aadhar_no: Equal(checkEkycData.aadhaarHash) });
      if (checkOtherBenf?.applicationStatus == COMPLETED && checkOtherBenf?.ekyc_check == "Y") return { code: 422, message: `Already Registered With Order Number ${checkOtherBenf.order_number}.` };

      let getKutumbaData = await fetchDataFromKutumba({ aadhar_no: checkEkycData.aadhaarHash })
      let mapDataOtherBenfWise: any = mappingNewBenfData(checkEkycData, getKutumbaData);
      mapDataOtherBenfWise.UserId = UserId;
      mapDataOtherBenfWise.ekyc_check = 'Y';
      let fecthedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
      mapDataOtherBenfWise.refractionist_name = fecthedUser?.Name;
      mapDataOtherBenfWise.refractionist_mobile = fecthedUser?.Mobile;
      mapDataOtherBenfWise.UserId = UserId;
      let savedDummyData = await saveOriginalData(mapDataOtherBenfWise);
      let checkSavedData = await repository.otherBenfDataRepo.createQueryBuilder('child')
        .select(['child.benf_name as benf_name', 'child.id as benf_unique_id', 'child.dob as dob', 'child.age as age', 'child.taluk as taluk',
          'child.district as district', 'child.phone_number as phone_number', 'child.category as category',
          'child.caste as caste', 'child.address as address', 'child.scheme_eligability as scheme_eligability'])
        .where("child.UserId= :UserId and child.id= :id", { UserId: UserId, id: savedDummyData.id })
        .getRawOne();
      let check = checkSavedData.scheme_eligability == "Yes" ? "" : `You Are Not Eligible For ${checkSavedData.district}. Application Can Not Be Processed.`;
      return responseForSpec200(res, checkSavedData, RESPONSEAPI_MESSAGE.FETCHED, NO, check);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async ekycCheck(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, uniqueId, benf_unique_id } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!uniqueId) return response400(res, "Missing 'uniqueId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");

    try {
      let checkEkycData = await repository.ekycDataRepo.findOneBy({ txnNo: Equal(uniqueId) });
      if (!checkEkycData) return response400(res, EKYC_ACCESS_DENIED);
      if (checkEkycData?.finalStatus == "F") return response400(res, checkEkycData.errorMessage);
      if (checkEkycData?.ekyc_state !== "Karnataka") return response400(res, "You Are The Out Of Karnataka.");
      // checking actual table
      let checkOtherBenf = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!checkOtherBenf) return response400(res, ACCESS_DENIED);
      let checkAadharHas = checkEkycData?.aadhaarHash.toLowerCase() == checkOtherBenf?.aadhar_no.toLowerCase();
      if (!checkAadharHas) return { code: 422, message: "Hash Matching Failed." };
      checkOtherBenf.ekyc_check = 'Y';
      checkOtherBenf.district = checkEkycData?.ekyc_dist || "";
      checkOtherBenf.taluk = checkEkycData?.ekyc_subdist || "";

      let fecthedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
      checkOtherBenf.refractionist_name = fecthedUser?.Name || "";
      checkOtherBenf.refractionist_mobile = fecthedUser?.Mobile || "";
      checkOtherBenf.UserId = UserId;
      await repository.otherBenfDataRepo.save(checkOtherBenf);
      let checkSavedData = await repository.otherBenfDataRepo.createQueryBuilder('child')
        .select(['child.benf_name as benf_name', 'child.id as benf_unique_id', 'child.dob as dob', 'child.age as age', 'child.taluk as taluk',
          'child.district as district', 'child.phone_number as phone_number', 'child.category as category',
          'child.caste as caste', 'child.address as address', 'child.scheme_eligability as scheme_eligability'])
        .where("child.id= :id", { id: benf_unique_id })
        .getRawOne();
      let check = checkSavedData?.scheme_eligability == "Yes" ? "" : `You Are Not Eligible For ${checkSavedData.district}. Application Can Not Be Processed.`;
      return responseForError200(res, checkSavedData, EKYC_SUCCESS, check);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async updateAadharData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, aadhar_no } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");

    try {
      let fecthedRecord = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!fecthedRecord) return response400(res, ACCESS_DENIED_OTHER);
      if (fecthedRecord?.applicationStatus == COMPLETED && fecthedRecord?.ekyc_check == "Y") return response400(res, `Already Registered With Order Number ${fecthedRecord.order_number}.`);
        bodyData.order_number = await createUniqueIdBasedOnCodes(UserId, 'other');
        bodyData.type = "otherBenificiary";
        bodyData.details = "aadhar";
        bodyData.status = ORDER_PENDING;
        bodyData.applicationStatus = COMPLETED;
        bodyData.age = Number(bodyData.age);
        bodyData.UserId = bodyData.UserId;
        let newData = { ...fecthedRecord, ...bodyData };
        let findData: any = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id), aadhar_no: Equal(aadhar_no) });
        bodyData.id = findData?.id;
        let checkEducationId: any = await repository.studentDataRepo.findOneBy({ sats_id: Equal(findData?.education_id) });
        if (checkEducationId) return response400(res, `Your Already Applied In School With Order Number ${checkEducationId?.order_number}.`);
        await repository.otherBenfDataRepo.save(newData);
        return response200(res, {}, RESPONSEAPI_MESSAGE.UPDATED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async rcBasedOnNumberWise(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { benf_unique_id, phone_number, UserId } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    if (!phone_number) return response400(res, "Missing 'phone_number' in req formate");

    try {
      let finRcData: any = await repository.rcDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!finRcData) return response404(res, ACCESS_DENIED_RC);
      let findBenfOther = await repository.otherBenfDataRepo.findOneBy({ aadhar_no: Equal(finRcData.aadhar_no) });
      if (finRcData.education_id) {
        let findEduData = await repository.otherBenfDataRepo.findOneBy({ education_id: Equal(finRcData.education_id) });
        if (findEduData) return { code: 422, message: `Already Registered In Schools With Order Number ${findEduData.order_number}.` };
      };
      if (findBenfOther?.applicationStatus == COMPLETED && findBenfOther?.ekyc_check == "Y") return response400(res, `Already Registered With Order Number ${findBenfOther.order_number}.`);
        if (bodyData?.case == "Yes") {
          let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
          let uniqueId = new Date().getTime();
          let bodyForEkyc = {
            name: findBenfOther?.benf_name,
            uniqueId: uniqueId,
            txnDateTime
          }
          let check = await ekycVerification(bodyForEkyc);
          if (check == 422) return response400(res, EKYC_ACCESS_DENIED);
          return response200(res, { uniqueId: txnDateTime, Token: check, benf_unique_id: findBenfOther?.id }, RESPONSEAPI_MESSAGE.FETCHED);
        };
        delete finRcData.id;
        delete finRcData.CreatedDate;
        delete finRcData.UpdatedDate;
        delete finRcData.user_id;
        finRcData['kutumba_phone_number'] = finRcData.phone_number;
        let newData = { ...finRcData, ...bodyData };
        newData.phone_number = "";
        newData['otp'] = generateOTP();
        newData.UserId = UserId;
        newData.id = findBenfOther?.id;
        let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
        let uniqueId = new Date().getTime();
        if (phone_number !== 'Yes') {
          let bodyForEkyc = {
            name: newData.benf_name,
            uniqueId: uniqueId,
            txnDateTime
          }
          let check = await ekycVerification(bodyForEkyc);
          if (check == 422) return response400(res, EKYC_ACCESS_DENIED);
          let savedData = await addNewDataFromRC({...findBenfOther, ...newData});
          return response200(res, { uniqueId: txnDateTime, Token: check, benf_unique_id: savedData.id }, RESPONSEAPI_MESSAGE.FETCHED);
        } else {
          let smsOtp = await sendOtpAsSingleSms(newData?.phone_number, newData.otp);
          await sendSmsInKannadaUnicode(newData?.phone_number, newData.otp);
          if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);
          let savedData = await addNewDataFromRC({...findBenfOther, ...newData});
          return response200(res, { benf_unique_id: savedData.id }, RESPONSEMSG.OTP);
        }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async otpCheckRcMember(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, otp } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    if (!otp) return response400(res, "Missing 'otp' in req formate");

    try {

      let fecthedRecord = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id), UserId: UserId(UserId) });
      let checkOtp = fecthedRecord?.otp == otp;
      if (!checkOtp) return response400(res, RESPONSEMSG.VALIDATE_FAILED);
      let result = await repository.otherBenfDataRepo.createQueryBuilder('child')
        .select(['child.benf_name as benf_name', 'child.dob as dob', 'child.age as age', 'child.taluk as taluk',
          'child.district as district', 'child.phone_number as phone_number', 'child.category as category',
          'child.caste as caste', 'child.address as address', 'child.scheme_eligability as scheme_eligability'])
        .where("child.UserId= :user and child.id= :id", { UserId: UserId, id: benf_unique_id }).getRawOne();
      return response200(res, result, RESPONSEMSG.VALIDATE);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async updateRcAadharData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");

    try {
      let fecthedRecord = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id), UserId: Equal(UserId) });
      if (!fecthedRecord) return response400(res, ACCESS_DENIED_OTHER);
      let checkEducationId: any = await repository.studentDataRepo.findOneBy({ sats_id: Equal(fecthedRecord?.education_id) });
      if (checkEducationId) return response400(res, `Your Already Applied In School With Order Number ${checkEducationId.order_number}.`);
      if (fecthedRecord?.applicationStatus == COMPLETED && fecthedRecord?.ekyc_check == "Y") return response400(res, `Already Registered With Order Number ${fecthedRecord.order_number}.`);
      bodyData.order_number = await createUniqueIdBasedOnCodes(UserId, 'other');
      bodyData.type = "otherBenificiary";
      bodyData.details = "rc";
      bodyData.status = ORDER_PENDING;
      bodyData.applicationStatus = COMPLETED;
      bodyData.age = Number(bodyData.age);
      let newData = { ...fecthedRecord, ...bodyData };
      await repository.otherBenfDataRepo.save(newData);
      return response200(res, {}, RESPONSEMSG.UPDATE_SUCCESS);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async eachStatusWise(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");

    try {
      let result = await repository.otherBenfDataRepo.createQueryBuilder('child').
        select(['child.id as benf_unique_id', 'child.address as address', 'child.order_number as order_number', 'child.benf_name as benf_name',
          'child.phone_number as phone_number']).where("child.id= :id", { id: benf_unique_id }).getRawOne();
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async readyToDeliverOtp(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, phone_number, deliveredOtp } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    if (!phone_number) return response400(res, "Missing 'phone_number' in req formate");
    bodyData.deliveredOtp = generateOTP();
    bodyData.status = 'ready_to_deliver';
    try {
      let result: any = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      let smsOtp = await sendOtpAsReadyForDeliver(phone_number, bodyData.deliveredOtp, result.order_number);
      if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);

      let findData = await repository.otherBenfDataRepo.findOneBy({ id: benf_unique_id });
      if (!findData) return response400(res, ACCESS_DENIED);
      let newData = { ...findData, ...bodyData };
      await repository.otherBenfDataRepo.save(newData);
      return response200(res, {}, RESPONSEMSG.OTP);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async validateReadyToDeliverOtp(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, otp } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    try {
      let result: any = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      let checkOtp = result?.deliveredOtp == otp;
      if (!checkOtp) return response400(res, RESPONSEMSG.VALIDATE_FAILED);
      return response200(res, {}, RESPONSEMSG.VALIDATE);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async delivered(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, otp } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    try {
      bodyData.status = 'delivered';
      let result: any = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      let newData = { ...result, ...bodyData };
      await repository.otherBenfDataRepo.save(newData);
      return response200(res, {}, RESPONSEMSG.UPDATE_SUCCESS);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async otpSentToNewNumber(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, phone_number } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    try {
      let findMobile = await repository.otherBenfDataRepo.find({ where: { phone_number: Equal(phone_number) } });
      if (findMobile.length > 4) return response400(res, PHONE_REGESTERED);
      let result = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!result) return response400(res, ACCESS_DENIED);
      bodyData.otp = generateOTP();
      let smsOtp = await sendOtpAsSingleSms(phone_number, bodyData.otp);
      if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);

      let newData = { ...result, ...bodyData };
      await repository.otherBenfDataRepo.save(newData);
      return response200(res, {}, RESPONSEMSG.OTP);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async validateWithNewNumber(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, otp } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    try {
      let findDummyData = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      let checkOtp = findDummyData?.otp == otp;
      if (!checkOtp) return response400(res, RESPONSEMSG.VALIDATE_FAILED);
      return response200(res, {}, RESPONSEMSG.VALIDATE);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async chnageStatusReadyToDeliver(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    try {
      let findBenfData = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!findBenfData) return response400(res, ACCESS_DENIED);
      bodyData.status = "delivered";
      let newData = { ...findBenfData, ...bodyData };
      await repository.otherBenfDataRepo.save(newData);
      return response200(res, {}, RESPONSEMSG.UPDATE_SUCCESS);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async chnageStatusPendingToReady(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");
    try {
      let findBenfData = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!findBenfData) return response400(res, ACCESS_DENIED);
      bodyData.status = "ready_to_deliver";
      let newData = { ...findBenfData, ...bodyData };
      await repository.otherBenfDataRepo.save(newData);
      return response200(res, {}, RESPONSEMSG.UPDATE_SUCCESS);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAaadharDataFromRcData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, aadhar_no } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!aadhar_no) return response400(res, "Missing 'aadhar_no' in req formate");
    try {
      let findBenfData = await repository.otherBenfDataRepo.find({
        where: { aadhar_no: Equal(aadhar_no), UserId: Equal(UserId) },
        select: ["benf_name", "dob", "age", "taluk", "district", "phone_number", "category", "caste", "address", "scheme_eligability"]
      });
      if (findBenfData.length == 0) return response400(res, ACCESS_DENIED);
      return response200(res, findBenfData, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAadharHashData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, aadhar_no } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!aadhar_no) return response400(res, "Missing 'aadhar_no' in req formate");
    bodyData.aadhar_no = await convertAadharToSha256Hex(aadhar_no);
    try {
      let findBenfData = await repository.otherBenfDataRepo.find({
        where: { aadhar_no: Equal(bodyData.aadhar_no) },
        select: ["benf_name", "dob", "age", "taluk", "district", "phone_number", "category", "caste", "address", "scheme_eligability"]
      });
      if (findBenfData.length == 0) return response400(res, ACCESS_DENIED);
      return response200(res, findBenfData, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getBenfHistory(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, searchTerm, pagination, skip = 0, take = 10 } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (pagination !== "Yes") return response400(res, "Missing 'pagination' in req formate");
    try {
      let count = await repository.otherBenfDataRepo.createQueryBuilder('other').
        select(['other.id as benf_unique_id', 'other.benf_name as benf_name', 'other.order_number as order_number',
          'other.address as address', 'other.status as status', 'other.phone_number as phone_number'])
        .where("other.UserId = :id and other.applicationStatus = :applicationStatus and other.status = :status",
          { id: UserId, applicationStatus: COMPLETED, status: DELIVERED })
        .andWhere(new Brackets(qb => {
          qb.where("other.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.benf_name like :term", { term: `%${searchTerm}%` })
            .orWhere("other.phone_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.status like :term", { term: `%${searchTerm}%` })
        })).getCount();
      let totalData = await repository.otherBenfDataRepo.createQueryBuilder('other').
        select(['other.id as benf_unique_id', 'other.benf_name as benf_name', 'other.order_number as order_number',
          'other.address as address', 'other.status as status', 'other.phone_number as phone_number'])
        .where("other.UserId = :id and other.applicationStatus = :applicationStatus and other.status = :status",
          { id: UserId, applicationStatus: COMPLETED, status: DELIVERED })
        .andWhere(new Brackets(qb => {
          qb.where("other.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.benf_name like :term", { term: `%${searchTerm}%` })
            .orWhere("other.phone_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.status like :term", { term: `%${searchTerm}%` })
        }))
        .orderBy('other.CreatedDate', 'DESC')
        .skip(+skip)
        .take(+take)
        .getRawMany();
      let result = {
        take: take,
        skip: skip,
        total: count,
        totalData
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getBenfStatusWise(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, searchTerm, pagination, skip = 0, take = 10 } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (pagination !== "Yes") return response400(res, "Missing 'pagination' in req formate");
    try {
      let pending_count = await repository.otherBenfDataRepo.createQueryBuilder("other")
        .where("other.UserId= :UserId and other.status= :status and other.applicationStatus= :aps", { UserId, status: ORDER_PENDING, aps: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("other.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.benf_name like :term", { term: `%${searchTerm}%` })
            .orWhere("other.phone_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.status like :term", { term: `%${searchTerm}%` })
        }))
        .getCount();
      let delivered_count = await repository.otherBenfDataRepo.createQueryBuilder("other")
        .where("other.UserId= :UserId and other.status= :status and other.applicationStatus= :aps", { UserId, status: DELIVERED, aps: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("other.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.benf_name like :term", { term: `%${searchTerm}%` })
            .orWhere("other.phone_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.status like :term", { term: `%${searchTerm}%` })
        }))
        .getCount();
      let ready_count = await repository.otherBenfDataRepo.createQueryBuilder("other")
        .where("other.UserId= :UserId and other.status= :status and other.applicationStatus= :aps", { UserId, status: READY_TO_DELIVER, aps: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("other.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.benf_name like :term", { term: `%${searchTerm}%` })
            .orWhere("other.phone_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.status like :term", { term: `%${searchTerm}%` })
        }))
        .getCount();
      let totalData = await repository.otherBenfDataRepo.createQueryBuilder('other').
        select(['other.id as benf_unique_id', 'other.benf_name as benf_name', 'other.order_number as order_number',
          'other.address as address', 'other.status as status', 'other.phone_number as phone_number'])
        .where("other.UserId = :id and other.applicationStatus = :applicationStatus", { id: UserId, applicationStatus: COMPLETED })
        .andWhere(new Brackets(qb => {
          qb.where("other.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.benf_name like :term", { term: `%${searchTerm}%` })
            .orWhere("other.phone_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.status like :term", { term: `%${searchTerm}%` })
        }))
        // .andWhere("other.status NOT IN (:...excludedStatuses)", { excludedStatuses: [DELIVERED] })
        .orderBy('other.CreatedDate', 'DESC')
        .skip(+skip)
        .take(+take)
        .getRawMany();
      let result = {
        take: take,
        skip: skip,
        total: Number(pending_count) + Number(ready_count) + Number(delivered_count),
        pending_count: pending_count,
        ready_count: ready_count,
        delivered_count: delivered_count,
        totalData
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };
  /* ended other beneficiary table related apis */

  /* starting ekyc table related apis */
  async ekycApplication(req: Request | any, res: any): Promise<any> {
    try {
      res.sendFile(path.join(__dirname + "../../views", "ekycApplication.html"));
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async saveEkycData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    try {
      let mappedData = mappingEkycData(bodyData);
      await repository.ekycDataRepo.save(mappedData)
      return response200(res, {}, RESPONSEAPI_MESSAGE.INSERTED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async authDemoCallBackUrl(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    try {
      let mappedData = mappingDemoEkycData(bodyData);
      await repository.demoAuthResponseRepo.save(mappedData)
      return response200(res, {}, RESPONSEAPI_MESSAGE.INSERTED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };
  /* ended ekyc table related apis */

};

const mappingNewBenfData = (mapData: EkycData, getData: any) => {
  let getOneArray = getData[0];
  if (getData !== 422) {
    let reqBody = new OtherBenfData();
    reqBody.age = mapData.ekyc_dob ? getCalulateAgeFromDob(mapData.ekyc_dob) : 0;
    reqBody.caste = getOneArray?.MBR_CASTE || "";
    reqBody.category = getOneArray.MBR_CASTE_CATEGORY || "";
    reqBody.father_name = mapData?.ekyc_co || "";
    reqBody.education_id = getOneArray?.MBR_EDUCATION_ID || "";
    reqBody.district = mapData?.ekyc_dist || "";
    reqBody.taluk = mapData?.ekyc_subdist || "";
    reqBody.address = mapData?.ekyc_dist + " " + mapData?.ekyc_vtc + ", " + mapData?.ekyc_street + ", " + mapData?.ekyc_house + ", " + mapData?.ekyc_loc + "," + mapData?.ekyc_pc || "" || "";
    reqBody.dob = mapData?.ekyc_dob || "";
    reqBody.lgd_taluka = getOneArray?.LGD_TALUK_CODE || "";
    reqBody.lgd_district = getOneArray?.LGD_DISTRICT_CODE || "";
    reqBody.aadhar_no = mapData?.aadhaarHash;
    reqBody.gender = mapData?.ekyc_gender || "";
    reqBody.kutumba_phone_number = getOneArray?.MBR_MOBILE_NO || "";
    reqBody.benf_name = mapData?.ekyc_name || "";
    return reqBody;
  } else {
    let reqBody = new OtherBenfData();
    reqBody.age = mapData.ekyc_dob ? getCalulateAgeFromDob(mapData.ekyc_dob) : 0;
    reqBody.father_name = mapData?.ekyc_co || "";
    reqBody.district = mapData?.ekyc_dist || "";
    reqBody.taluk = mapData?.ekyc_subdist || "";
    reqBody.dob = mapData?.ekyc_dob || "";
    reqBody.address = mapData?.ekyc_dist + " " + mapData?.ekyc_vtc + " ," + mapData?.ekyc_street + ", " + mapData?.ekyc_house + ", " + mapData?.ekyc_loc + "," + mapData?.ekyc_pc || "";
    reqBody.aadhar_no = mapData?.aadhaarHash;
    reqBody.gender = mapData?.ekyc_gender || "";
    reqBody.benf_name = mapData?.ekyc_name || "";
    return reqBody;
  }
};

const saveDummyData = async (data: any) => {
  data.ekyc_check = data?.ekyc_check ? data?.ekyc_check : "Y";
  let findDistrict = await repository.userDataRepo.createQueryBuilder('ud')
    .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
    .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
    .where("ud.UserId = :UserId", { UserId: data.UserId })
    .getRawOne();
  let removeExtraCharacters = findDistrict?.DistrictName?.replace(/\W/g, "").replace(/\d/g, "");
  let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters?.toLowerCase(), data?.district?.replace(/\W/g, "").replace(/\d/g, "").toLowerCase());
  data.scheme_eligability = checkEligibaleOrNot;
  return await repository.otherBenfDataDummyRepo.save(data);
}

const saveOriginalData = async (data: any) => {
  data.ekyc_check = data?.ekyc_check ? data?.ekyc_check : "Y";
  let findDistrict = await repository.userDataRepo.createQueryBuilder('ud')
    .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
    .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
    .where("ud.UserId = :UserId", { UserId: data.UserId })
    .getRawOne();
  let removeExtraCharacters = findDistrict?.DistrictName?.replace(/\W/g, "").replace(/\d/g, "");
  let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters?.toLowerCase(), data?.district?.replace(/\W/g, "").replace(/\d/g, "").toLowerCase());
  data.scheme_eligability = checkEligibaleOrNot;
  return await repository.otherBenfDataRepo.save(data);
}


const updateDataExistsRecord = async (data: OtherBenfDataDummy) => {
  console.log("uodate ex", data)
  let findDistrict = await repository.userDataRepo.createQueryBuilder('ud')
    .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
    .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
    .where("ud.UserId = :UserId", { UserId: data.UserId })
    .getRawOne();
  let removeExtraCharacters = findDistrict?.DistrictName.replace(/\W/g, "").replace(/\d/g, "");
  let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters?.toLowerCase(), data?.district?.toLowerCase());
  data.scheme_eligability = checkEligibaleOrNot;
  let other_repo = await repository.otherBenfDataDummyRepo.findOneBy({ aadhar_no: Equal(data.aadhar_no) });
  let finalData = { ...other_repo, ...data };
  return await repository.otherBenfDataRepo.save(finalData);
};


const addNewDataFromRC = async (data: OtherBenfData) => {
  let findDistrict = await repository.userDataRepo.createQueryBuilder('ud')
    .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
    .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
    .where("ud.UserId = :UserId", { UserId: data.UserId })
    .getRawOne();
  let removeExtraCharacters = findDistrict?.DistrictName.replace(/\W/g, "").replace(/\d/g, "");
  let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters?.toLowerCase(), data?.district?.toLowerCase());
  data.scheme_eligability = checkEligibaleOrNot;
  return await repository.otherBenfDataRepo.save(data);
};

const mappingEkycData = (data: any) => {
  let newData = new EkycData();
  let eKYCData = data.eKYCData;
  let localData = data.localKYCData;
  newData.txnNo = data.txnNo;
  newData.txnDateTime = data.txnDateTime;
  newData.aadhaarHash = data.aadhaarHash;
  newData.finalStatus = data.finalStatus;
  newData.vaultRefNumber = data.vaultRefNumber;
  newData.ekycTxnNo = data.ekycTxnNo;
  newData.ekycTimestamp = data.ekycTimestamp;
  newData.residentConsent = data.residentConsent;
  newData.status = data.status;
  newData.responseStatus = data.responseStatus;
  newData.errorMessage = data.errorMessage;
  newData.error = data.error;
  newData.uidToken = data.uidToken;
  newData.actionCode = data.actionCode;
  newData.otp = data.otp;
  newData.otpTxnNo = data.otpTxnNo;
  newData.otpTimeStamp = data.otpTimeStamp;
  newData.ekyc_dob = eKYCData.dob;
  newData.ekyc_gender = eKYCData.gender;
  newData.ekyc_name = eKYCData.name;
  newData.ekyc_co = eKYCData.co;
  newData.ekyc_country = eKYCData.country;
  newData.ekyc_dist = eKYCData.dist;
  newData.ekyc_house = eKYCData.house;
  newData.ekyc_street = eKYCData.street;
  newData.ekyc_lm = eKYCData.lm;
  newData.ekyc_loc = eKYCData.loc;
  newData.ekyc_pc = eKYCData.pc;
  newData.ekyc_po = eKYCData.po;
  newData.ekyc_state = eKYCData.state;
  newData.ekyc_subdist = eKYCData.subdist;
  newData.ekyc_vtc = eKYCData.vtc;
  newData.ekyc_lang = eKYCData.lang;
  newData.local_dob = localData.dob;
  newData.local_gender = localData.gender;
  newData.local_name = localData.name;
  newData.local_co = localData.co;
  newData.local_country = localData.country;
  newData.local_dist = localData.dist;
  newData.local_house = localData.house;
  newData.local_street = localData.street;
  newData.local_lm = localData.lm;
  newData.local_loc = localData.loc;
  newData.local_pc = localData.pc;
  newData.local_po = localData.po;
  newData.local_state = localData.state;
  newData.local_subdist = localData.subdist;
  newData.local_vtc = localData.vtc;
  newData.local_lang = localData.lang;
  newData.photo = data.photo;
  newData.maskedAadhaar = data.maskedAadhaar;
  newData.npciStatus = data.npciStatus;
  newData.npciError = data.npciError;
  newData.npciBankName = data.npciBankName;
  newData.npciLastUpdateDate = data.npciLastUpdateDate;
  return newData;
}

const mappingDemoEkycData = (data: any) => {
  let newData = new DemoAuthResponse();
  newData.txnNo = data?.txnNo || "";
  newData.txnDateTime = data?.txnDateTime || "";
  newData.aadhaarHash = data?.aadhaarHash || "";
  newData.finalStatus = data?.finalStatus || "";
  newData.vaultRefNumber = data?.vaultRefNumber || "";
  newData.beneficiaryAadhaarName = data?.beneficiaryAadhaarName || "";
  newData.aadhaarDemoAuthStatus = data?.aadhaarDemoAuthStatus || "";
  newData.aadhaarDemoAuthError = data?.aadhaarDemoAuthError || "";
  newData.npciStatus = data?.npciStatus || "";
  newData.npciError = data?.npciError || "";
  newData.npciBankName = data?.npciBankName || "";
  newData.npciLastUpdateDate = data?.npciLastUpdateDate || "";
  newData.nameMatchStatus = data?.nameMatchStatus || "";
  newData.ekyc_name = data?.ekyc_name || "";
  newData.nameMatchScore = data?.nameMatchScore || "";
  newData.maskedAadhaar = data?.maskedAadhaar || "";
  return newData;
}

const mappingEachRcData = async (data: any, getData: any, type: string) => {
  let reqBody = new RcData();
  reqBody.age = getData?.MBR_DOB ? getCalulateAgeFromDob(getData.MBR_DOB) : 0;
  reqBody.caste = getData?.MBR_CASTE ? getData.MBR_CASTE : "";
  reqBody.rc_no = type == "rc" ? data?.rc_no : "";
  reqBody.category = getData?.MBR_CASTE_CATEGORY ? getData.MBR_CASTE_CATEGORY : "";
  reqBody.father_name = getData?.MBR_NPR_FATHER_NAME ? getData.MBR_NPR_FATHER_NAME : "";
  reqBody.education_id = getData?.MBR_EDUCATION_ID ? getData.MBR_EDUCATION_ID : "";
  reqBody.district = getData?.LGD_DISTRICT_Name || "";
  reqBody.taluk = getData?.LGD_TALUK_Name || "";
  reqBody.lgd_taluka = getData?.LGD_TALUK_CODE || "";
  reqBody.lgd_district = getData?.LGD_DISTRICT_CODE || "";
  reqBody.address = getData?.MBR_ADDRESS ? getData.MBR_ADDRESS : "";
  reqBody.dob = getData?.MBR_DOB ? getData.MBR_DOB : "";
  reqBody.aadhar_no = type == "rc" ? getData?.MBR_HASH_AADHAR : await convertAadharToSha256Hex(data?.aadhar_no);
  reqBody.gender = getData?.MBR_GENDER ? getData.MBR_GENDER : "";
  reqBody.phone_number = getData?.MBR_MOBILE_NO ? getData.MBR_MOBILE_NO : "";
  reqBody.benf_name = getData?.MEMBER_NAME_ENG ? getData.MEMBER_NAME_ENG : "";
  return reqBody;
};
