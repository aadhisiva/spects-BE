import { Service } from "typedi";
import { SMSServices } from "../utility/sms_otp";
import { ResusableFunctions } from "../utility/smsServceResusable";
import { OtherBenfRepo } from "../apiRepository/otherBenRepo";
import { KutumbaDetails, convertAadharToSha256Hex } from "../utility/kutumbaDetails";
import { other_benf_data } from "../entity/other_benf_data";
import { createUniqueIdBasedOnCodes, getAgeFromBirthDate } from "../utility/resusableFun";
import { generateOTP } from "../utility/resusableFun";
import { RESPONSEMSG } from "../utility/statusCodes";
import { rc_data } from "../entity/rc_data";
import Logger from "../utility/winstonLogger";
import { ekyc_data } from "../entity";
import { ACCESS_DENIED, COMPLETED, EKYC_ACCESS_DENIED, EKYC_SUCCESS, KUTUMBA_ACCESS_DENIED } from "../utility/constants";
import { threadId } from "worker_threads";

const spectclesAPiReusetData = async (data, getData, type) => {
    let reqBody = new other_benf_data({});
    reqBody.age = getData?.MBR_DOB ? getAgeFromBirthDate(getData.MBR_DOB) : 0;
    reqBody.caste = getData?.MBR_CASTE ? getData.MBR_CASTE : "";
    reqBody.rc_no = type == "rc" ? data?.rc_no : "";
    reqBody.category = getData?.MBR_CASTE_CATEGORY ? getData.MBR_CASTE_CATEGORY : "";
    reqBody.father_name = getData?.MBR_NPR_FATHER_NAME ? getData.MBR_NPR_FATHER_NAME : "";
    reqBody.education_id = getData?.MBR_EDUCATION_ID ? getData.MBR_EDUCATION_ID : "";
    reqBody.address = getData?.MBR_ADDRESS ? getData.MBR_ADDRESS : "";
    reqBody.dob = getData?.MBR_DOB ? getData.MBR_DOB : "";
    reqBody.aadhar_no = type == "rc" ? getData?.MBR_HASH_AADHAR : await aadharConvert(data.aadhar_no);
    reqBody.gender = getData?.MBR_GENDER ? getData.MBR_GENDER : "";
    reqBody.phone_number = getData?.MBR_MOBILE_NO ? getData.MBR_MOBILE_NO : "";
    reqBody.benf_name = getData?.MEMBER_NAME_ENG ? getData.MEMBER_NAME_ENG : "";
    return reqBody;
};



const mappingNewBenfData = (mapData: ekyc_data, getData) => {
    let reqBody = new other_benf_data({});
    reqBody.age = mapData.ekyc_dob ? getAgeFromBirthDate(mapData.ekyc_dob) : 0;
    reqBody.caste = getData?.MBR_CASTE || "";
    reqBody.category = getData.MBR_CASTE_CATEGORY || "";
    reqBody.father_name = mapData?.ekyc_co || "";
    reqBody.education_id = getData.MBR_EDUCATION_ID || "";
    reqBody.address = 
        mapData?.ekyc_dist? mapData?.ekyc_dist+'(dist)': "" + " " + 
        mapData?.ekyc_vtc? mapData?.ekyc_vtc+'(vtc)': "" + " " + 
        mapData?.ekyc_street? mapData?.ekyc_street+'(street)' : ""+ " " + 
        mapData?.ekyc_house? mapData?.ekyc_house+'(house)' : ""+ " " +
        mapData?.ekyc_pc? mapData?.ekyc_pc+"(pc)" : "";
    reqBody.dob = mapData?.ekyc_dob || "";
    reqBody.district = mapData?.ekyc_dist || ""
    reqBody.aadhar_no =  mapData?.aadhaarHash;
    reqBody.gender = mapData?.ekyc_gender || "";
    reqBody.phone_number = getData?.MBR_MOBILE_NO || "";
    reqBody.benf_name = mapData?.ekyc_name || "";
    reqBody.benf_unique_id = new Date().getTime().toString();
    return reqBody;
}

const aadharConvert = async (no) => {
    return await convertAadharToSha256Hex(no);
}

@Service()
export class OtherBenfServices {
    constructor(
        public OtherBenfRepo: OtherBenfRepo,
        public SMSServices: SMSServices,
        public ResusableFunctions: ResusableFunctions,
        public KutumbaFunction: KutumbaDetails
    ) { }

