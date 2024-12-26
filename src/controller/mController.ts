import { Equal } from "typeorm";
import jsonwebtoken from "jsonwebtoken";
import { Service } from "typedi";

import { AppDataSource } from "../db/config";
import { response200, response400, response404 } from "../utils/resBack";
import { generateUniqueId } from "../utils/resuableCode";
import { apiErrorHandler } from "../utils/reqResHandler";
import { repoNames, repository } from "../db/repos";
import { RESPONSEAPI_MESSAGE } from "../utils/constants";

const options = {
  expiresIn: '12h', // Token expiration time
  algorithm: 'HS256', // Use a secure algorithm (HS256 is symmetric, RS256 is asymmetric)
};

@Service()
export class MobileController {
  constructor() { };

  async updateRecordFromTalukLevel(req, res) {
    const bodyData = req.body;
    const { SubmissionId, VerifiedMobile, VerifiedRole, ApplicationStatus } = bodyData;
    if (!SubmissionId) return response400(res, "Missing 'SubmissionId' in req formate");
    if (!VerifiedMobile) return response400(res, "Missing 'VerifiedMobile' in req formate");
    if (!VerifiedRole) return response400(res, "Missing 'VerifiedRole' in req formate");
    try {
      let result = await repository.waterShedDataRepo.findOneBy({ SubmissionId: Equal(SubmissionId) });
      if (!result?.CreatedRole) return response400(res, "Created role has not added");
      /* fetching all roles for checking id */
      let fecthedRoles = await repository.rolesRepo.find();
      if (fecthedRoles.length == 0) return response400(res, "Role not found.");
      /* searching child id with createdrole */
      let findChildId = fecthedRoles.find(obj => obj.RoleName == result.CreatedRole);
      if (!findChildId) return response400(res, "ChildId not found.");
      /* searching child id with verfiedrole */
      let findCurrentId = fecthedRoles.find(obj => obj.RoleName == VerifiedRole);
      if (!findChildId) return response400(res, "ChildId not found.");

      if (ApplicationStatus == "Seek Clarification") bodyData.RoleId = findChildId.id;
      bodyData.VerifiedId = Number(findCurrentId.id);
      let newData = { ...result, ...bodyData };
      await repository.waterShedDataRepo.save(newData);
      let resultForHistory = await repository.waterShedDataHistoryRepo.createQueryBuilder('ud')
        .where("ud.SubmissionId = :id", { id: SubmissionId })
        .orderBy("ud.CreatedDate", "DESC")
        .getOne();
      resultForHistory = !resultForHistory ? newData : resultForHistory;
      delete resultForHistory?.id;
      delete resultForHistory?.CreatedDate;
      delete resultForHistory?.UpdatedDate;
      let newUpdatedDate = { ...resultForHistory, ...bodyData, ...{ History: `Updated Application From TalukLevel - ${VerifiedRole}` } };
      await repository.waterShedDataHistoryRepo.save(newUpdatedDate);
      return response200(res, {}, "Updated existing application");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async addImagesToSubId(req, res) {
    const bodyData = req.body;
    const { SubmissionId, UserId, imagesList, StatusOfWork } = bodyData;
    if (!SubmissionId) return response400(res, "Missing 'SubmissionId' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!StatusOfWork) return response400(res, "Missing 'StatusOfWork' in req formate");
    try {
      for (let i = 0; i < imagesList.length; i++) {
        let eachList = imagesList[i];
        eachList['SubmissionId'] = SubmissionId;
        if (!eachList['SubmissionId']) return { code: 400, message: "Provide SubmissionId." };
        eachList['UserId'] = UserId;
        eachList['StatusOfWork'] = StatusOfWork;
        await repository.watershedImgAndVideoRepo.save(eachList);
      };
      return response200(res, {}, "New Images Added");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async loginToTaluk(req, res) {
    const bodyData = req.body;
    const { RoleId, Mobile } = bodyData;
    if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    // bodyData.Otp = generateOTP(4);
    bodyData.Otp = '1111';
    try {
      let fetchedUser = await repository.assignedMastersRepo.findOneBy({ RoleId: Equal(RoleId), Mobile: Equal(Mobile) });
      let newData = { ...fetchedUser, ...bodyData };
      await repository.assignedMastersRepo.save(newData);
      let fetchedWithRole = await repository.assignedMastersRepo.createQueryBuilder('vs')
        .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=vs.DistrictCode and md.TalukCode=vs.TalukCode')
        .select([`DISTINCT vs.DistrictCode DistrictCode, vs.TalukCode TalukCode, vs.UserId UserId, 
          CONCAT('D-',md.DistrictName,'-T-',md.TalukName) as AssignedTaluk`
        ])
        .where("vs.Mobile = :Mobile and vs.RoleId = :RoleId", { Mobile: Mobile, RoleId: RoleId })
        .getRawMany();
      let result = (fetchedWithRole || []).map(obj => {
        return {
          ...obj,
          Token: jsonwebtoken.sign({ DistrictCode: obj.DistrictCode, TalukCode: obj?.TalukCode, RoleId: obj.RoleId, UserId: obj.UserId },
            process.env.SECRET_KEY, options)
        };
      });
      return response200(res, { Otp: bodyData.Otp, mappedRes: result });
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async verfiyTalukOtp(req, res) {
    const bodyData = req.body;
    const { RoleId, Mobile, Otp } = bodyData;
    if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!Otp) return response400(res, "Missing 'Otp' in req formate");
    try {
      let fetchedUser = await repository.assignedMastersRepo.findOneBy({ RoleId: Equal(RoleId), Mobile: Equal(Mobile) });
      let otpCheck = fetchedUser.Otp == Otp;
      if (otpCheck) return response400(res, "Otp verfification failed");
      return response200(res, {}, "Otp verification successfully");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getTalukLevelSurvey(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { CategoryId, UserId, SubActivityId, SchemeId, SectorId, ActivityId, StatusOfWork, PageNo = 1, PageSize = 10, ApplicationStatus } = bodyData;
    const Category = CategoryId == '' ? null : CategoryId;
    const SubActivity = SubActivityId == '' ? null : SubActivityId;
    const Status = StatusOfWork == '' ? null : StatusOfWork;
    const AppStatus = ApplicationStatus == '' ? null : ApplicationStatus;

    if (!SchemeId) return response400(res, "Missing 'SchemeId' in req formate");
    if (!SectorId) return response400(res, "Missing 'SectorId' in req formate");
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!ActivityId) return response400(res, "Missing 'ActivityId' in req formate");
    try {
      let sp = `execute MobileTalukLevelSurveyList @0,@1,@2,@3,@4,@5,@6,@7,@8,@9`;
      let spForCounts = `execute MobileTalukLevelSurveyCounts @0,@1,@2,@3,@4,@5,@6,@7`;
      let resultForData = await AppDataSource.query(sp, [UserId, SchemeId, SectorId, Category, ActivityId, SubActivity, Status, AppStatus, PageNo, PageSize]);
      let resultForCounts = await AppDataSource.query(spForCounts, [UserId, SchemeId, SectorId, Category, ActivityId, SubActivity, Status, AppStatus]);
      let result = {
        totalCount: resultForCounts[0]?.TotalCount || 0,
        PageNo: PageNo,
        PageSize: PageSize,
        totalData: resultForData || []
      };
      return response200(res, result, "Retireved successFully");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async sendOtp(req, res) {
    const bodyData = req.body;
    const { Mobile, RoleId } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    bodyData.Otp = "1111";
    try {
      let fetchedVersion = await repository.versionRepo.find();
      bodyData.Version = fetchedVersion[0].Version;

      let findData = await repository.userDataRepo.findOneBy({ Mobile: Equal(Mobile), RoleId: Equal(RoleId) });
      if (!findData) return response404(res, "User not found");
      let newData = { ...findData, ...bodyData };
      await repository.userDataRepo.save(newData);
      let fecthedRecord = await repository.userDataRepo.createQueryBuilder('vs')
        .innerJoinAndSelect(repoNames.MasterDataTable, 'md', 'md.DistrictCode=vs.DistrictCode and md.TalukCode=vs.TalukCode and md.HobliCode=vs.HobliCode')
        .select([`DISTINCT vs.DistrictCode DistrictCode, vs.TalukCode TalukCode, vs.HobliCode HobliCode, vs.UserId UserId, 
            CONCAT('D-',md.DistrictName,'-T-',md.TalukName,'-H-',md.HobliName) as assignedHobli`
        ])
        .where("vs.Mobile = :Mobile and vs.RoleId = :RoleId", { Mobile: Mobile, RoleId: RoleId })
        .getRawMany();

      let result = (fecthedRecord || []).map(obj => {
        return {
          ...obj,
          Token: jsonwebtoken.sign({ DistrictCode: obj.DistrictCode, TalukCode: obj?.TalukCode, RoleId: obj.RoleId, UserId: obj.UserId },
            process.env.SECRET_KEY, options)
        }
      })
      return response200(res, { Otp: bodyData?.Otp, mappedRes: result }, "Retireved successFully");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async assignedHobliDetails(req, res) {
    const bodyData = req.body;
    const { DistrictCode, TalukCode, HobliCode } = bodyData;

    if (!DistrictCode) return response400(res, "Missing 'DistrictCode' in req formate");
    if (!TalukCode) return response400(res, "Missing 'TalukCode' in req formate");
    if (!HobliCode) return response400(res, "Missing 'HobliCode' in req formate");
    try {
      let result = await repository.masterDataRepo.createQueryBuilder('md')
        .select(["DISTINCT md.VillageName as VillageName"])
        .where("md.DistrictCode = :dcode and md.TalukCode = :tcode and md.HobliCode = :hcode",
          { dcode: DistrictCode, tcode: TalukCode, hcode: HobliCode })
        .getRawMany();
      return response200(res, result, "Retireved successFully");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getWatershedOrSub(req, res) {
    const bodyData = req.body;
    const { DistrictCode, TalukCode, HobliCode, VillageName } = bodyData;

    if (!DistrictCode) return response400(res, "Missing 'DistrictCode' in req formate");
    if (!TalukCode) return response400(res, "Missing 'TalukCode' in req formate");
    if (!HobliCode) return response400(res, "Missing 'HobliCode' in req formate");
    if (!VillageName) return response400(res, "Missing 'VillageName' in req formate");
    try {
      let result = await repository.masterDataRepo.createQueryBuilder('md')
        .select(['DISTINCT md.SubWatershedCode, md.SubWatershedName SubWatershedName'])
        .where("md.DistrictCode = :dcode and md.TalukCode = :tcode and md.HobliCode = :hcode and md.VillageName = :vName",
          { dcode: DistrictCode, tcode: TalukCode, hcode: HobliCode, vName: VillageName })
        .getRawMany();
      let resultLength = result.length;
      for (let i = 0; i < resultLength; i++) {
        let eachIndex = result[i];
        eachIndex['MicroData'] = await repository.masterDataRepo.createQueryBuilder('md')
          .select(['DISTINCT md.MicroWatershedCode, md.MicroWatershedName MicroWatershedName'])
          .where("md.DistrictCode = :dcode and md.TalukCode = :tcode and md.HobliCode = :hcode and md.VillageName = :vName and md.SubWatershedCode = :swc",
            { dcode: DistrictCode, tcode: TalukCode, hcode: HobliCode, vName: VillageName, swc: eachIndex?.SubWatershedCode })
          .getRawMany();;
      }
      return response200(res, result, "Retireved successFully");
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async verifyOtp(req, res) {
    const bodyData = req.body;
    const { Mobile, Otp, RoleId } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    try {
      let result = await repository.userDataRepo.findOneBy({ Mobile: Equal(Mobile), RoleId: Equal(RoleId) });
      if (!result) return response404(res, "User not found");
      if (result.Otp !== Otp) return response400(res, RESPONSEAPI_MESSAGE.OTP_VERFIY_FAILED);
      return response200(res, {}, RESPONSEAPI_MESSAGE.OTP_VERFIY);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAllSchemes(req, res) {
    const bodyData = req.body;
    const { RoleId } = bodyData;

    if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    try {
      let result = await repository.schemesRepo.createQueryBuilder('scheme')
        .select(["scheme.SchemeName as SchemeName", "scheme.SchemeLogo as SchemeLogo", "scheme.id as SchemeId"])
        .where("scheme.RoleId = :RoleId", { RoleId: RoleId })
        .getRawMany();
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAllRoles(req, res) {
    try {
      let result = await repository.rolesRepo.createQueryBuilder('role')
        .select(["role.RoleName as RoleName", "role.id as RoleId"])
        .where("role.IsMobile = :IsMobile", { IsMobile: 'Yes' })
        .getRawMany();
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getSectors(req, res) {
    const bodyData = req.body;
    const { SchemeId } = bodyData;

    try {
      let fetchedNew = await repository.sectorsRepo.createQueryBuilder('sec')
        .select(["sec.SectorName as SectorName", "sec.SectorLogo as SectorLogo", "sec.id as SectorId", "sec.IsCategory as IsCategory"])
        .where("sec.SchemeId = :SchemeId and sec.RecordType = :Record", { SchemeId: SchemeId, Record: "New Sector" })
        .getRawMany();
      let fetchExisting = await repository.sectorsRepo.createQueryBuilder('sec')
        .innerJoinAndSelect(repoNames.SectorsTable, 'sec1', 'sec1.id=sec.SectorId')
        .select(["sec1.SectorName as SectorName", "sec.SectorLogo as SectorLogo", "sec.SectorId as SectorId", "sec.IsCategory as IsCategory"])
        .where("sec.SchemeId = :SchemeId and sec.RecordType = :Record", { SchemeId: SchemeId, Record: "Existing Sector" })
        .getRawMany();
      let result = fetchedNew.concat(fetchExisting);
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getActivity(req, res) {
    const bodyData = req.body;
    const { Type, Id } = bodyData;
    // if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    try {
      if (Type == "Category") {
        let newArray = [];
        let activityData = await repository.activityRepo.createQueryBuilder('ac')
          .select(["ac.ActivityName as ActivityName", "ac.id as ActivityId", "ac.TypeOfWork as TypeOfWork", "ac.TypeOfLand as TypeOfLand", "ac.TypeOfStatus as TypeOfStatus"])
          .where("ac.CategoryId = :CategoryId and ac.ParentId = :ParentId", { CategoryId: Id, ParentId: '-1' })
          .getRawMany();
        let activityDataLength = activityData.length;
        for (let i = 0; i < activityDataLength; i++) {
          let eachActitivy = { ...activityData[i] };
          delete activityData[i];
          eachActitivy['SubActivity'] = await repository.activityRepo.createQueryBuilder('ac')
            .select(["ac.ActivityName as ActivityName", "ac.id as SubActivityId", "ac.TypeOfWork as TypeOfWork", "ac.TypeOfLand as TypeOfLand", "ac.TypeOfStatus as TypeOfStatus"])
            .where("ac.ParentId = :ParentId", { ParentId: eachActitivy?.ActivityId })
            .getRawMany();
          newArray.push(eachActitivy);
        };
        return response200(res, newArray, RESPONSEAPI_MESSAGE.FETCHED);
      } else {
        let newArray = [];
        let activityData = await repository.activityRepo.createQueryBuilder('ac')
          .select(["ac.ActivityName as ActivityName", "ac.id as ActivityId", "ac.TypeOfWork as TypeOfWork", "ac.TypeOfLand as TypeOfLand", "ac.TypeOfStatus as TypeOfStatus"])
          .where("ac.SectorId = :SectorId and ac.ParentId = :ParentId", { SectorId: Id, ParentId: '-1' })
          .getRawMany();
        let activityDataLength = activityData.length;
        for (let i = 0; i < activityDataLength; i++) {
          let eachActitivy = { ...activityData[i] };
          delete activityData[i];
          eachActitivy['SubActivity'] = await repository.activityRepo.createQueryBuilder('ac')
            .select(["ac.ActivityName as ActivityName", "ac.id as SubActivityId", "ac.TypeOfWork as TypeOfWork", "ac.TypeOfLand as TypeOfLand", "ac.TypeOfStatus as TypeOfStatus"])
            .where("ac.ParentId = :ParentId", { ParentId: eachActitivy?.ActivityId })
            .getRawMany();
          newArray.push(eachActitivy);
        }
        return response200(res, newArray, RESPONSEAPI_MESSAGE.FETCHED);
      };
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getCategory(req, res) {
    const bodyData = req.body;
    const { SectorId } = bodyData;
    try {
      let newArray = [];
      let categoryData = await repository.categoryRepo.createQueryBuilder('ac')
        .select(["ac.CategoryName as CategoryName", "ac.id as CategoryId"])
        .where("ac.SectorId = :SectorId and ac.ParentId = :ParentId", { SectorId: SectorId, ParentId: '-1' })
        .getRawMany();
      let categoryDataLength = categoryData.length;
      for (let i = 0; i < categoryDataLength; i++) {
        let eachCategory = { ...categoryData[i] };
        delete categoryData[i];
        eachCategory['SubCategory'] = await repository.categoryRepo.createQueryBuilder('ac')
          .select(["ac.CategoryName as CategoryName", "ac.id as CategoryId"])
          .where("ac.ParentId = :ParentId", { ParentId: eachCategory?.CategoryId })
          .getRawMany();
        newArray.push(eachCategory);
      }
      return response200(res, newArray, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getQuestionsBasedOnActivity(req, res) {
    const bodyData = req.body;
    const { ActivityId } = bodyData;
    try {
      let questionsJson = await repository.questionMappingRepo.createQueryBuilder('qm')
        .leftJoinAndSelect(repoNames.QuestionsTable, 'qu', "qu.id = qm.QuestionId")
        .select(["qu.QuestionId as QuestionId", "qu.Question as Question", "qu.QuestionType as QuestionType", "qu.DropDownValues as DropDownValues", "qu.IsMandatory as IsMandatory"])
        .where("qm.ActivityId = :ActivityId", { ActivityId: ActivityId })
        .getRawMany();
      let questionsJsonLength = questionsJson.length;
      const newArray = [];
      for (let i = 0; i < questionsJsonLength; i++) {
        let eachCloneQuestion = { ...questionsJson[i] };
        let eachQuestion = questionsJson[i];
        delete eachCloneQuestion.DropDownValues;

        if (eachQuestion.QuestionType == "DropdownFromId") {
          eachCloneQuestion['DropdownValues'] = await repository.questionDropdownTypesRepo.createQueryBuilder('qdv')
            .select(["qdv.DropdownName as value"])
            .where("qdv.DropdownType = :DropdownType", { DropdownType: eachQuestion.DropDownValues })
            .getRawMany();

        } else {
          eachCloneQuestion['DropdownValues'] = [];
        };
        newArray.push(eachCloneQuestion);
      };
      return response200(res, newArray, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getPrivateLand(req, res) {
    const bodyData = req.body;
    const { Village, Page = 1, PageSize = 20 } = bodyData;
    if (!Village) return response400(res, "Missing 'Village' in req formate");
    try {
      let [VillageEn, VillageKa] = Village.split("-k-");
      const page = Page; // Example: current page number
      const pageSize = PageSize; // Example: number of records per page
      const [results, total] = await repository.dprsPrivateLandRepo.createQueryBuilder('dprs')
        // .where('dprs.Village = :Village or dprs.Village = :VillageKa', { Village: VillageEn.trim(), VillageKa: VillageKa.trim() })
        .where('dprs.Village = :Village', { Village: VillageEn.trim() })
        .orderBy('dprs."id"', 'ASC') // Make sure to use an appropriate column for ordering
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();
      const totalPages = Math.ceil(total / pageSize);
      let result = {
        total,
        page,
        pageSize,
        totalPages,
        totalData: results
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getCommonLand(req, res) {
    const bodyData = req.body;
    const { Village, Page = 1, PageSize = 20 } = bodyData;
    if (!Village) return response400(res, "Missing 'Village' in req formate");
    try {
      let [VillageEn, VillageKa] = Village.split("-k-");
      const page = Page; // Example: current page number
      const pageSize = PageSize; // Example: number of records per page
      const [results, total] = await repository.dprsCommonLandRepo.createQueryBuilder('dprs')
        // .where('dprs.Village = :Village or dprs.Village = :VillageKa', { Village: VillageEn.trim(), VillageKa: VillageKa.trim() })
        .where('dprs.Village = :Village', { Village: VillageEn.trim() })
        .orderBy('dprs."id"', 'ASC') // Make sure to use an appropriate column for ordering
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();
      const totalPages = Math.ceil(total / pageSize);
      let result = {
        total,
        page,
        pageSize,
        totalPages,
        totalData: results
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async saveSurveyData(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { imagesList, UserId, FruitsId, ActivityId, TypeOfLand, SchemeId, SectorId, ApplicationStatus, SubWatershedCode, MicroWatershedCode, RoleId } = bodyData;
    bodyData.SubmissionId = "WS" + "-" + generateUniqueId().slice(2) + "-" + Math.floor(Math.random() * 1000);

    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!ActivityId) return response400(res, "Missing 'ActivityId' in req formate");
    if (!TypeOfLand) return response400(res, "Missing 'TypeOfLand' in req formate");
    if (!SchemeId) return response400(res, "Missing 'SchemeId' in req formate");
    if (!SectorId) return response400(res, "Missing 'SectorId' in req formate");
    if (!ApplicationStatus) return response400(res, "Missing 'ApplicationStatus' in req formate");
    if (!SubWatershedCode) return response400(res, "Missing 'SubWatershedCode' in req formate");
    if (!MicroWatershedCode) return response400(res, "Missing 'MicroWatershedCode' in req formate");
    if (!MicroWatershedCode) return response400(res, "Missing 'MicroWatershedCode' in req formate");
    if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    try {
      if (TypeOfLand == "Private Land") {
        if (!FruitsId) return response400(res, "Missing 'FruitsId' in req formate");
        let fetchedRecord = await repository.waterShedDataRepo.findOneBy({ FruitsId: Equal(FruitsId), ActivityId: Equal(ActivityId) });
        if (fetchedRecord && fetchedRecord?.ApplicationStatus !== "Rejected") return response400(res, `Application already registered with SubId ${fetchedRecord?.SubmissionId} with FruitId ${fetchedRecord?.FruitsId} in this same activity.`);
      };
      let findData = await repository.userDataRepo.createQueryBuilder('ud')
        .innerJoinAndSelect(repoNames.RolesTable, 'rr', "rr.id = ud.RoleId")
        .select(["ud.Mobile as Mobile", "ud.Name as Name", "rr.RoleName as RoleName", "rr.id as RoleId"])
        .where("ud.UserId = :id", { id: UserId })
        .getRawOne();
      if (!findData) return response404(res, "User not found");

      bodyData.CreatedRole = findData['RoleName'];
      bodyData.CreatedMobile = findData?.Mobile;
      bodyData.CreatedName = findData?.Name;
      bodyData.VerifiedId = Number(bodyData?.RoleId);
      let result = await repository.waterShedDataRepo.save(bodyData);
      await repository.waterShedDataHistoryRepo.save({ ...result, ...{ History: "New Application Added" } });
      if (Array.isArray(imagesList)) {
        let error;
        for (let i = 0; i < imagesList.length; i++) {
          let eachList = imagesList[i];
          eachList['SubmissionId'] = result.SubmissionId;
          eachList['UserId'] = UserId;
          eachList['StatusOfWork'] = "Site Selection";
          let saveImage = await repository.watershedImgAndVideoRepo.save(eachList);
          if (saveImage?.code == 422) {
            error = saveImage.message;
          };
        };
        if (error) return response400(res, error);
      }
      return response200(res, {}, RESPONSEAPI_MESSAGE.INSERTED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getSubmissionList(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, PageNo = 1, PageSize = 10, StatusOfWork, CategoryId, SchemeId, SectorId, ActivityId, SubActivityId } = bodyData;
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    try {
      let whereCondition = CategoryId && SubActivityId ? { UserId: Equal(UserId), StatusOfWork: Equal(StatusOfWork), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), CategoryId: Equal(CategoryId), ActivityId: Equal(ActivityId), SubActivityId: Equal(SubActivityId) }
        : CategoryId && !SubActivityId ? { UserId: Equal(UserId), StatusOfWork: Equal(StatusOfWork), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), CategoryId: Equal(CategoryId), ActivityId: Equal(ActivityId) }
          : SubActivityId && !CategoryId ? { UserId: Equal(UserId), StatusOfWork: Equal(StatusOfWork), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), ActivityId: Equal(ActivityId), SubActivityId: Equal(SubActivityId) }
            : { UserId: Equal(UserId), StatusOfWork: Equal(StatusOfWork), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), ActivityId: Equal(ActivityId) };

      let totalData = await repository.waterShedDataRepo.findAndCount({
        where: whereCondition,
        select: ["UserId", "SubmissionId", "CreatedDate", "BeneficaryName", "FruitsId", "MobileNumber", "StatusOfWork", "ActivityType", "TypeOfLand"],
        skip: (PageNo - 1) * PageSize,
        take: PageSize
      });
      let result = {
        totalCount: totalData[1],
        PageNo,
        PageSize,
        totalData: totalData[0]
      }
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAllSubmissionList(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, PageNo = 1, PageSize = 10, CategoryId, SchemeId, SectorId, ActivityId, SubActivityId } = bodyData;
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    try {
      let whereCondition = CategoryId && SubActivityId ? { UserId: Equal(UserId), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), CategoryId: Equal(CategoryId), ActivityId: Equal(ActivityId), SubActivityId: Equal(SubActivityId) }
        : CategoryId && !SubActivityId ? { UserId: Equal(UserId), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), CategoryId: Equal(CategoryId), ActivityId: Equal(ActivityId) }
          : SubActivityId && !CategoryId ? { UserId: Equal(UserId), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), ActivityId: Equal(ActivityId), SubActivityId: Equal(SubActivityId) }
            : { UserId: Equal(UserId), SchemeId: Equal(SchemeId), SectorId: Equal(SectorId), ActivityId: Equal(ActivityId) };

      let totalData = await repository.waterShedDataRepo.findAndCount({
        where: whereCondition,
        select: ["UserId", "SubmissionId", "CreatedDate", "BeneficaryName", "FruitsId", "MobileNumber", "StatusOfWork", "ActivityType", "TypeOfLand"],
        skip: (PageNo - 1) * PageSize,
        take: PageSize
      });
      let result = {
        totalCount: totalData[1],
        PageNo,
        PageSize,
        totalData: totalData[0]
      }
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };


  async getSurveyByUserAndStatus(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, PageNo = 1, PageSize = 10, StatusOfWork, CategoryId, SchemeId, SectorId, ActivityId, SubActivityId, ApplicationStatus } = bodyData;
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!SchemeId) return response400(res, "Missing 'SchemeId' in req formate");
    if (!SectorId) return response400(res, "Missing 'SectorId' in req formate");
    if (!ActivityId) return response400(res, "Missing 'ActivityId' in req formate");
    if (!StatusOfWork) return response400(res, "Missing 'StatusOfWork' in req formate");
    try {
      let sp = `execute MobileSurveyList @0,@1,@2,@3,@4,@5,@6,@7,@8,@9`;
      let spForCounts = `execute MobileSurveyListCounts @0,@1,@2,@3,@4,@5,@6,@7`;
      let resultForData = await AppDataSource.query(sp, [UserId, SchemeId, SectorId, CategoryId, ActivityId, SubActivityId, StatusOfWork, ApplicationStatus, PageNo, PageSize]);
      let resultForCounts = await AppDataSource.query(spForCounts, [UserId, SchemeId, SectorId, CategoryId, ActivityId, SubActivityId, StatusOfWork, ApplicationStatus]);
      let result = {
        totalCount: resultForCounts[0]?.TotalCount || 0,
        PageNo: PageNo,
        PageSize: PageSize,
        totalData: resultForData || []
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAllSurveyListByUserId(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { UserId, PageNo = 1, PageSize = 10, CategoryId, SchemeId, SectorId, ActivityId, SubActivityId, StatusOfWork, ApplicationStatus } = bodyData;
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!SchemeId) return response400(res, "Missing 'SchemeId' in req formate");
    if (!SectorId) return response400(res, "Missing 'SectorId' in req formate");
    if (!ActivityId) return response400(res, "Missing 'ActivityId' in req formate");
    try {
      let sp = `execute MobileSurveyList @0,@1,@2,@3,@4,@5,@6,@7,@8,@9`;
      let spForCounts = `execute MobileSurveyListCounts @0,@1,@2,@3,@4,@5,@6,@7`;
      let resultForData = await AppDataSource.query(sp, [UserId, SchemeId, SectorId, CategoryId, ActivityId, SubActivityId, StatusOfWork, ApplicationStatus, PageNo, PageSize]);
      let resultForCounts = await AppDataSource.query(spForCounts, [UserId, SchemeId, SectorId, CategoryId, ActivityId, SubActivityId, StatusOfWork, ApplicationStatus]);
      let result = {
        totalCount: resultForCounts[0]?.TotalCount || 0,
        PageNo: PageNo,
        PageSize: PageSize,
        totalData: resultForData || []
      };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };


  async getRecord(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { UserId, SubmissionId, SectorId } = bodyData;
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!SubmissionId) return response400(res, "Missing 'SubmissionId' in req formate");
    if (!SectorId) return response400(res, "Missing 'SectorId' in req formate");
    try {
      let query = `execute getRecordForPreview @0,@1,@2`;
      let result = await AppDataSource.query(query, [UserId, SubmissionId, SectorId]);
      result[0]['ImagesList'] = await repository.watershedImgAndVideoRepo.find({
        where: { SubmissionId: Equal(SubmissionId) },
        select: ["Latitude", "Longitude", "RecordType", "Url"]
      })
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async updateSurveyData(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { UserId, SubmissionId, SectorId } = bodyData;
    if (!UserId) return response400(res, "Missing 'UserId' in req formate");
    if (!SubmissionId) return response400(res, "Missing 'SubmissionId' in req formate");
    if (!SectorId) return response400(res, "Missing 'SectorId' in req formate");
    try {
      let fetchedRecord = await repository.waterShedDataRepo.findOneBy({ SubmissionId: Equal(SubmissionId) });
      let fetchedUser = await repository.userDataRepo.findOneBy({ UserId: Equal(UserId) });
      let userData = { CreatedMobile: fetchedUser.Mobile, CreatedRole: fetchedUser.RoleId, CreatedName: fetchedUser.Name };
      let newData = { ...fetchedRecord, ...bodyData, ...userData };
      let findHistory = await repository.waterShedDataHistoryRepo.findOneBy({ SubmissionId: Equal(SubmissionId) });
      await repository.waterShedDataHistoryRepo.save({ ...findHistory, ...{ History: "Updated Application Added" }, ...newData, ...userData });
      let result = await repository.waterShedDataRepo.save(newData);
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async retriveMasters(req, res) {
    const bodyData = req.body;
    const { DistrictCode } = bodyData;
    if (!DistrictCode) return response400(res, "Missing 'DistrictCode' in req formate");
    try {
      if (!DistrictCode) {
        let result = await repository.masterDataRepo.createQueryBuilder('md')
          .select("DISTINCT DistrictCode, DistrictName")
          .getRawMany();;
        return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
      } else {
        let result = await repository.masterDataRepo.createQueryBuilder('md')
          .select("DISTINCT DistrictCode, DistrictName")
          .where("md.DistrictCode= :id", { id: DistrictCode })
          .getRawMany();;
        result[0]['TalukArray'] = await repository.masterDataRepo.createQueryBuilder('md')
          .select("DISTINCT TalukCode, TalukName")
          .where("md.DistrictCode= :id", { id: result[0]?.DistrictCode })
          .getRawMany();
        for (let i = 0; i < result[0]['TalukArray'].length; i++) {
          let each = result[0]['TalukArray'][i];
          each['HobliArray'] = await repository.masterDataRepo.createQueryBuilder('md')
            .select("DISTINCT HobliCode, HobliName")
            .where("md.TalukCode= :id and md.DistrictCode = :dcode", { id: each.TalukCode, dcode: result[0]?.DistrictCode })
            .getRawMany();;
          for (let j = 0; j < each['HobliArray'].length; j++) {
            let eachHobliObj = each['HobliArray'][j];
            eachHobliObj['VillageArray'] = await repository.masterDataRepo.createQueryBuilder('md')
              .select("DISTINCT VillageName")
              .where("md.TalukCode= :id and md.DistrictCode = :dcode and md.HobliCode= :hcode", { id: each.TalukCode, dcode: result[0]?.DistrictCode, hcode: eachHobliObj.HobliCode })
              .getRawMany();;
          };
        };
        return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
      };
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async uploadImages(req, res) {
    try {
      let bodyData = {
        ImageName: req.file.originalname,
        ImageData: req.file.buffer,
        UserId: req.user?.userid
      };
      const { ImageData, ImageName, UserId } = bodyData;
      if (!ImageName) return response400(res, "Missing 'ImageName' in req formate");
      if (!ImageData) return response400(res, "Missing 'ImageData' in req formate");
      let fetchedRecord = await repository.uploadImgAndVideoRepo.save({ ImageData, ImageName, RecordType: 'Image', UserId });
      let insertedId = fetchedRecord.id;
      // Construct video URL
      const imageUrl = `${process.env.PRO_URL}/wapi/mobile/getImage/${insertedId}`;
      let result = { insertedId: insertedId, imageUrlUrl: imageUrl };
      return response200(res, result, RESPONSEAPI_MESSAGE.FETCHED);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getImage(req, res) {
    const bodyData = req.params;
    const { id } = bodyData;
    try {
      let fetchedRecord = await repository.uploadImgAndVideoRepo.findOneBy({ id: Equal(id) });
      if (!fetchedRecord) return response404(res, "Image not found");
      res.setHeader('Content-Disposition', `inline; filename="${fetchedRecord.ImageName}"`);
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(fetchedRecord.ImageData);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async updateFromLowerLevel(req, res) {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { SubmissionId, VerifiedRole } = bodyData;
    if (!SubmissionId) return response400(res, "Missing 'SubmissionId' in req formate");
    if (!VerifiedRole) return response400(res, "Missing 'VerifiedRole' in req formate");
    try {
      let resultForOri = await repository.waterShedDataRepo.findOneBy({ SubmissionId: Equal(SubmissionId) });
      bodyData.VerifiedId = Number(bodyData.RoleId);
      let newData = { ...resultForOri, ...bodyData };
      let resultForHistory = await repository.waterShedDataHistoryRepo.createQueryBuilder('ud')
        .where("ud.SubmissionId = :id", { id: SubmissionId })
        .orderBy("ud.CreatedDate", "DESC")
        .getOne();
      resultForHistory = !resultForHistory ? newData : resultForHistory;
      delete resultForHistory?.id;
      delete resultForHistory?.CreatedDate;
      delete resultForHistory?.UpdatedDate;
      let newUpdatedDate = { ...resultForHistory, ...bodyData, ...{ History: `Updated Application From Survey Level - ${VerifiedRole}` } };
      await repository.waterShedDataHistoryRepo.save(newUpdatedDate);
      await repository.waterShedDataRepo.save(newData);
      return response200(res, {});
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };
}