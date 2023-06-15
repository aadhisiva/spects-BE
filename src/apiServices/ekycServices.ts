import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { EkycRepo } from "../apiRepository/ekycRepo";
import { AppDataSource } from "../dbConfig/mysql";

@Service()
export class EkycServices {
    constructor(public EkycRepo: EkycRepo, public SMSServices: SMSServices, public ResusableFunctions: ResusableFunctions) { }

    async createCallbackUrl(data){
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

    async createApplication(data){
        return await this.EkycRepo.createApplication(data);
    }
};