    async directEkycForAadhar(data){
        try{
        const {name, user_id} = data;
        if(!name && !user_id) return {code: 422, message: "Name And UserID Field Required"};
        let txnDateTime = new Date().getFullYear() + "" + new Date().getTime();
        let uniqueId = new Date().getTime();
        let bodyData = {
            name,
            uniqueId,
            txnDateTime
        }
        let urlResult = await this.KutumbaFunction.getDataFromEkycOutSource(bodyData);
        if(urlResult == 422)  return { code: 422, message: EKYC_ACCESS_DENIED};
        return {uniqueId : txnDateTime, Token: urlResult};
    } catch(e) {
        return Logger.error("Other service ##directEkycForAadhar", e);
    } 
    };

    async addDataAfterEkyc(data){
        try{
        const {uniqueId, user_id} = data;
        if(!uniqueId && !user_id) return {code: 422, message: "UniqueId And UserID Field Required"};
        let pullEkycData: any = await this.OtherBenfRepo.FetchDataFromEkyc(uniqueId);
        if(!pullEkycData) return {code: 422, message: EKYC_ACCESS_DENIED};
        let pullBenfData: any = await this.OtherBenfRepo.FetchDataFromOtherBenf(pullEkycData?.aadhaarHash);
        if(pullBenfData){
            if(pullBenfData.applicationStatus == COMPLETED && pullBenfData.ekyc_check == "Y")
            return {code: 422, message: `Already Registered With Order Number ${pullBenfData.order_number}.`};
            let fetchData = await this.OtherBenfRepo.fetchRcUserData(pullBenfData); 
            return {message: EKYC_SUCCESS, data: fetchData};
        } else {
            let getData = await this.KutumbaFunction.KutumbaDetailsFrom({aadhar_no: pullEkycData.aadhaarHash});
            if (getData == 422) return { code: 422, message: KUTUMBA_ACCESS_DENIED };
    
            let mapDataOtherBenfWise = mappingNewBenfData(pullEkycData, getData);
            let education_id = mapDataOtherBenfWise.education_id;
            if(education_id){
                let checkEducationId: any = await this.OtherBenfRepo.checkEducationId(education_id);
                if(checkEducationId) return {code: 422, message: `Your Already Applied In School With Order Number ${checkEducationId.order_number}.`};
                mapDataOtherBenfWise.user_id = user_id;
                await this.OtherBenfRepo.savingNewData(mapDataOtherBenfWise);
                let fetchData = await this.OtherBenfRepo.fetchRcUserData(pullBenfData); 
                return {message: EKYC_SUCCESS, data: fetchData};
            }
        }
    } catch(e) {
        return Logger.error("Other service ##addDataAfterEkyc", e);
    }
    };
    async updateAadharData(data: other_benf_data){
        try{

            const {benf_unique_id, user_id} = data;
            if(!benf_unique_id && !user_id) return {code: 422, message: "ID And User ID Fields Required"};
            data.order_number = await createUniqueIdBasedOnCodes(data.user_id);
            data.type = "otherBenificiary";
            data.details = "aadhar";
            data.status = 'order_pending';
            data.applicationStatus = "Completed";
            await this.OtherBenfRepo.updateAadharData(data);
            return {message: RESPONSEMSG.UPDATE_SUCCESS};
        } catch(e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };

    /* rc data */
    async addRcDataAndGet(data){
        try {
            if (!data?.rc_no) return { code: 422, message: "RC Field Required." };
            let getData = await this.KutumbaFunction.KutumbaDetailsFrom(data);  
            if (getData == 422) return { code: 422, message: KUTUMBA_ACCESS_DENIED }
            let checkRcById = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
            if (checkRcById?.length == 0) {
                for (let i = 1; i <= getData.length; i++) {
                    let reqBody = await spectclesAPiReusetData(data, getData[i - 1], "rc");
                    await this.OtherBenfRepo.createRcDataOfEach(reqBody);
                }
                let rcData: any = await this.OtherBenfRepo.FaechRcData(data.rc_no);
                if(rcData.length == 0) return {code: 422, message: ACCESS_DENIED};
                (rcData || []).map(obj => (obj.phone_number.length == 10) ? obj.phone_number = "Yes" : obj.phone_number = "No");
                return rcData;
            } else {
                (getData || [])?.map(async obj => {
                    let reqBody = await spectclesAPiReusetData(data, obj, "rc");
                    await this.OtherBenfRepo.updateRcDataBYEach(reqBody);
                });
                let rcData: any = await this.OtherBenfRepo.FaechRcData(data.rc_no);
                if(rcData.length == 0) return {code: 422, message: ACCESS_DENIED};
                (rcData || []).map(obj => (obj.phone_number.length == 10) ? obj.phone_number = "Yes" : obj.phone_number = "No");
                return rcData;
            };
        } catch(e){
            return Logger.error("Other service ##addRcDataAndGet", e); 
        }
    };

    async rcBasedOnNumberWise(data){
        try{
            const {id, phone_number, user_id} = data;
            if(!id && !phone_number && !user_id) return {code: 422, message: "Id And Number Field Required."};
            let findOneMemberRC = await this.OtherBenfRepo.findOneMemberInRC(id);
            if(!findOneMemberRC) return {code: 422, message: ACCESS_DENIED};
            let findOneMemberOther = await this.OtherBenfRepo.findOneMemberInOther(findOneMemberRC.aadhar_no);
            if(findOneMemberOther){
                if(findOneMemberOther.applicationStatus == COMPLETED) return {code: 422, message: "Already Registered."}; 
               let checkDuplicateWithSats = await this.OtherBenfRepo.checkDuplicatesWithSats(findOneMemberOther);
                if(checkDuplicateWithSats) return { code:422,  message: `You Are Already Applied In School With Order Number ${checkDuplicateWithSats.order_number}`};
                if(findOneMemberOther?.ekyc_check == "N" && findOneMemberOther?.applicationStatus == COMPLETED){
                    findOneMemberOther.phone_number = findOneMemberOther?.phone_number
                    if (phone_number !== 'Yes') {
                        let res = await this.KutumbaFunction.getDataFromEkycOutSource(findOneMemberOther);
                        await this.OtherBenfRepo.updateDataExistsRecord(findOneMemberOther);
                        return (res == 422) ? { code: 422, message:EKYC_ACCESS_DENIED } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
                    } else {
                        findOneMemberOther['otp'] = generateOTP();
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(findOneMemberOther?.phone_number, findOneMemberOther.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.OtherBenfRepo.updateDataExistsRecord(findOneMemberOther);
                        return { message: RESPONSEMSG.OTP, data: {} };
                    }
                } else {
                    return {code: 422, message: `Already Registered With Order Number ${findOneMemberOther?.order_number}`}
                }
            } else {
                let finalData = await this.OtherBenfRepo.mapRcDataTOOtherBenf(findOneMemberRC);
                finalData['otp'] = generateOTP();
                finalData['order_number'] = await createUniqueIdBasedOnCodes(data?.user_id);
                if(phone_number?.length !== 'Yes'){
                    await this.OtherBenfRepo.addNewDataFromRC(finalData);
                    let res = await this.KutumbaFunction.getDataFromEkycOutSource(finalData);
                    return (res == 422) ? { code: 422, message: EKYC_ACCESS_DENIED } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
                } else {
                    let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData?.phone_number, finalData.otp);
                    if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                    await this.OtherBenfRepo.addNewDataFromRC(finalData);
                    return { message: RESPONSEMSG.OTP, data: {} };
                };
            }
        } catch(e){
            return Logger.error("Other service ##rcBasedOnNumberWise", e); 
        }
    };

    async fetchRcUserData(data){
        try{
            const {user_id, benf_unique_id} = data;
            if(!user_id && !benf_unique_id) return {code: 422, message: "Id Field Required."}
            return await this.OtherBenfRepo.fetchRcUserData(data);
        }catch (e){
            return Logger.error("Other Service ####fetchRcUserData", e);
        }
    };

    async updateRcAadharData(data: other_benf_data){
        try{

            const {benf_unique_id, user_id} = data;
            if(!benf_unique_id && !user_id) return {code: 422, message: "ID And User ID Fields Required"};
            data.order_number = await createUniqueIdBasedOnCodes(data.user_id);
            data.type = "otherBenificiary";
            data.details = "rc";
            data.status = 'order_pending';
            data.applicationStatus = "Completed";
            await this.OtherBenfRepo.updateAadharData(data);
            return {message: RESPONSEMSG.UPDATE_SUCCESS};
        } catch(e) {
            return Logger.error("Other service ##updateAadharData", e);
        }
    };


    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/
    /************************************** END *************************************/

    async addKutumbaAaadharDetails(data: other_benf_data) {
        try {
            if (!data?.aadhar_no || !data.user_id) return { code: 422, message: "Aadhar number and user id required." };
            let bodyData = { aadhar_no: await aadharConvert(data.aadhar_no) };
            let checkOnlyAadharHash = await this.OtherBenfRepo.checkOnlyAadharHash(bodyData);
            if (checkOnlyAadharHash) {
                if(checkOnlyAadharHash?.ekyc_check == "N"){
                    if (checkOnlyAadharHash?.applicationStatus == "Completed") return { code: 422, message: "Aadhar Already Registered." };
                    let res = await this.KutumbaFunction.getDataFromEkycOutSource(checkOnlyAadharHash);
                    return (res == 422) ? { code: 422, message: "Access Denied From Ekyc." } : res;
                } else {
                    return {code: 422, message: "Already Registered."}
                }
            } else {
                let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
                if (getData == 422) return { code: 422, message: "Access Denied From Kutumba." }
                let reqBody: any = await spectclesAPiReusetData(data, getData[0], "aadhar");
                reqBody.user_id = data.user_id;

                let getAllCount = await this.OtherBenfRepo.findAll();
                let checkUndefined = (getAllCount[0]?.benf_unique_id == undefined) ? 0 : getAllCount[0]?.benf_unique_id;
                reqBody.benf_unique_id = `${Number(checkUndefined) + 1}`;
                reqBody.order_number = await createUniqueIdBasedOnCodes(reqBody.user_id);;
                let addrResult = await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(reqBody);
                let res = await this.KutumbaFunction.getDataFromEkycOutSource(addrResult);
                return (res == 422) ? { code: 422, message: "Access Denied From Ekyc." } : res;
            };
        } catch (e) {
            Logger.info("OtherBenfServices === addKutumbaAaadharDetails", e);
            return e;
        }
    };

    async updateBefDataByRcAndAadharHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no || !data?.user_id) return { code: 422, message: "Aadhar and user id is mandatory." }
            data.type = "otherBenificiary";
            data.details = "rc";
            data.applicationStatus = "Completed";
            let checkAadharDataByHash = await this.OtherBenfRepo.getDataByAadharHashAndUser(data);
            if (!checkAadharDataByHash) return { code: 422, message: "Update Failed." };
            await this.OtherBenfRepo.updateBefDataByAadhar(data);
            return { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            Logger.error("OtherBenfServices === updateBefDataByRcAndAadharHash", e);
            return e;
        }
    };

    async addKutumbaRcDetails(data: rc_data) {
        try {
            if (!data?.rc_no) return { code: 422, message: "RC Field Required." };
            let getData = await this.KutumbaFunction.getFamilyAdDataFromKutumba(data);
            if (getData == 422) return { code: 422, message: "Access Denied From Kutumba." }
            let checkRcById = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
            if (checkRcById?.length == 0) {
                for (let i = 1; i <= getData.length; i++) {
                    let reqBody = await spectclesAPiReusetData(data, getData[i - 1], "rc");
                    await this.OtherBenfRepo.createRcDataOfEach(reqBody);
                }
                return { message: "Data saved." };
            } else {
                (getData || [])?.map(async obj => {
                    let reqBody = await spectclesAPiReusetData(data, obj, "rc");
                    await this.OtherBenfRepo.updateRcDataBYEach(reqBody);
                });
                return { message: "Data saved." };
            };
        } catch (e) {
            Logger.error("OtherBenfServices === addKutumbaRcDetails", e);
            return e;
        }
    }

    async updateBefDataByAadhar(data: other_benf_data) {
        try {
            if (!data?.aadhar_no || !data.user_id) return { code: 422, message: "Aadhar_no and user id is mandatory." };
            data.type = "otherBenificiary";
            data.details = "aadhar";
            data.applicationStatus = "Completed";
            data.aadhar_no = await aadharConvert(data.aadhar_no);
            let result = await this.OtherBenfRepo.getDataByAadharHashAndUser(data);
            if (!result) return { code: 422, message: "Update Failed" };
            await this.OtherBenfRepo.updateBefDataByAadhar(data);
            return { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            Logger.error("OtherBenfServices === updateBefDataByAadhar", e);
            return e;
        }
    }

    async getDataByRcNo(data: rc_data) {
        try {
            if (!data?.rc_no) return { code: 422, message: "Rc no is mandatory." };
            let result = await this.OtherBenfRepo.getDataByRcNo(data.rc_no);
            result.map(obj => (obj.phone_number.length == 10) ? obj.phone_number = "Yes" : obj.phone_number = "No");
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            Logger.error("OtherBenfServices === getDataByRcNo", e);
            return e;
        }
    };

    async getDataByAadharHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no) return { code: 422, message: "aadhar_no is mandatory." };
            let result = await this.OtherBenfRepo.getDataByAadharHash(await aadharConvert(data.aadhar_no));
            return (result.length == 0) ? { code: 422, message: "Data not exists." } : result;
        } catch (e) {
            console.log("OtherBenfServices === getDataByAadharHash", e);
            return e;
        }
    };

    async sendOtpByAadharAndHash(data: other_benf_data) {
        try {
            
            if (!data?.aadhar_no && !data.user_id) return { code: 422, message: "Aadhar no is required." };
            let checkRcDataWith__rc = await this.OtherBenfRepo.__checkAadharWithRcTable(data);
            if (!checkRcDataWith__rc) return { code: 422, message: "Access Denied." };
            let checkAadharWith_Other = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
            if(data['case'] == "Yes"){
                let res = await this.KutumbaFunction.getDataFromEkycOutSource(checkAadharWith_Other);
                return (res == 422) ? { code: 422, message: "Access Denied From DBT." } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
            }
            // let checkDuplicateWithSats = await this.OtherBenfRepo.checkDuplicatesWithSats(checkAadharWith_Other);
            // if(checkDuplicateWithSats) return { code:422,  message: `You Are Already Applied In School. This Is Your ${checkDuplicateWithSats.order_number}`};
            if (checkAadharWith_Other) {
                if(checkAadharWith_Other?.ekyc_check == "N"){
                    checkAadharWith_Other.phone_number = checkRcDataWith__rc?.phone_number
                    if (checkAadharWith_Other?.phone_number?.length !== 10) {
                        let res = await this.KutumbaFunction.getDataFromEkycOutSource(checkAadharWith_Other);
                        await this.OtherBenfRepo.UpdateOtpInOtherBenficiary(checkAadharWith_Other);
                        return (res == 422) ? { code: 422, message: "Access Denied From DBT." } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
                    } else {
                        checkAadharWith_Other['otp'] = generateOTP();
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(checkAadharWith_Other?.phone_number, checkAadharWith_Other.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.OtherBenfRepo.UpdateOtpInOtherBenficiary(checkAadharWith_Other);
                        return { message: RESPONSEMSG.OTP, data: {} };
                    }
                } else {
                    return {code: 422, message: "Already Registered."}
                }
            } else {
                    let finalData = await this.OtherBenfRepo.updateDataByRcAndHashUniAadharHas__(data);
                    finalData['otp'] = generateOTP();
                    finalData['order_number'] = await createUniqueIdBasedOnCodes(data?.user_id);
                    if(finalData?.phone_number?.length !== 10){
                        await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(finalData);
                        let res = await this.KutumbaFunction.getDataFromEkycOutSource(finalData);
                        return (res == 422) ? { code: 422, message: "Access Denied From DBT." } : { message: RESPONSEMSG.RETRIVE_SUCCESS, data: res };
                    } else {
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(finalData?.phone_number, finalData.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.OtherBenfRepo.addDeatilsFromKutumbaAPI(finalData);
                        return { message: RESPONSEMSG.OTP, data: {} };
                    }
            }
        } catch (e) {
            Logger.error("OtherBenfServices === sendOtpByAadharAndHash", e);
            return e;
        }
    }

    async checkOtpByAadharAndHash(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && data.aadhar_no) return { code: 422, message: "Aadhar And ID Required." };
            let checkRcById = await this.OtherBenfRepo.getDataByRcNoAnadAadharHashWithUniId(data);
            if (!checkRcById) return { code: 422, message: "Data not exists." }
            let checkOtp = data?.otp == checkRcById.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE }
        } catch (e) {
            Logger.error("OtherBenfServices === checkOtpByAadharAndHash", e);
            return e;
        }
    }

    async getBenificaryStatus(data: other_benf_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "User id are mandatory." };
            let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: "Data not exists" };
            return await this.OtherBenfRepo.getBenificaryStatus(data.user_id);
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async statusWiseData(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id) return { code: 422, message: "Id is mandatory." };
            return await this.OtherBenfRepo.getBenificaryStatus(data.user_id);
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async statusDataByIdWith(data: other_benf_data) {
        try {
            if (!data?.user_id && !data.aadhar_no) return { code: 422, message: "User id and aadhar no are mandatory." };
            let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: "Data not exists" };
            return await this.OtherBenfRepo.statusDataByIdWith(data);
        } catch (e) {
            Logger.error("OtherBenfServices === statusDataByIdWith", e);
            return e;
        }
    };

    async getRcBasedOnAadharData(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && !data.user_id) return { code: 422, message: "Aadhar And Id Required." };
            let checkUser = await this.OtherBenfRepo.getRcBasedOnAadharDataUniId(data);
            if (checkUser.length == 0) return { code: 422, message: "Data not exists" }
            return checkUser;
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryStatus", e);
            return e;
        }
    };

    async readyTODeliver(data: other_benf_data) {
        try {
            if (data.phone_number.length !== 10) return { code: 422, message: "Enter valid number." }
            if (!data?.phone_number || !data?.benf_unique_id) return { code: 422, message: "Id and phone number is mandatory." };
            let checkBenfUniqId = await this.OtherBenfRepo.checkBenfUniId(data.benf_unique_id);
            if (!checkBenfUniqId) return { code: 422, message: "Data not exists" };
            let sixDigitsOtp = generateOTP();
            let smsSend = await this.ResusableFunctions.sendOtpAsSingleSms(data.phone_number, sixDigitsOtp);
            if (smsSend !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
            data.otp = sixDigitsOtp;
            await this.OtherBenfRepo.readyTODeliver(data);
            return { message: RESPONSEMSG.OTP };
        } catch (e) {
            Logger.error("OtherBenfServices === readyTODeliver", e);
            return e;
        }
    };

    async deliverOtpCheck(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id || !data.otp) return { code: 422, message: "Id and otp is mandatory." };
            let checkBenByUniId = await this.OtherBenfRepo.checkBenByUniqueId(data);
            if (!checkBenByUniId) return { code: 422, message: "Data not exists." };
            let checkOtp = data?.otp == checkBenByUniId.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE }
        } catch (e) {
            Logger.error("OtherBenfServices === deliverOtpCheck", e);
            return e;
        }
    };

    async pendingToReady(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id) return { code: 422, message: "Id is mandatory." };
            let result = await this.OtherBenfRepo.pendingToReady(data);
            return (result == 422) ? { code: 422, message: "Data not exist" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            console.log("OtherBenfServices === pendingToReady", e);
            return e;
        }
    };

    async updateBenificaryEachID(data: other_benf_data) {
        try {
            if (!data?.benf_unique_id) return { code: 422, message: "Id is mandatory." };
            let result = await this.OtherBenfRepo.updateBenificaryEachID(data);
            return (result == 422) ? { code: 422, message: "Data not exist" } : { message: RESPONSEMSG.UPDATE_SUCCESS };
        } catch (e) {
            console.log("OtherBenfServices === updateBenificaryEachID", e);
            return e;
        };
    };

    async getEkycDataFromEkyc(data: other_benf_data) {
        try {
            if (!data?.aadhar_no) return { code: 422, status: "Failed", message: "Aadhar no is mandatory." };
            if(data?.aadhar_no.length > 20){
                let ekycData = await this.OtherBenfRepo.getEkycDataFromEkyc(data?.aadhar_no);
                let kutumbaData = await this.OtherBenfRepo.getDataOnlyAadharFromKutumba(data?.aadhar_no);
                if (kutumbaData == 422) return {code: 422, message: "Access Denied Form Kutumba."};
                if (ekycData == 422) return {code: 422, message: "Access Denied Form EKYC."};
                if (ekycData.finalStatus != "S") return { code: 422, status: "Failed", message: "Ekyc Authentication Failed." };
                if (ekycData.aadhaarHash.toLowerCase() != kutumbaData?.aadhar_no?.toLowerCase()) return { code: 422, status: "Failed", message: "Aadhar Hash Not Matching." };
                await this.OtherBenfRepo.updateEkycStatusInBenf(data?.aadhar_no)
                return { code: 200, status: "Success", message: "Ekyc Completed Successfully." };
            } else {
                let convertAadhar = await convertAadharToSha256Hex(data.aadhar_no);
                let convertUpperCaseAadhar = convertAadhar.toLowerCase();
                let ekycData = await this.OtherBenfRepo.getEkycDataFromEkyc(convertUpperCaseAadhar);
                let kutumbaData = await this.OtherBenfRepo.getDataOnlyAadharFromKutumba(convertAadhar);
                if (kutumbaData == 422) return {code: 422, message: "Access Denied Form Kutumba."};
                if (ekycData == 422) return {code: 422, message: "Access Denied Form EKYC."};
                if (ekycData.finalStatus != "S") return { code: 422, status: "Failed", message: "Ekyc Authentication Failed." };
                console.log("ekycData.aadhaarHash.toLowerCase() != kutumbaData?.aadhar_no?.toLowerCase()",ekycData.aadhaarHash.toLowerCase(), kutumbaData?.aadhar_no?.toLowerCase())
                if (ekycData.aadhaarHash.toLowerCase() != kutumbaData?.aadhar_no?.toLowerCase()) return { code: 422, status: "Failed", message: "Aadhar Hash Not Matching." };
                await this.OtherBenfRepo.updateEkycStatusInBenf(convertAadhar)
                return { code: 200, status: "Success", message: "Ekyc Completed Successfully." };
            }
        } catch (e) {
            Logger.error("OtherBenfServices === getEkycDataFromEkyc", e);
            return e;
        }
    };

    async getBenificaryHistory(data: other_benf_data) {
        try {
            if (!data?.user_id) return { code: 422, message: "User id is mandatory." };
            let checkUser = await this.OtherBenfRepo.checkLoginUser(data.user_id);
            if (!checkUser) return { code: 422, message: "Data not exists" };
            let result = await this.OtherBenfRepo.getBenificaryHistory(data.user_id);
            return (result == 422) ? { code: 422, message: "Data not exists" } : result;
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };

    async otpSentToENteredNumber(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && !data.phone_number) return { code: 422, status: "Failed", message: "Aadhar no is mandatory." };
            data.aadhar_no = (data?.aadhar_no.length > 20) ? await convertAadharToSha256Hex(data.aadhar_no): data.aadhar_no;
                    let checkUserWithAadhar = await this.OtherBenfRepo.checkUserWithMobileWithAadhar(data);
                    if(checkUserWithAadhar){
                        data.otp = generateOTP();
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.OtherBenfRepo.updateOtpAndMobileNumber(data);
                        return {message: RESPONSEMSG.OTP}
                    } else {
                        let checkUser = await this.OtherBenfRepo.checkUserWithMobile(data);
                        if(checkUser) return {code: 422, message: "Mobile Number Already Registered."};
                        data.otp = generateOTP();
                        let smsOtp = await this.ResusableFunctions.sendOtpAsSingleSms(data?.phone_number, data.otp);
                        if (smsOtp !== 200) return { code: 422, message: RESPONSEMSG.OTP_FAILED };
                        await this.OtherBenfRepo.updateOtpAndMobileNumber(data);
                    }
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };

    async otpValidateToENteredNumber(data: other_benf_data) {
        try {
            if (!data?.aadhar_no && !data.phone_number) return { code: 422, status: "Failed", message: "Aadhar And Phone Number Is Required." };
            data.aadhar_no = (data?.aadhar_no.length > 20) ? await convertAadharToSha256Hex(data.aadhar_no): data.aadhar_no;
            let result = await this.OtherBenfRepo.checkUserWithMobile(data);
            let checkOtp = result.otp == data.otp;
            if (!checkOtp) return { code: 422, message: RESPONSEMSG.VALIDATE_FAILED }
            return { message: RESPONSEMSG.VALIDATE }
        } catch (e) {
            Logger.error("OtherBenfServices === getBenificaryHistory", e);
            return e;
        }
    };
};