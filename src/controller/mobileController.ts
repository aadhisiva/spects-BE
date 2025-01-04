import { Brackets, Equal, Unique } from "typeorm";
import jsonwebtoken, { Algorithm } from "jsonwebtoken";
import { Service } from "typedi";
import crypto from "crypto";

import { response200, response400, response404, responseForSpec200 } from "../utils/resBack";
import { checkEligableCandiadate, convertAadharToSha256Hex, createUniqueIdBasedOnCodes, encryptData, generateOtp, generateUniqueId, getAgeFromBirthDateToEkyc } from "../utils/resuableCode";
import { apiErrorHandler } from "../utils/reqResHandler";
import { repoNames, repository } from "../db/repos";
import { AADHAR_PROCESS, ACCESS_DENIED, COMPLETED, DELIVERED, EKYC_ACCESS_DENIED, NO, ORDER_PENDING, OTHER_BENEFICIARY, PHONE_REGESTERED, READY_TO_DELIVER, RESPONSEAPI_MESSAGE, YES } from "../utils/constants";
import { demoAuthEkycProcess, ekycVerification, fetchDataFromKutumba, getSchoolDataFromExternal, mappingKutmbaDetails } from "../utils/kutumba/kutumbaInt";
import { SchoolData } from "../entities/schoolData";
import { OtherBenfData } from "../entities/otherBenfData";
import { EkycData } from "../entities/ekycData";
import { OtherBenfDataDummy } from "../entities/otherBenfDataDum";
import { ResusableFunctions } from "../utils/smsServceResusable";
import { RESPONSEMSG } from "../utils/statusCodes";

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
  constructor(public ResusableFunctions: ResusableFunctions) { };

  async loginWithoutEncryption(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body };
    const { Mobile } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (Mobile.length !== 10) return response400(res, "Enter valid number");
    bodyData.Otp = "111111";
    try {
      let fetchedVersion = await repository.versionRepo.find();
      bodyData.Version = fetchedVersion[0].Version;

      let findData = await repository.userDataRepo.findOneBy({ Mobile: Equal(Mobile) });
      if (!findData) return response404(res, "User not found");
      // let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(Mobile, bodyData.Otp);
      // if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);
      let newData = { ...findData, ...bodyData };
      await repository.userDataRepo.save(newData);
      let fecthedRecord = await repository.userDataRepo.createQueryBuilder('vs')
        .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=vs.DistrictCode and md.TalukCode=vs.TalukCode and md.PhcoCode=vs.PhcoCode and md.SubCenterCode=vs.SubCenterCode')
        .select([`DISTINCT vs.UserId as UserId, 
            CONCAT('D-',md.DistrictName,'-S-',md.SubCenterName) as assignedSubCenter`
        ])
        .where("vs.Mobile = :Mobile", { Mobile: Mobile })
        .getRawMany();

      // let result = (fecthedRecord || []).map(obj => {
      //   return {
      //     ...obj,
      //     Token: jsonwebtoken.sign({ DistrictCode: obj.DistrictCode, TalukCode: obj?.TalukCode, RoleId: obj.RoleId, UserId: obj.UserId },
      //       process.env.SECRET_KEY!, options)
      //   }
      // })
      return response200(res, { Otp: bodyData?.Otp, mappedRes: fecthedRecord }, "Retireved successFully");
    } catch (error) {
      console.log(error)
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
      let schoolData = await getSchoolDataFromExternal(reqForSchool, 'school');
      if (schoolData == 500) response404(res, "No Data Found");
      let mergedData = schoolDataAssignToLocal(schoolData[0]);
      mergedData.UserId = UserId;
      mergedData.school_id = school_id;
      let checkDuplicate = await repository.schoolDataRepo.findOneBy({ school_id: Equal(school_id) });
      if (checkDuplicate) {
        if (checkDuplicate.applicationStatus == COMPLETED) return response400(res, "School Already Registered.");
        await repository.schoolDataRepo.save({ ...checkDuplicate, ...mergedData });
        return response200(res, {}, RESPONSEAPI_MESSAGE.DATA_UPDATED);
      };
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
    const { pagination, take, skip, user_id, school_id, searchTerm, UserId } = bodyData;

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
      return response200(res, totalData, RESPONSEAPI_MESSAGE.FETCHED);
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
        let savedDummyData = await saveDummyData(newData);
        if (savedDummyData?.scheme_eligability !== "Yes") return { code: 422, message: `You Are Not Eligible For ${savedDummyData.district}. Application Can Not Be Processed.` };
        await repository.otherBenfDataRepo.save(bodyData);
        return responseForSpec200(res, {}, "Data Saved SuccessFully", NO);
      } else {
        let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
        let uniqueId = new Date().getTime();
        let bodyData = {
          name: benfName,
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

      let savedDummyData = await saveDummyData(bodyData);
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
        if (checkSatsId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkSatsId.order_number}.` };
        kutumbaData.UserId = UserId; // adding user id
        kutumbaData.ekyc_check = 'Kutumba'; // adding ekyc check
        let fecthedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
        kutumbaData.refractionist_name = fecthedUser?.Name;
        kutumbaData.refractionist_mobile = fecthedUser?.Mobile;

        let savedDummyData = await saveDummyData(kutumbaData);
        let checkSavedData = await repository.otherBenfDataDummyRepo.createQueryBuilder('child')
          .select(['child.benf_name as benf_name', 'child.benf_unique_id as benf_unique_id', 'child.dob as dob', 'child.age as age', 'child.taluk as taluk',
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
        return responseForSpec200(res, { uniqueId: txnDateTime, Token: check }, RESPONSEAPI_MESSAGE.FETCHED, YES);
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
      let savedDummyData = await saveDummyData(mapDataOtherBenfWise);
      let checkSavedData = await repository.otherBenfDataDummyRepo.createQueryBuilder('child')
        .select(['child.benf_name as benf_name', 'child.benf_unique_id as benf_unique_id', 'child.dob as dob', 'child.age as age', 'child.taluk as taluk',
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

  async updateAadharData(req: Request | any, res: any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, benf_unique_id, aadhar_no } = bodyData;

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!benf_unique_id) return response400(res, "Missing 'benf_unique_id' in req formate");

    try {
      let checkBenfData = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!checkBenfData) {
        bodyData.order_number = await createUniqueIdBasedOnCodes(UserId, 'other');
        bodyData.type = "otherBenificiary";
        bodyData.details = "aadhar";
        bodyData.status = ORDER_PENDING;
        bodyData.applicationStatus = COMPLETED;
        let updateDummyData = await repository.otherBenfDataDummyRepo.findOneBy({ id: Equal(benf_unique_id) });
        if (!updateDummyData) return response404(res, "No Data Found From OtherBenf");
        let newData = { ...updateDummyData, ...bodyData };
        await repository.otherBenfDataDummyRepo.save(newData);
        let findData: any = await repository.otherBenfDataDummyRepo.findOneBy({ id: Equal(benf_unique_id), aadhar_no: Equal(aadhar_no) });
        let checkEducationId: any = await repository.studentDataRepo.findOneBy({ sats_id: Equal(findData.education_id) });
        if (checkEducationId) return response400(res, `Your Already Applied In School With Order Number ${checkEducationId.order_number}.`);
        await repository.otherBenfDataRepo.save(findData);
        return response200(res, {}, RESPONSEAPI_MESSAGE.UPDATED);
      } else {
        let findData = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
        if (!findData) return response404(res, "No Data Found From OtherBenf");
        let newData = { ...findData, ...bodyData };
        await repository.otherBenfDataRepo.save(newData);
        return response200(res, {}, RESPONSEAPI_MESSAGE.UPDATED);
      }
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
      if (!finRcData) return response404(res, ACCESS_DENIED);
      let findDummyOther = await repository.otherBenfDataDummyRepo.findOneBy({ aadhar_no: Equal(finRcData.aadhar_no) });

      let findBenfOther = await repository.otherBenfDataRepo.findOneBy({ aadhar_no: Equal(finRcData.aadhar_no) });
      if (finRcData.education_id) {
        let findEduData = await repository.otherBenfDataRepo.findOneBy({ education_id: Equal(finRcData.education_id) });
        if (findEduData) return { code: 422, message: `Already Registered In Schools With Order Number ${findEduData.order_number}.` };
      };
      if (findBenfOther?.applicationStatus == COMPLETED && findBenfOther?.ekyc_check == "Y") return response400(res, `Already Registered With Order Number ${findBenfOther.order_number}.`);
      if (findDummyOther) {
        if (bodyData.case == "Yes") {
          let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
          let uniqueId = new Date().getTime();
          let bodyForEkyc = {
            name: findDummyOther.benf_name,
            uniqueId: uniqueId,
            txnDateTime
          }
          let check = await ekycVerification(bodyForEkyc);
          if (check == 422) return response400(res, EKYC_ACCESS_DENIED);
          return response200(res, { uniqueId: txnDateTime, Token: check }, RESPONSEAPI_MESSAGE.FETCHED);
        };

        findDummyOther.phone_number = findDummyOther?.phone_number;
        if (phone_number !== 'Yes') {
          let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
          let uniqueId = new Date().getTime();
          let bodyForEkyc = {
            name: findDummyOther.benf_name,
            uniqueId: uniqueId,
            txnDateTime
          }
          let check = await ekycVerification(bodyForEkyc);
          if (check == 422) return response400(res, EKYC_ACCESS_DENIED);
          await updateDataExistsRecord(findDummyOther);
          return response200(res, { uniqueId: txnDateTime, Token: check }, RESPONSEAPI_MESSAGE.FETCHED);
        } else {
          findDummyOther['otp'] = generateOtp(6);
          let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(findDummyOther?.phone_number, findDummyOther.otp);
          await this.ResusableFunctions.sendSmsInKannadaUnicode(findDummyOther?.phone_number, findDummyOther.otp);
          if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);
          await updateDataExistsRecord(findDummyOther);
          return response200(res, {}, RESPONSEMSG.OTP);
        }
      } else {
        let result: any = await repository.rcDataRepo.findOneBy({ aadhar_no: Equal(finRcData.aadhar_no) });
        delete result.id;
        delete result.created_at;
        delete result.updated_at;
        delete result.user_id;
        delete finRcData.id;
        delete finRcData.created_at;
        delete finRcData.updated_at;
        delete finRcData.user_id;
        result['kutumba_phone_number'] = result.phone_number;
        result.phone_number = "";
        let newData = { ...result, ...finRcData };
        newData['otp'] = generateOtp(6);
        newData.user_id = UserId;
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
          await addNewDataFromRC(newData);
          return response200(res, { uniqueId: txnDateTime, Token: check }, RESPONSEAPI_MESSAGE.FETCHED);
        } else {
          let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(newData?.phone_number, newData.otp);
          await this.ResusableFunctions.sendSmsInKannadaUnicode(newData?.phone_number, newData.otp);
          if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);
          await addNewDataFromRC(newData);
          return response200(res, {}, RESPONSEMSG.OTP);
        }
      };
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

      let fecthedRecord = await repository.otherBenfDataDummyRepo.findOneBy({ id: Equal(benf_unique_id), UserId: UserId(UserId) });
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
      let fecthedRecord = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      if (!fecthedRecord) {
        bodyData.order_number = await createUniqueIdBasedOnCodes(UserId, 'other');
        bodyData.type = "otherBenificiary";
        bodyData.details = "rc";
        bodyData.status = ORDER_PENDING;
        bodyData.applicationStatus = COMPLETED;

        let findData = await repository.otherBenfDataDummyRepo.findOneBy({ id: benf_unique_id });
        if (!findData) return response400(res, ACCESS_DENIED);
        let newData = { ...findData, ...bodyData };
        await repository.otherBenfDataDummyRepo.save(newData);
        let findDummyData: any = await repository.otherBenfDataDummyRepo.findOneBy({ id: benf_unique_id, aadhar_no: bodyData.aadhar_no });
        delete findDummyData?.id;
        delete findDummyData?.CreatedDate;
        delete findDummyData?.UpdatedDate;
        let checkEducationId = await repository.studentDataRepo.findOneBy({ sats_id: Equal(findDummyData.education_id) });
        if (checkEducationId) return { code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.` };
        await repository.otherBenfDataRepo.save(findDummyData);
        return response200(res, {}, RESPONSEMSG.UPDATE_SUCCESS);
      } else {
        let findData = await repository.otherBenfDataRepo.findOneBy({ id: benf_unique_id });
        if (!findData) return response400(res, ACCESS_DENIED);
        let newData = { ...findData, ...bodyData };
        await repository.otherBenfDataRepo.save(newData);
        return response200(res, {}, RESPONSEMSG.UPDATE_SUCCESS);
      }
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
        select(['child.benf_unique_id as benf_unique_id', 'child.address as address', 'child.order_number as order_number', 'child.benf_name as benf_name',
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
    bodyData.deliveredOtp = generateOtp(6);
    bodyData.status = 'ready_to_deliver';
    try {
      let result: any = await repository.otherBenfDataRepo.findOneBy({ id: Equal(benf_unique_id) });
      let smsOtp = await this.ResusableFunctions.sendOtpAsReadyForDeliver(phone_number, bodyData.deliveredOtp, result.order_number);
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
      bodyData.otp = generateOtp(6);
      let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(phone_number, bodyData.otp);
      if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);

      let result = await repository.otherBenfDataDummyRepo.findOneBy({ id: benf_unique_id });
      if (!result) return response400(res, ACCESS_DENIED);
      let newData = { ...result, ...bodyData };
      await repository.otherBenfDataDummyRepo.save(newData);
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
      let findDummyData = await repository.otherBenfDataDummyRepo.findOneBy({ id: Equal(benf_unique_id) });
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
      let findBenfData = await repository.otherBenfDataRepo.createQueryBuilder('other').
        select(['other.benf_unique_id as benf_unique_id', 'other.benf_name as benf_name', 'other.order_number as order_number',
          'other.address as address', 'other.status as status', 'other.phone_number as phone_number'])
        .where("other.UserId = :id and other.applicationStatus = :applicationStatus and other.status = :status",
          { id: UserId, applicationStatus: COMPLETED, status: DELIVERED })
        .andWhere(new Brackets(qb => {
          qb.where("other.order_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.benf_name like :term", { term: `%${searchTerm}%` })
            .orWhere("other.phone_number like :term", { term: `%${searchTerm}%` })
            .orWhere("other.status like :term", { term: `%${searchTerm}%` })
        }))
        .orderBy('other.created_at', 'DESC')
        .skip(+skip)
        .take(+take)
        .getRawMany();
      return response200(res, findBenfData, RESPONSEAPI_MESSAGE.FETCHED);
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
        select(['other.benf_unique_id as benf_unique_id', 'other.benf_name as benf_name', 'other.order_number as order_number',
          'other.address as address', 'other.status as status', 'other.phone_number as phone_number'])
        .where("other.UserId = :id and other.applicationStatus = :applicationStatus", { id: UserId, applicationStatus: COMPLETED })
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

};

const mappingNewBenfData = (mapData: EkycData, getData: any) => {
  let getOneArray = getData[0];
  if (getData !== 422) {
    let reqBody = new OtherBenfData();
    reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDateToEkyc(mapData.ekyc_dob) : 0;
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
    reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDateToEkyc(mapData.ekyc_dob) : 0;
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

const saveDummyData = async (...data: any) => {
  data.ekyc_check = data?.ekyc_check ? data?.ekyc_check : "Y";
  let findDistrict = await repository.userDataRepo.createQueryBuilder('ud')
    .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
    .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
    .where("ud.UserId = :UserId", { UserId: Equal(data.UserId) })
    .getRawOne();
  let removeExtraCharacters = findDistrict?.DistrictName.replace(/\W/g, "").replace(/\d/g, "");
  let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters.toLowerCase(), data?.district?.replace(/\W/g, "").replace(/\d/g, "").toLowerCase());
  data.scheme_eligability = checkEligibaleOrNot;
  return await repository.otherBenfDataDummyRepo.save(data);
}


const updateDataExistsRecord = async (data: OtherBenfDataDummy) => {
  let findDistrict = await repository.userDataRepo.createQueryBuilder('ud')
    .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
    .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
    .where("ud.UserId = :UserId", { UserId: Equal(data.UserId) })
    .getRawOne();
  let removeExtraCharacters = findDistrict?.DistrictName.replace(/\W/g, "").replace(/\d/g, "");
  let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters.toLowerCase(), data?.district.toLowerCase());
  data.scheme_eligability = checkEligibaleOrNot;
  let other_repo = await repository.otherBenfDataDummyRepo.findOneBy({ aadhar_no: Equal(data.aadhar_no) });
  let finalData = { ...other_repo, ...data };
  return await repository.otherBenfDataDummyRepo.save(finalData);
};


const addNewDataFromRC = async (data: OtherBenfData) => {
  let findDistrict = await repository.userDataRepo.createQueryBuilder('ud')
    .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=ud.DistrictCode and md.TalukCode=ud.TalukCode and md.PhcoCode=ud.PhcoCode and md.SubCenterCode=ud.SubCenterCode')
    .select(["md.DistrictName as DistrictName, md.TalukName as TalukName, md.PhcoName as PhcoName"])
    .where("ud.UserId = :UserId", { UserId: Equal(data.UserId) })
    .getRawOne();
  let removeExtraCharacters = findDistrict?.DistrictName.replace(/\W/g, "").replace(/\d/g, "");
  let checkEligibaleOrNot = await checkEligableCandiadate(removeExtraCharacters.toLowerCase(), data?.district.toLowerCase());
  data.scheme_eligability = checkEligibaleOrNot;
  return await repository.otherBenfDataDummyRepo.save(data);
};

