import { Service } from "typedi";
import Logger from "../utility/winstonLogger";
import { AppDataSource } from "../dbConfig/mysql";
import { district_data, master_data, other_benf_data, phco_data, sub_centre_data, taluka_data } from "../entity";
import { state_data } from "../entity/state_data";
import { PrameterizedQueries } from "../utility/resusableFun";
import { Equal } from "typeorm";

@Service()
export class AdminRepo {
    async updateLogin(data) {
        try {
            if (data.type == "state_admin") {
                let district = AppDataSource.getRepository(state_data);
                let result = await district.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await district.save(finalData);
            } else if (data.type == "district_officer") {
                let district = AppDataSource.getRepository(district_data);
                let result = await district.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await district.save(finalData);
            } else if (data.type == "taluka") {
                let taluka = AppDataSource.getRepository(taluka_data);
                let result = await taluka.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await taluka.save(finalData);
            } else if (data.type == "phco") {
                let sub_centre = AppDataSource.getRepository(phco_data);
                let result = await sub_centre.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await sub_centre.save(finalData);
            } else if (data.type == "subcenter") {
                let sub_centre = AppDataSource.getRepository(sub_centre_data);
                let result = await sub_centre.findOneBy({ mobile_number: data.mobile_number });
                let finalData = { ...result, ...{ otp: data.otp } };
                return await sub_centre.save(finalData);
            }
            return AppDataSource.getRepository(district_data)
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };

    async checkTypeWiseLoginData(data) {
        try {
            if (data.type == "state_admin") {
                let result = await AppDataSource.getRepository(state_data).findOneBy({ mobile_number: data.mobile_number });
                if (!result) return 422;
                return result;
            } else if (data.type == "district_officer") {
                let result = await AppDataSource.getRepository(district_data).findOneBy({ mobile_number: data.mobile_number });
                if (!result) return 422;
                let distinct = await AppDataSource.getRepository(district_data).query(`select distinct code, unique_name from district_data where mobile_number='${data.mobile_number}'`);
                return { ...result, ...{ codes: distinct } };
            } else if (data.type == "taluka") {
                let result = await AppDataSource.getRepository(taluka_data).findOneBy({ mobile_number: data.mobile_number });
                if (!result) return 422;
                let distinct = await AppDataSource.query(`select distinct code, unique_name from taluka_data where mobile_number='${data.mobile_number}'`);
                return { ...result, ...{ codes: distinct } };
            } else if (data.type == "phco") {
                let result = await AppDataSource.getRepository(phco_data).findOneBy({ mobile_number: data.mobile_number });
                if (!result) return 422;
                let distinct = await AppDataSource.query(`select distinct code, is_initial_login, unique_name from phco_data where mobile_number='${data.mobile_number}'`);
                return { ...result, ...{ codes: distinct } };
            }
            return AppDataSource.getRepository(district_data)
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };

    async login(data: district_data) {
        try {
            data.unique_id = "1";
            return AppDataSource.getRepository(district_data).save(data);
        } catch (e) {
            Logger.error("adminRepo => addDistrictsData", e)
            return e;
        }
    };
    async getAllMasters(data) {
        const { codes, type } = data;
        try {
            if (type == "district_officer") {
                // if (!Array.isArray(districts)) return { code: 422, message: "Give valid inputs." };
                // let matchArray = (districts).find(obj => /^[A-Za-z0-9()\s]*$/.test(obj) === true);
                // if (matchArray === undefined) return { code: 422, message: "Give valid inputs." }
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec districtLogin_refractionistData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else if (type == "taluka") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec talukaLogin_refrotionistData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else if (type == 'phco') {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec phcoLogin_refractionistData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else {
                let query = `exec GetAllMasters`;
                let result = await AppDataSource.getRepository(master_data).query(query);
                return result;
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllOrders(data) {
            const { codes, type } = data;
            try {
                if (type == "district_officer") {
                    if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                    let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                    if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }
    
                    let query = 'exec districtLogin_all_count @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                    let getParamsData = PrameterizedQueries(codes);
                    let result = await AppDataSource.query(query, getParamsData);
                    return result;
                } else if (type == "taluka") {
                    if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                    let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                    if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }
    
                    let query = 'exec talukaLogin_allCount @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                    let getParamsData = PrameterizedQueries(codes);
                    let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                    return result;
                } else if (type == 'phco') {
                    if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                    let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                    if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }
    
                    let query = 'exec phcoLogin_allCount @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                    let getParamsData = PrameterizedQueries(codes);
                    let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                    return result;
                } else {
                    let query = `exec get_all_count`;
                    let result = await AppDataSource.getRepository(master_data).query(query);
                    return result;
                }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllDelivered(data) {
        const { codes, type } = data;
        try {
            if (type == "district_officer") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec districtLogin_delivered @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.query(query, getParamsData);
                return result;
            } else if (type == "taluka") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec talukaLogin_delivered @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else if (type == 'phco') {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec phcoLogin_delivered @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else {
                let query = `exec get_all_delivered`;
                let result = await AppDataSource.getRepository(master_data).query(query);
                return result;
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async getAllPending(data) {
        const { codes, type } = data;
        try {
            if (type == "district_officer") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec districtLogin_pending @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.query(query, getParamsData);
                return result;
            } else if (type == "taluka") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec talukaLogin_pending @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else if (type == 'phco') {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec phcoLogin_pending @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else {
                let query = `exec get_all_pending`;
                let result = await AppDataSource.getRepository(master_data).query(query);
                return result;
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    /* with sub centre wise update */
    async getUpdatedData(data) {
        try {
            let masterData = await AppDataSource.getRepository(master_data);
            let result = await masterData.find({ where: { sub_centre_code: data.code }});
            (result || []).map(async obj => {
                var temp: master_data = Object.assign({}, obj);
                temp.refractionist_name = data?.refractionist_name;
                temp.refractionist_mobile = data?.refractionist_mobile;
                temp.ngo_gov = data?.ngo_gov;
                await masterData.save(temp);
            })
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    // with village wise update
    // async getUpdatedData(data) {
    //     try {
    //         let masterData = await AppDataSource.getRepository(master_data);
    //         let result = await masterData.findOneBy({ user_unique_id: data.user_unique_id });
    //         let finalData = { ...result, ...data };
    //         await masterData.save(finalData);
    //         return {};
    //     } catch (e) {
    //         Logger.error("userRepo => postUser", e)
    //         return e;
    //     }
    // };
    async addNewDataWithExistsRow(data) {
        try {
            let masterData = await AppDataSource.getRepository(master_data);
            let result = await masterData.find({ where: { sub_centre_code: data.code }});
            
            (result || []).map(async obj => {
                var temp: master_data = Object.assign({}, obj);
                temp.user_unique_id = `${temp.user_unique_id}_1`
                temp.refractionist_name = data?.refractionist_name;
                temp.refractionist_mobile = data?.refractionist_mobile;
                delete temp.id;
                await masterData.save(temp);
            })
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async updateDistrictsData(data) {
        try {
            let masterData = await AppDataSource.getRepository(district_data);
            let result = await AppDataSource.getRepository(master_data).query(`select distinct district_code, district from master_data where district_code='${data.code}'`);
            result?.map(async (obj) => {
                var temp: any = Object.assign({}, obj);
                temp.code = temp.district_code
                temp.mobile_number = data.mobile_number,
                    temp.name = data.name;
                temp.unique_name = data.district;
                delete temp.user_unique_id;
                let findData = await masterData.findOneBy({ code: obj.district_code });
                if (!findData) {
                    await AppDataSource.getRepository(district_data).save(temp);
                }
                let finalData = { ...findData, ...temp };
                await masterData.save(finalData);
                return temp;
            });
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    async updateTalukaData(data) {
        try {
            let masterData = await AppDataSource.getRepository(taluka_data);
            let result = await AppDataSource.getRepository(master_data).query(`select distinct taluka_code, taluka from master_data where taluka_code='${data?.code}'`);
            result?.map(async (obj) => {
                var temp: any = Object.assign({}, obj);
                temp.code = temp.taluka_code
                temp.mobile_number = data?.mobile_number,
                    temp.name = data?.name;
                temp.unique_name = data?.taluka;
                delete temp.user_unique_id;
                let findData = await masterData.findOneBy({ code: obj.taluka_code });
                if (!findData) {
                    await AppDataSource.getRepository(taluka_data).save(temp);
                }
                let finalData = { ...findData, ...temp };
                await masterData.save(finalData);
                return temp;
            });
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getReportsData(data) {
        const { codes, type, skip, limit } = data;
        try {
            if (type == "district_officer") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec districtLogin_reportsData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.query(query, getParamsData);
                return result;
            } else if (type == "taluka") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec talukaLogin_reportsData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else if (type == 'phco') {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec phcoLogin_reportsData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else {
                let query = `exec stateLogin_OtherReports @0,@1`;
                const length = await AppDataSource.getRepository(other_benf_data).count({where : {applicationStatus: 'Completed'}});
                let result = await AppDataSource.getRepository(other_benf_data).query(query, [skip, limit]);
                return {total : length, result};
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };
    /* ----------------------------------------------------------------------------------------------------------- */
    async getPhcosData(data) {
        const { codes, type } = data;
        try {
            if (type == "district_officer") {
                // if (!Array.isArray(districts)) return { code: 422, message: "Give valid inputs." };
                // let matchArray = (districts).find(obj => /^[A-Za-z0-9()\s]*$/.test(obj) === true);
                // if (matchArray === undefined) return { code: 422, message: "Give valid inputs." }
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec districtLogin_phcoData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(phco_data).query(query, getParamsData);
                return result;
            } else if (type == "taluka") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec talukaLogin_phcoData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(phco_data).query(query, getParamsData);
                return result;
            } else {
                let query = 'exec phcos_all_data';
                let result = await AppDataSource.getRepository(phco_data).query(query);
                return result;
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async updatePhcoData(data) {
        try {
            let masterData = await AppDataSource.getRepository(phco_data);
            let result = await AppDataSource.getRepository(master_data).query(`select distinct health_facility_code, health_facility  from master_data where health_facility_code='${data?.code}'`);
            result?.map(async (obj) => {
                var temp: any = Object.assign({}, obj);
                temp.code = temp.health_facility_code
                temp.mobile_number = data?.mobile_number,
                    temp.unique_name = data?.health_facility,
                    temp.name = data?.name;
                delete temp.user_unique_id;
                let findData = await masterData.findOneBy({ code: obj.health_facility_code });
                if (!findData) {
                    await AppDataSource.getRepository(phco_data).save(temp);
                }
                let finalData = { ...findData, ...temp };
                await masterData.save(finalData);
                return temp;
            });
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async updatePhcoScreeningData(data) {
        const { code, row } = data;
        try {
            let masterData = await AppDataSource.getRepository(master_data);
            let uniqueData = await masterData.find({where: {sub_centre_code: code}});
            uniqueData?.map(async (obj) => {
                let findData = await masterData.findOneBy({ user_unique_id: obj.user_unique_id });
                let finalData = {
                    ...findData,
                    ...{
                        total_primary_screening_completed: row?.total_primary_screening_completed,
                        total_secondary_screening_required: row?.total_secondary_screening_required
                    }
                };
                await masterData.save(finalData);
                return {};
            });
            // screenings?.map(async (obj) => {
            //     let findData = await masterData.findOneBy({ user_unique_id: obj?.user_unique_id });
            //     let finalData = {
            //         ...findData,
            //         ...{
            //             total_primary_screening_completed: obj?.total_primary_screening_completed,
            //             total_secondary_screening_required: obj?.total_secondary_screening_required
            //         }
            //     };
            //     codes.map(async obj => {
            //         let checkData = await phcoData.findOneBy({ code: Equal(obj?.code) });
            //         let updatedData = { ...checkData, ...{ is_initial_login: "N" } }
            //         await phcoData.save(updatedData);
            //     })
            //     await masterData.save(finalData);
            //     return {};
            // });
            return {};
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    // async getPhcoWiseData(data) {
    //     const { codes } = data;
    //     let res = await AppDataSource.getRepository(master_data).find({
    //         where:
    //             [
    //                 { health_facility_code: Equal(codes[0]?.code) },
    //                 { health_facility_code: Equal(codes[1]?.code) },
    //                 { health_facility_code: Equal(codes[2]?.code) },
    //                 { health_facility_code: Equal(codes[3]?.code) },
    //                 { health_facility_code: Equal(codes[4]?.code) },
    //                 { health_facility_code: Equal(codes[5]?.code) },
    //                 { health_facility_code: Equal(codes[6]?.code) },
    //                 { health_facility_code: Equal(codes[7]?.code) },
    //                 { health_facility_code: Equal(codes[8]?.code) },
    //                 { health_facility_code: Equal(codes[9]?.code) },
    //             ]
    //     });
    //     return res
    // };

    async getPhcoWiseData(data) {
        const { codes, type } = data;
        try {
            if (type == "district_officer") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec districtLogin_primaryScreening @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.query(query, getParamsData);
                return result;
            } else if (type == "taluka") {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec talukaLogin_primaryScreening @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else if (type == 'phco') {
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec phcoLogin_primaryScreenings @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(master_data).query(query, getParamsData);
                return result;
            } else {
                let query = `exec GetAllMasters`;
                let result = await AppDataSource.getRepository(master_data).query(query);
                return result;
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getTalukasData(data) {
        const { codes, type } = data;
        try {
            if (type == "district_officer") {
                // if (!Array.isArray(districts)) return { code: 422, message: "Give valid inputs." };
                // let matchArray = (districts).find(obj => /^[A-Za-z0-9()\s]*$/.test(obj) === true);
                // if (matchArray === undefined) return { code: 422, message: "Give valid inputs." }
                if (!Array.isArray(codes)) return { code: 422, message: "Give valid inputs." };
                let matchArray = (codes).find(obj => /^[0-9]*$/.test(obj?.code) === false);
                if (matchArray !== undefined) return { code: 422, message: "Give valid inputs." }

                let query = 'exec districtLogin_talukaData @0,@1,@2,@3,@4,@5,@6,@7,@8,@9';
                let getParamsData = PrameterizedQueries(codes);
                let result = await AppDataSource.getRepository(taluka_data).query(query, getParamsData);
                return result;
            } else {
                let query = 'exec get_taluka_all';
                let result = await AppDataSource.getRepository(taluka_data).query(query);
                return result;
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getDistrictsData() {
        try {
            let query = 'exec get_all_districts';
            let result = await AppDataSource.getRepository(master_data).query(query);
            return result;
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };

    async getLoginUserData(data) {
        try {
            if (data.type == "district_officer") {
                let finOne = await AppDataSource.getRepository(district_data).findOneBy({ unique_id: data.unique_id });
                let query = `exec get_user_districtWise @0`;
                let result = await AppDataSource.getRepository(district_data).query(query, [finOne?.mobile_number]);
                return result;
            } else if (data.type == "taluka") {
                let finOne = await AppDataSource.getRepository(taluka_data).findOneBy({ unique_id: data.unique_id });
                let query = `exec get_user_talukaWise @0`;
                let result = await AppDataSource.getRepository(taluka_data).query(query, [finOne?.mobile_number]);
                return result;
            } else {
                let finOne = await AppDataSource.getRepository(phco_data).findOneBy({ unique_id: data.unique_id });
                let query = `exec phco_login_data @0`;
                let result = await AppDataSource.getRepository(phco_data).query(query, [finOne?.mobile_number]);
                return result;
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    };


    async uniqueDistricts(data) {
        const {district, taluka, phc} = data;
        try {
            if(district){
                return await AppDataSource.getRepository(master_data).
                query(`select distinct taluka from master_data where district='${district}'`);
            } else if(taluka){
                return await AppDataSource.getRepository(master_data).
                query(`select distinct health_facility from master_data where taluka='${taluka}'`);
                
            } else if(phc){
                return await AppDataSource.getRepository(master_data).
                query(`select distinct sub_centre from master_data where health_facility='${phc}'`);
                
            } else {
                return await AppDataSource.getRepository(master_data).
                  createQueryBuilder('entity').select('DISTINCT ("district")')
                  .getRawMany();
            }
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    }

    async searchData(data) {
        const {district, taluka, phco, sub_centre, date, status, type} = data;
        if(!district && !taluka && !phco && !sub_centre && !date && !status) return {code: 422, message: "Give Mandatory Fields."}
        try {
            let query = `exec stateLogin_OtherReportsFilterWise @0,@1,@2,@3,@4,@5,@6,@7`;
            return await AppDataSource.getRepository(phco_data).query(query, [district, taluka, phco, sub_centre, date[0], date[1], status, type]);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    }

    async eachDataIdWise(data) {
        const {type, id} = data;
        if(!type && !id) return {code: 422, message: "Give Mandatory Fields."}
        try {
            let query = `exec reportsFilterIdWise @0,@1`;
            return await AppDataSource.getRepository(phco_data).query(query, [type, id]);
        } catch (e) {
            Logger.error("userRepo => postUser", e)
            return e;
        }
    }
};
