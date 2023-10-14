/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: controlling for routes
 * created: [2023-05-10]
 * last Modified: [2023-08-07]
 * Project: Spectacles Distribution
 */

import Container from 'typedi';
import express, { Request, Response } from 'express';
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { AdminServices } from '../apiServices/adminServices';
import { district_data, master_data } from '../entity';
import { reUsableResSendFunction } from '../utility/resusableFun';
import { authenticateToken, validateFeilds, verifyUser } from '../utility/middlewares';
import { login_validation, otp_validation, update_district, update_phco_validate, update_refractionist, update_taluka } from '../utility/validations';

const router = express.Router();

const adminServices = Container.get(AdminServices); 
// skip user
router.post("/skip", authenticateToken, verifyUser, async (req: any, res: Response) => {
    try {
        req.session.user.isIntialLogin = "N"
        return res.send("");
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// loing user
router.post("/login", validateFeilds(login_validation), async (req: Request, res: Response) => {
    try {
        let data = req.body
        let result = await adminServices.login(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

// get current session details
router.post('/getMe', (req: any, res) => {
    if (req?.session?.user) {
        res.status(200).send({ success: true, userData: req.session?.user });
    } else {
        res.status(444).send({ success: false });
    };
});

// logout user
router.post("/logout", async (req: Request, res: Response) => {
    try {
        req?.session?.destroy((err) => {
            if (err) return res.status(400).json({ code: 400, msg: "Please Try Again" });
            res.clearCookie('user', {path: '/'});
            res.status(200).json({ code: 200, msg: "logout" });
        });
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    };
});

// user otp check 
router.post("/otp_check", validateFeilds(otp_validation), async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.validationOtp(data, req);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// resend oip to mobile number
router.post("/resend_otp", validateFeilds(login_validation), async (req: Request, res: Response) => {
    try {
        let data = req.body
        let result = await adminServices.resendOtp(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result.data);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// all master based on login user
router.post("/all_masters", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getAllMasters(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// all eligibale users api
router.post("/get_orders_count", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getAllOrders(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// delivered users api
router.post("/delivered", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getAllDelivered(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// oending users
router.post("/pending", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getAllPending(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// update user data
router.post("/update_data", authenticateToken, verifyUser, validateFeilds(update_refractionist), async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.getUpdatedData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// addd new multiple users to same village user data
router.post("/add_new_data_with_exist", authenticateToken, verifyUser, validateFeilds(update_refractionist), async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.addNewDataWithExistsRow(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// get talukas data
router.post("/talukas_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getTalukasData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
/* ---------------------------------------------------------------------------------------------------------- */
// get phco's data  phco_data
router.post("/phco_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getPhcosData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// update phco table data
router.post("/update_phco_data", authenticateToken, verifyUser, validateFeilds(update_phco_validate), async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.updatePhcoData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/update_phco_screenings", authenticateToken, verifyUser, async (req: any, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.updatePhcoScreeningData(data);
        // result?.code || result instanceof Error? req.session.user.isIntialLogin = "N": "";
        let response = (result?.code || result instanceof Error) ?
        ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
        ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// phco data village wise
router.post("/get_phco_wise_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result: any = await adminServices.getPhcoWiseData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

/* -------------------------------------------------------------------------------------------------------------- */

// get district data
router.post("/districts_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let result = await adminServices.getDistrictsData();
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.INSERT_SUCCESS, result);
        res.send(response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// update districts data
router.post("/update_districts_Data", authenticateToken, verifyUser, validateFeilds(update_district), async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.updateDistrictsData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// update taluka data
router.post("/update_taluka_data", authenticateToken, verifyUser, validateFeilds(update_taluka), async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.updateTalukaData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.UPDATE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// reports data
router.post("/reports_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = req.body;
        let result = await adminServices.getReportsData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

// get user data by using of login user

router.post("/getUser_data", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = new district_data(req.body);
        let result = await adminServices.getLoginUserData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});


// new apis for managing more records

router.post("/uniqueDistricts", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.uniqueDistricts(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/searchData", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.searchData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/searchDataStateAndDistrictWise", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.searchDataStateAndDistrictWise(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/eachDataIdWise", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.eachDataIdWise(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/refractionistReports", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.refractionistReports(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/makeNullToValues", authenticateToken, verifyUser, async (req: Request, res: Response) => {
    try {
        let data = new master_data(req.body);
        let result = await adminServices.makeNullToValues(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, RESPONSEMSG.RETRIVE_SUCCESS, result);
        return reUsableResSendFunction(res, response);
    } catch (e) {
        console.log("error", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
export default router;