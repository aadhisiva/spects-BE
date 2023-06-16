import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { EkycRepo } from "../apiRepository/ekycRepo";
import { AppDataSource } from "../dbConfig/mysql";
import { ekyc_data } from "../entity/ekyc_data";

@Service()
export class EkycServices {
    constructor(public EkycRepo: EkycRepo, public SMSServices: SMSServices, public ResusableFunctions: ResusableFunctions) { }

    async createCallbackUrl(data) {
        let req = {
            deptCode: "1",
            applnCode: "30",
            schemeCode: "229",
            beneficiaryID: "123123123",
            beneficiaryName: "Hanumantha Raju S",
            integrationKey: "b8be83b7-b4ee-4c7d-b142-e8fb0e05a242",
            integrationPassword: "8$xaSXRJ_6p7967X",
            txnNo: "1443934455627999",
            txnDateTime: "2021111612110011",
            serviceCode: "3",
            responseRedirectURL: "http://localhost:8889/edcs/edcs_service"
        }
        return await this.EkycRepo.createCallbackUrl(data);
    };

    async saveEkycData(data) {
        if (Object.keys(data).length == 0 || data?.finalStatus != "S") {
            return {code: 200, message: "E-KYC Failed."};
        } else {
            let newData = new ekyc_data({});
            let eKYCData = data['eKYCData'];
            let localData = data['localKYCData'];
            newData.txnNo = data.txnNo;
            newData.txnDateTime = data.txnDateTime;
            newData.aadhaarHash = data.aadhaarHash;
            newData.finalStatus =data.finalStatus;
            newData.vaultRefNumber =data.vaultRefNumber;
            newData.ekycTxnNo =data.ekycTxnNo;
            newData.ekycTimestamp =data.ekycTimestamp;
            newData.residentConsent =data.residentConsent;
            newData.status =data.status;
            newData.responseStatus =data.responseStatus;
            newData.errorMessage =data.errorMessage;
            newData.error =data.error;
            newData.uidToken =data.uidToken;
            newData.actionCode =data.actionCode; 
            newData.otp =data.otp;
            newData.otpTxnNo =data.otpTxnNo;
            newData.otpTimeStamp =data.otpTimeStamp;
            newData.ekyc_dob = eKYCData.dob;
            newData.ekyc_gender = eKYCData.gender;
            newData.ekyc_name = eKYCData.name;
            newData.ekyc_co = eKYCData.co;
            newData.ekyc_country = eKYCData.country;
            newData.ekyc_country = eKYCData.dist;
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
            console.log("data", newData)
            return await this.EkycRepo.saveEkycData(newData);
        }
    };
    
    async createApplication(data) {
        return await this.EkycRepo.createApplication(data);
    }
};
