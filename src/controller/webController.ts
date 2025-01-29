import { Equal } from "typeorm";
import { Service } from "typedi";
import jsonwebtoken, { Algorithm } from 'jsonwebtoken';
import crypto from "crypto";

import { AppDataSource } from "../db/config";
import { response200, response400, response404 } from "../utils/resBack";
import { encryptData, generateOtp } from "../utils/resuableCode";
import { apiErrorHandler } from "../utils/reqResHandler";
import { repoNames, repository } from "../db/repos";
import XLSX from "xlsx";
import { sendOtpAsSingleSms } from "../utils/smsServceResusable";
import { RESPONSEMSG } from "../utils/statusCodes";

interface ExcelData {
  [key: string]: string | number;
}

const options = {
  expiresIn: '12h', // Token expiration time
  algorithm: 'HS256' as Algorithm, // Use a secure algorithm (HS256 is symmetric, RS256 is asymmetric)
};

export const secretKey = crypto.randomBytes(32).toString('hex'); // Replace with a pre-shared secret key

@Service()
export class WebController {
  constructor() { };

  async checkMobileLogin(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { Mobile } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    try {
      let fetchedUser = await repository.assignedMastersRepo.createQueryBuilder('ud')
        .leftJoinAndSelect(repoNames.RolesTable, 'lr', "lr.id = ud.RoleId")
        .select(["DISTINCT lr.RoleName", "lr.id as RoleId"])
        .where("ud.Mobile = :Mobile", { Mobile })
        .getRawMany();
      if (fetchedUser.length == 0) return response404(res, "User not found");
      // let fetchedRecord = await repository.assignedMastersRepo.findOneBy({ Mobile: Equal(Mobile) });
      // let updateObj = { ...fetchedRecord, ...{ Otp: bodyData.Otp } }
      // await repository.assignedMastersRepo.save(updateObj);
      let result = {
        UserData: fetchedUser
      };
      return response200(res, encryptData(result, secretKey));
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getDataAccess(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { Mobile, Id } = bodyData;

    bodyData.Otp = generateOtp(6);
    // bodyData.Otp = "1111";

    if (!Id) return response400(res, "Missing 'Id' in req formate");
    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    try {
      let fetchedUser = await repository.assignedMastersRepo.findOneBy({ RoleId: Equal(bodyData.Id), Mobile: Equal(Mobile) });
      if (!fetchedUser) return response404(res, "User not found");
      let smsOtp = await sendOtpAsSingleSms(Mobile, bodyData.Otp);
      if (smsOtp !== 200) return response400(res, RESPONSEMSG.OTP_FAILED);
      let newData = { ...fetchedUser, ...{ Otp: bodyData?.Otp } }
      await repository.assignedMastersRepo.save(newData);

      let fecthedRole = await repository.rolesAccessRepo.findOneBy({ RoleId: Equal(bodyData.Id) });
      if (!fecthedRole) return response404(res, "Role access not found");

      let result = {
        UserId: fetchedUser['UserId'],
        access: fecthedRole
      };
      return response200(res, encryptData(result, secretKey));
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async verifyOtp(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { Id, Otp } = bodyData;

    if (!Id) return response400(res, "Missing 'Id' in req formate");
    if (!Otp) return response400(res, "Missing 'Otp' in req formate");
    try {
      let fetchedUser = await repository.assignedMastersRepo.findOneBy({ UserId: Equal(Id) });
      if (!fetchedUser) return response404(res, "User not found");
      let checkOtp = fetchedUser.Otp === Otp;
      if (!checkOtp) return response400(res, "Otp verification failed");

      let result = {
        Token: jsonwebtoken.sign({ UserId: Id }, process.env.SECRET_KEY!, options)
      };
      return response200(res, encryptData(result, secretKey));
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async assignedHobliDetails(req: any, res: any): Promise<any> {
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

  async getMasterDropDown(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { ReqType, UDCode, UTCode, UPCode, Mobile, loginType, ListType, Type } = bodyData;

    // if (!ListType) return response400(res, "Missing 'ListType' in req formate");
    // if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!ReqType) response400(res, "Missing 'ReqType' in req formate");
    try {
      if (ReqType == 1) {
        if (loginType == "District") {
          let result = await repository.masterDataRepo.createQueryBuilder('dd')
            .innerJoinAndSelect(repoNames.AssignedMastersTable, 'am', 'am.DistrictCode=dd.DistrictCode')
            .select(["DISTINCT dd.DistrictCode as value", "dd.DistrictName as name"])
            .where("am.Mobile = :Mobile and am.ListType = :ListType and am.Type = :Type", { Mobile, ListType, Type })
            .getRawMany();
          return response200(res, result);
        };
        let fetchedResult = await repository.masterDataRepo.createQueryBuilder('dd')
          .select(["DISTINCT dd.DistrictCode as value", "dd.DistrictName as name"])
          .orderBy("DistrictName", "DESC")
          .where("dd.Type = :Type", { Type })
          .getRawMany();
        return response200(res, fetchedResult);

      } else if (ReqType == 2) {
        if (loginType == "Taluk") {
          let result = await repository.masterDataRepo.createQueryBuilder('tt')
            .leftJoinAndSelect(repoNames.AssignedMastersTable, 'am', 'am.TalukCode=tt.TalukCode and am.DistrictCode=tt.DistrictCode and am.Type=tt.Type')
            .select(["DISTINCT tt.TalukCode as value", "tt.TalukName as name"])
            .where("am.Mobile = :Mobile and am.ListType = :ListType and am.Type = :Type", { Mobile, ListType, Type })
            .getRawMany();
          return response200(res, result);
        };
        if (!UDCode) return { code: 400, message: "Provide UDCode" };
        let fetchedResult = await repository.masterDataRepo.createQueryBuilder('tt')
          .select(["DISTINCT tt.TalukCode as value", "tt.TalukName as name"])
          .where("tt.DistrictCode = :dc and tt.Type = :Type", { dc: UDCode, Type })
          .getRawMany();
        return response200(res, fetchedResult);

      } else if (ReqType == 3) {
        if (loginType == "Phco") {
          let result = await repository.masterDataRepo.createQueryBuilder('gd')
            .innerJoinAndSelect(repoNames.AssignedMastersTable, 'am', 'am.TalukCode=gd.TalukCode and am.DistrictCode=gd.DistrictCode and am.PhcoCode=gd.PhcoCode and am.Type=gd.Type')
            .select(["DISTINCT gd.PhcoCode as value", "gd.PhcoName as name"])
            .where("am.Mobile = :Mobile and am.ListType = :ListType and am.Type = :Type", { Mobile, ListType, Type })
            .getRawMany();
          return response200(res, result);
        };
        if (!UDCode) return { code: 400, message: "Provide UDCode" };
        if (!UTCode) return { code: 400, message: "Provide UTCode" };
        let fetchedResult = await repository.masterDataRepo.createQueryBuilder('gd')
          .select(["DISTINCT gd.PhcoCode as value", "gd.PhcoName as name"])
          .where("gd.TalukCode = :tc and gd.DistrictCode = :dc and gd.Type = :Type", { tc: UTCode, dc: UDCode, Type })
          .getRawMany();
        return response200(res, fetchedResult);
      } else if (ReqType == 4) {
        if (!UDCode) return { code: 400, message: "Provide UDCode" };
        if (!UTCode) return { code: 400, message: "Provide UTCode" };
        if (!UPCode) return { code: 400, message: "Provide UPCode" };
        let result = await repository.masterDataRepo.createQueryBuilder('vd')
          .select(["DISTINCT vd.SubCenterCode as value", "vd.SubCenterName as name"])
          .where("vd.PhcoCode = :hc and vd.DistrictCode = :dc and vd.TalukCOde = :tc and vd.Type = :Type", { hc: UPCode, dc: UDCode, tc: UTCode, Type })
          .getRawMany();
        return response200(res, result);
      } else {
        return response400(res, "Your request is not found");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getMasterDropDownForReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { ReqType, UDCode, UTCode, UPCode, Mobile, loginType, ListType, Type } = bodyData;

    // if (!ListType) return response400(res, "Missing 'ListType' in req formate");
    // if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!ReqType) response400(res, "Missing 'ReqType' in req formate");
    try {
      if (ReqType == 1) {
        if (loginType == "District") {
          let result = await repository.masterDataRepo.createQueryBuilder('dd')
            .innerJoinAndSelect(repoNames.AssignedMastersTable, 'am', 'am.DistrictCode=dd.DistrictCode')
            .select(["DISTINCT dd.DistrictCode as value", "dd.DistrictName as name"])
            .where("am.Mobile = :Mobile and am.ListType = :ListType", { Mobile, ListType })
            .getRawMany();
          return response200(res, result);
        };
        let fetchedResult = await repository.masterDataRepo.createQueryBuilder('dd')
          .select(["DISTINCT dd.DistrictCode as value", "dd.DistrictName as name"])
          .orderBy("DistrictName", "DESC")
          .getRawMany();
        return response200(res, fetchedResult);

      } else if (ReqType == 2) {
        if (loginType == "Taluk") {
          let result = await repository.masterDataRepo.createQueryBuilder('tt')
            .leftJoinAndSelect(repoNames.AssignedMastersTable, 'am', 'am.TalukCode=tt.TalukCode and am.DistrictCode=tt.DistrictCode')
            .select(["DISTINCT tt.TalukCode as value", "tt.TalukName as name"])
            .where("am.Mobile = :Mobile and am.ListType = :ListType", { Mobile, ListType })
            .getRawMany();
          return response200(res, result);
        };
        if (!UDCode) return { code: 400, message: "Provide UDCode" };
        let fetchedResult = await repository.masterDataRepo.createQueryBuilder('tt')
          .select(["DISTINCT tt.TalukCode as value", "tt.TalukName as name"])
          .where("tt.DistrictCode = :dc", { dc: UDCode })
          .getRawMany();
        return response200(res, fetchedResult);

      } else if (ReqType == 3) {
        if (loginType == "Phco") {
          let result = await repository.masterDataRepo.createQueryBuilder('gd')
            .innerJoinAndSelect(repoNames.AssignedMastersTable, 'am', 'am.TalukCode=gd.TalukCode and am.DistrictCode=gd.DistrictCode and am.PhcoCode=gd.PhcoCode')
            .select(["DISTINCT gd.PhcoCode as value", "gd.PhcoName as name"])
            .where("am.Mobile = :Mobile and am.ListType = :ListType", { Mobile, ListType })
            .getRawMany();
          return response200(res, result);
        };
        if (!UDCode) return { code: 400, message: "Provide UDCode" };
        if (!UTCode) return { code: 400, message: "Provide UTCode" };
        let fetchedResult = await repository.masterDataRepo.createQueryBuilder('gd')
          .select(["DISTINCT gd.PhcoCode as value", "gd.PhcoName as name"])
          .where("gd.TalukCode = :tc and gd.DistrictCode = :dc", { tc: UTCode, dc: UDCode })
          .getRawMany();
        return response200(res, fetchedResult);
      } else if (ReqType == 4) {
        if (!UDCode) return { code: 400, message: "Provide UDCode" };
        if (!UTCode) return { code: 400, message: "Provide UTCode" };
        if (!UPCode) return { code: 400, message: "Provide UPCode" };
        let result = await repository.masterDataRepo.createQueryBuilder('vd')
          .select(["DISTINCT vd.SubCenterCode as value", "vd.SubCenterName as name"])
          .where("vd.PhcoCode = :hc and vd.DistrictCode = :dc and vd.TalukCOde = :tc", { hc: UPCode, dc: UDCode, tc: UTCode })
          .getRawMany();
        return response200(res, result);
      } else {
        return response400(res, "Your request is not found");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getAssignedMasters(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { ReqType, Mobile, DataType, PageNumber = 1, RowsPerPage = 10  } = bodyData;

    if (!Mobile) return response400(res, "Missing 'Mobile' in req formate");
    if (!ReqType) response400(res, "Missing 'ReqType' in req formate");
    try {
      let spQueryForCounts = `execute assignedOfficersOrSurveyersForCounts @0,@1,@2`;
      let query = `execute assignedOfficersOrSurveyers @0,@1,@2,@3,@4`;
      let responseForCounts = await AppDataSource.query(spQueryForCounts, [ReqType, Mobile, DataType]);
      let response = await AppDataSource.query(query, [ReqType, Mobile, DataType, PageNumber, RowsPerPage]);
      let result = {
        TotalCount: responseForCounts[0]?.TotalCount,
        Page: PageNumber,
        RowsPerPage: RowsPerPage,
        TotalData: response
      };
      return response200(res, result);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async getChildBasedOnParent(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { RoleId } = bodyData;

    if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
    try {
      let result = await repository.childRolesRepo.createQueryBuilder('rl')
        .leftJoinAndSelect(repoNames.RolesTable, 'lr', "lr.id = rl.ChildId")
        .select(["lr.id as value", "lr.RoleName as name"])
        .where("rl.RoleId = :RoleId", { RoleId: RoleId })
        .getRawMany();
      return response200(res, result);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async assignChildAndGet(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { ReqType, RoleId } = bodyData;

    if (!ReqType) return response400(res, "Missing 'ReqType' in req formate");

    try {
      if (ReqType == "Get") {
        let chilResult = await repository.childRolesRepo.createQueryBuilder('la')
          .leftJoinAndSelect(repoNames.RolesTable, 'lr', 'lr.id=la.RoleId')
          .leftJoinAndSelect(repoNames.RolesTable, 'lr1', 'lr1.id=la.ChildId')
          .select(["la.id id", "lr.RoleName RoleName", 'lr.id RoleId', "lr1.RoleName ChildName", "la.ChildId ChildId"])
          .getRawMany();
        return response200(res, encryptData(chilResult, secretKey));
      } else if (ReqType == "Add") {
        if (!RoleId) return response400(res, "Missing 'RoleId' in req formate");
        let result = await repository.childRolesRepo.save(bodyData);
        return response200(res, encryptData(result, secretKey));
      } else {
        return response400(res, "Your request is not found");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async addOrGetRoles(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body };
    const { ReqType, RoleId } = bodyData;

    if (!ReqType) return response400(res, "Missing 'ReqType' in req formate");

    try {
      if (ReqType == "Add") {
        let saveResult = await repository.rolesRepo.save(bodyData);
        return response200(res, encryptData(saveResult, secretKey));
      } else if (ReqType == "Get") {
        let getResult = await repository.rolesRepo.createQueryBuilder('role')
          .select(["role.id as id", "role.RoleName as RoleName", "role.IsMobile as IsMobile"])
          .getRawMany();
        return response200(res, encryptData(getResult, secretKey));
      } else if (ReqType == "Dd") {
        let dropDownResult = await repository.rolesRepo.createQueryBuilder('sc')
          .select(["sc.id as value", "sc.RoleName as name"])
          .getRawMany();;
        return response200(res, encryptData(dropDownResult, secretKey));
      } else {
        return response400(res, "Sending wrong request to server.");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async addOrGetRoleAccess(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { ReqType, RoleId } = bodyData;

    if (!ReqType) return response400(res, "Missing 'ReqType' in req formate");

    try {
      if (ReqType == "Add") {
        let encrypt = await repository.rolesAccessRepo.save(bodyData);;
        return response200(res, encryptData(encrypt, secretKey));
      } else if (ReqType == "Get") {
        let getResult = await repository.rolesAccessRepo.createQueryBuilder('role')
          .leftJoinAndSelect(repoNames.RolesTable, 'rl', "rl.id = role.RoleId")
          .select(["role.id as id", "rl.RoleName as RoleName", "role.RoleId as RoleId",
            "role.District as District", "role.Taluk as Taluk", "role.Phco as Phco",
            "role.SubCenter as SubCenter", "role.Type Type"])
          .getRawMany();;
        return response200(res, encryptData(getResult, secretKey));
      } else {
        return response400(res, "Sending wrong request to server.");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async assignmentProcess(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = req.body;
    const { ReqType } = bodyData;

    if (!ReqType) return response400(res, "Missing 'ReqType' in req formate");

    try {
      if (ReqType == 1) {
        let result = await repository.assignedMastersRepo.save(bodyData);
        // await repository.assignMastersHistoryRepo/.save({ ...result, ...{ History: "New user Added" } });
        return response200(res, {});
      } else if (ReqType == 2) {
        let userResult = await repository.userDataRepo.save(bodyData);
        // await repository.assignMastersHistoryRepo.save({ ...userResult, ...{ History: "Surveyer Added" } });
        return response200(res, {});
      } else {
        return response400(res, "Sending wrong request to server.");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async fetchSearchReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { DataType, DistrictCode, TalukCode, PhcoCode, SubCenterCode, Status, FromDate, ToDate, PageNumber = 1,
      RowsPerPage = 10, UserId } = bodyData;
    if (!DataType) return response400(res, "Missing 'DataType' in req formate");

    const DistrictCodeInput = DistrictCode == '' ? null : DistrictCode;
    const TalukCodeInput = TalukCode == '' ? null : TalukCode;
    const PhcoCodeInput = PhcoCode == '' ? null : PhcoCode;
    const SubCenterCodeInput = SubCenterCode == '' ? null : SubCenterCode;
    const StatusInput = Status == '' ? null : Status;
    const FromDateInput = FromDate == '' ? null : FromDate;
    const ToDateInput = ToDate == '' ? null : ToDate;
    try {
      let spQueryForCounts = `execute WebFetchSearchCountsBasedOnInputs @0,@1,@2,@3,@4,@5,@6,@7,@8`;
      let spQuery = `execute WebFetchSearchDataBasedOnInputs @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11`;
      let responseForCounts = await AppDataSource.query(spQueryForCounts, [DataType, DistrictCodeInput, TalukCodeInput, PhcoCodeInput, SubCenterCodeInput, StatusInput, FromDateInput, ToDateInput, UserId]);
      let response = await AppDataSource.query(spQuery, [DataType, "report", DistrictCodeInput, TalukCodeInput, PhcoCodeInput, SubCenterCodeInput, StatusInput, FromDateInput, ToDateInput, UserId, PageNumber, RowsPerPage]);
      let result = {
        TotalCount: responseForCounts[0].TotalCount,
        Applied: responseForCounts[0]?.Applied,
        Pending: responseForCounts[0]?.Pending,
        Delivered: responseForCounts[0]?.Delivered,
        Ready: responseForCounts[0]?.Ready,
        Page: PageNumber,
        RowsPerPage: RowsPerPage,
        TotalData: response
      };
      return response200(res, result);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async searchAndDownloadReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { DataType, Type, DistrictCode, TalukCode, PhcoCode, SubCenterCode, Status, FromDate, ToDate, PageNumber = 1,
      RowsPerPage = 10, UserId } = bodyData;
    if (!DataType) return response400(res, "Missing 'DataType' in req formate");

    const DistrictCodeInput = DistrictCode == '' ? null : DistrictCode;
    const TalukCodeInput = TalukCode == '' ? null : TalukCode;
    const PhcoCodeInput = PhcoCode == '' ? null : PhcoCode;
    const SubCenterCodeInput = SubCenterCode == '' ? null : SubCenterCode;
    const StatusInput = Status == '' ? null : Status;
    const FromDateInput = FromDate == '' ? null : FromDate;
    const ToDateInput = ToDate == '' ? null : ToDate;
    try {
      let spQuery = `execute WebFetchSearchDataBasedOnInputs @0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11`;
      let response = await AppDataSource.query(spQuery, [DataType, "download", DistrictCodeInput, TalukCodeInput, PhcoCodeInput, SubCenterCodeInput, StatusInput, FromDateInput, ToDateInput, UserId, PageNumber, RowsPerPage]);
      // Convert data to XLSX
      const ws = XLSX.utils.json_to_sheet(response);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SNGData');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async fetchStateOrDistrictReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { DataType, DistrictCode, TalukCode, FromDate, ToDate, PageNumber = 1,
      RowsPerPage = 10, UserId } = bodyData;
    if (!DataType) return response400(res, "Missing 'DataType' in req formate");

    const DistrictCodeInput = DistrictCode == '' ? null : DistrictCode;
    const TalukCodeInput = TalukCode == '' ? null : TalukCode;
    const FromDateInput = FromDate == '' ? null : FromDate;
    const ToDateInput = ToDate == '' ? null : ToDate;
    try {
      let spQueryForCounts = `execute WebFetchStateAndDistrictCountsBasedOnInputs @0,@1,@2,@3,@4,@5`;
      let spQuery = `execute WebFetchStateAndDistrictDataBasedOnInputs @0,@1,@2,@3,@4,@5,@6,@7,@8`;
      let responseForCounts = await AppDataSource.query(spQueryForCounts, [DataType, DistrictCodeInput, TalukCodeInput, FromDateInput, ToDateInput, UserId]);
      let response = await AppDataSource.query(spQuery, [DataType, "report", DistrictCodeInput, TalukCodeInput, FromDateInput, ToDateInput, UserId, PageNumber, RowsPerPage]);
      let result = {
        TotalCount: responseForCounts[0]?.TotalCount,
        Applied: responseForCounts[0]?.Applied,
        Pending: responseForCounts[0]?.Pending,
        Delivered: responseForCounts[0]?.Delivered,
        Ready: responseForCounts[0]?.Ready,
        Page: PageNumber,
        RowsPerPage: RowsPerPage,
        TotalData: response
      };
      return response200(res, result);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async downloadStateOrDistrictReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { DataType, Type, DistrictCode, TalukCode, FromDate, ToDate, PageNumber = 1,
      RowsPerPage = 10, UserId } = bodyData;
    if (!DataType) return response400(res, "Missing 'DataType' in req formate");

    const DistrictCodeInput = DistrictCode == '' ? null : DistrictCode;
    const TypeInput = Type == '' ? null : Type;
    const TalukCodeInput = TalukCode == '' ? null : TalukCode;
    const FromDateInput = FromDate == '' ? null : FromDate;
    const ToDateInput = ToDate == '' ? null : ToDate;
    try {
      let spQuery = `execute WebFetchStateAndDistrictDataBasedOnInputs @0,@1,@2,@3,@4,@5,@6,@7,@8`;
      let response = await AppDataSource.query(spQuery, [DataType, "download", DistrictCodeInput, TalukCodeInput, FromDateInput, ToDateInput, UserId, PageNumber, RowsPerPage]);
      // Convert data to XLSX
      const ws = XLSX.utils.json_to_sheet(response);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SNGData');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async fetchRefraLoginReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { DataType, FromDate, ToDate, PageNumber = 1,
      RowsPerPage = 10, UserId } = bodyData;
    if (!DataType) return response400(res, "Missing 'DataType' in req formate");

    const FromDateInput = FromDate == '' ? null : FromDate;
    const ToDateInput = ToDate == '' ? null : ToDate;
    try {
      let spQueryForCounts = `execute WebRefraLoginReportCountsBasedOnInputs @0,@1,@2,@3`;
      let spQuery = `execute WebRefraLoginReportBasedOnInputs @0,@1,@2,@3,@4,@5,@6`;
      let responseForCounts = await AppDataSource.query(spQueryForCounts, [DataType, FromDateInput, ToDateInput, UserId]);
      let response = await AppDataSource.query(spQuery, [DataType, "report", FromDateInput, ToDateInput, UserId, PageNumber, RowsPerPage]);
      let result = {
        TotalCount: responseForCounts[0]?.TotalCount,
        Applied: responseForCounts[0]?.Applied,
        Pending: responseForCounts[0]?.Pending,
        Delivered: responseForCounts[0]?.Delivered,
        Ready: responseForCounts[0]?.Ready,
        Page: PageNumber,
        RowsPerPage: RowsPerPage,
        TotalData: response
      };
      return response200(res, result);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async fetchDetailedReportsOfId(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { ReportType, id } = bodyData;
    if (!ReportType) return response400(res, "Missing 'ReportType' in req formate");
    if (!id) return response400(res, "Missing 'id' in req formate");

    try {
      let spQuery = `execute WebFetchDetailedReport @0,@1`;
      let result = await AppDataSource.query(spQuery, [ReportType, id]);
      return response200(res, result);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async fetchImagesOfId(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user?.UserId } };
    const { ReportType, id } = bodyData;
    if (!ReportType) return response400(res, "Missing 'ReportType' in req formate");
    if (!id) return response400(res, "Missing 'id' in req formate");

    try {
      if(ReportType == "other"){
        let result = await repository.otherBenfDataRepo.findOne({where: {id: Equal(id)}, select: ['image', 'initial_image']});
        return response200(res, result);
      }else if(ReportType == "school") {
        let result = await repository.studentDataRepo.findOne({where: {id: Equal(id)}, select: ['image']});
        return response200(res, result);
      } else {
        return response400(res, "ReportType is invalid");
      }
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async downloadRefraLoginReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { DataType, FromDate, ToDate, PageNumber = 1,
      RowsPerPage = 10, UserId } = bodyData;
    if (!DataType) return response400(res, "Missing 'DataType' in req formate");

    const FromDateInput = FromDate == '' ? null : FromDate;
    const ToDateInput = ToDate == '' ? null : ToDate;
    try {
      let spQuery = `execute WebRefraLoginReportBasedOnInputs @0,@1,@2,@3,@4,@5,@6`;
      let response = await AppDataSource.query(spQuery, [DataType, "download", FromDateInput, ToDateInput, UserId, PageNumber, RowsPerPage]);
      // Convert data to XLSX
      const ws = XLSX.utils.json_to_sheet(response);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SNGData');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buf);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async fetchCountsByLogin(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { UserId, ReqType } = bodyData;
    if (!ReqType) return response400(res, "Missing 'ReqType' in req formate");
    try {
      let spQuery = `execute WebFetchCountsByLogin @0,@1`;
      let response = await AppDataSource.query(spQuery, [ReqType, UserId]);
      return response200(res, response);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };

  async fetchPrimaryScreeningReports(req: Request | any, res: Response | any): Promise<any> {
    const bodyData = { ...req.body, ...{ UserId: req.user.UserId } };
    const { UserId, ReqType } = bodyData;
    if (!ReqType) return response400(res, "Missing 'ReqType' in req formate");
    try {
      let spQuery = `execute WebFetchPSByLoginWise @0,@1`;
      let response = await AppDataSource.query(spQuery, [ReqType, UserId]);
      return response200(res, response);
    } catch (error) {
      return apiErrorHandler(error, req, res);
    };
  };
};