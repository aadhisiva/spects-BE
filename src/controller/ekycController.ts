import { Service } from "typedi";
import crypto from "crypto";

import { response200} from "../utils/resBack";
import { apiErrorHandler } from "../utils/reqResHandler";
import { repository } from "../db/repos";
import {  RESPONSEAPI_MESSAGE } from "../utils/constants";
import { EkycData } from "../entities/ekycData";
import path from "path";
import { DemoAuthResponse } from "../entities/demoAuthResponse";

export const secretKey = crypto.randomBytes(32).toString('hex'); // Replace with a pre-shared secret key


@Service()
export class EkycController {
  constructor() { };

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

const mappingEkycData = (data: any) => {
  let newData = new EkycData();
  let eKYCData = data?.eKYCData;
  let localData = data?.localKYCData;
  newData.txnNo = data?.txnNo;
  newData.txnDateTime = data?.txnDateTime;
  newData.aadhaarHash = data?.aadhaarHash;
  newData.finalStatus = data?.finalStatus;
  newData.vaultRefNumber = data?.vaultRefNumber;
  newData.ekycTxnNo = data?.ekycTxnNo;
  newData.ekycTimestamp = data?.ekycTimestamp;
  newData.residentConsent = data?.residentConsent;
  newData.status = data?.status;
  newData.responseStatus = data?.responseStatus;
  newData.errorMessage = data?.errorMessage;
  newData.error = data?.error;
  newData.uidToken = data?.uidToken;
  newData.actionCode = data?.actionCode;
  newData.otp = data?.otp;
  newData.otpTxnNo = data?.otpTxnNo;
  newData.otpTimeStamp = data?.otpTimeStamp;
  newData.ekyc_dob = eKYCData?.dob;
  newData.ekyc_gender = eKYCData?.gender;
  newData.ekyc_name = eKYCData?.name;
  newData.ekyc_co = eKYCData?.co;
  newData.ekyc_country = eKYCData?.country;
  newData.ekyc_dist = eKYCData?.dist;
  newData.ekyc_house = eKYCData?.house;
  newData.ekyc_street = eKYCData?.street;
  newData.ekyc_lm = eKYCData?.lm;
  newData.ekyc_loc = eKYCData?.loc;
  newData.ekyc_pc = eKYCData?.pc;
  newData.ekyc_po = eKYCData?.po;
  newData.ekyc_state = eKYCData?.state;
  newData.ekyc_subdist = eKYCData?.subdist;
  newData.ekyc_vtc = eKYCData?.vtc;
  newData.ekyc_lang = eKYCData?.lang;
  newData.local_dob = localData?.dob;
  newData.local_gender = localData?.gender;
  newData.local_name = localData?.name;
  newData.local_co = localData?.co;
  newData.local_country = localData?.country;
  newData.local_dist = localData?.dist;
  newData.local_house = localData?.house;
  newData.local_street = localData?.street;
  newData.local_lm = localData?.lm;
  newData.local_loc = localData?.loc;
  newData.local_pc = localData?.pc;
  newData.local_po = localData?.po;
  newData.local_state = localData?.state;
  newData.local_subdist = localData?.subdist;
  newData.local_vtc = localData?.vtc;
  newData.local_lang = localData?.lang;
  newData.photo = data?.photo;
  newData.maskedAadhaar = data?.maskedAadhaar;
  newData.npciStatus = data?.npciStatus;
  newData.npciError = data?.npciError;
  newData.npciBankName = data?.npciBankName;
  newData.npciLastUpdateDate = data?.npciLastUpdateDate;
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
