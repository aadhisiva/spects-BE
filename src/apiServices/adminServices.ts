import { Service } from "typedi";
import { AdminRepo } from "../apiRepository/adminRepo";

@Service()
export class AdminServices {
    constructor(public AdminRepo: AdminRepo) { }

    async getAllMasters(data) {
        return this.AdminRepo.getAllMasters(data)
    };

    async createApplication(data) {
        // return await this.EkycRepo.createApplication(data);
    }
};
