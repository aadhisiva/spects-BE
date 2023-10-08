/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: controlling for routes
 * created: [2023-05-10]
 * last Modified: [2023-08-07]
 * Project: Spectacles Distribution
 */

import { Container } from 'typedi';
import express, { Request, Response } from 'express';
import Logger from '../utility/winstonLogger';
import { SchoolServices } from "../apiServices/schoolSerives";
import { RESPONSEMSG, RESPONSE_EMPTY_DATA, ResponseCode, ResponseMessages } from '../utility/statusCodes';
import { school_data, students_data } from '../entity';
import { encryptData } from '../utility/resusableFun';
import path from 'path';
import { authTokenAndVersion, requestAndResonseTime } from '../utility/middlewares';
import { API_VERSION_ISSUE } from '../utility/constants';

const router = express.Router();

const schoolServices = Container.get(SchoolServices);

// ************************** school apis **********************
router.post("/add_school", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new school_data(req.body);
        // let result = await schoolServices.getSchoolDataByOutSource(data);
        // let response = (result?.code || result instanceof Error) ?
        //     ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
        //     ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        let response = {code: 422, status: 'Failed', message: API_VERSION_ISSUE, data: encryptData({})}
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/add_schoolWithVersion", authTokenAndVersion, requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new school_data(req.body);
        let result = await schoolServices.getSchoolDataByOutSource(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.get('/check', requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let queryData = req.query;
        let data = new students_data({
            school_id: queryData.s_id,
            user_id: queryData.id,
            type: queryData.type
        });
        const result = await schoolServices.getAllStudentData(data);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), result);
        res.render(path.join(__dirname + "../../views/index"), { data: response });
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post('/email', requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new school_data(req.body);
        const result = await schoolServices.sendMailTOSchoolMail(data);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.MAIL_SENT), encryptData(result.data));
        res.send(response)
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post('/email_delivered', requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new school_data(req.body);
        const result = await schoolServices.sendMailTOSchoolMailDelivered(data);
        let response = (result.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.MAIL_SENT), encryptData(result.data));
        res.send(response)
    } catch (e) {
        Logger.error("UserController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_school", requestAndResonseTime, async (req: Request, res: Response, next: CallableFunction) => {
    try {
        let data = new school_data(req.body);
        let result = await schoolServices.getSchoolData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/all_schools", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new school_data(req.body);
        let result = await schoolServices.getAllSchoolDataBy(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/update_school_byid", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new school_data(req.body);
        let result = await schoolServices.updaetOrSaveSchoolData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.UPDATE_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});


// ************************** student apis **********************

router.post("/add_student", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        // let result = await schoolServices.getStudentDataByOutSource(data);
        // let response = (result?.code || result instanceof Error) ?
        //     ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
        //     ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
            let response = {code: 422, status: 'Failed', message: API_VERSION_ISSUE, data: encryptData({})}
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/add_studentWithVersion", authTokenAndVersion, requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.getStudentDataByOutSource(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/change_student_to_deliver", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.changeReadyToDelivered(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
router.post("/change_pending_to_ready", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.changePendingToReady(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.INSERT_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/get_student", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.getStudentData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/all_student", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.getAllStudentData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/getImageStudentWise", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.getImageStudentWise(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/all_delivered", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.getAllDelivered(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), encryptData(result));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});

router.post("/update_student", requestAndResonseTime, async (req: Request, res: Response) => {
    try {
        let data = new students_data(req.body);
        let result = await schoolServices.updateStudentData(data);
        let response = (result?.code || result instanceof Error) ?
            ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
            ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.UPDATE_SUCCESS), encryptData(result.data));
        res.send(response);
    } catch (e) {
        Logger.error("SchoolController => ", e);
        return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
    }
});
// filters
// router.post("/filters", requestAndResonseTime, async (req: Request, res: Response) => {
//     try {
//         let data = req.body;
//         let result = await schoolServices.filterByValuesWise(data);
//         let response = (result?.code || result instanceof Error) ?
//             ResponseMessages(ResponseCode.UNPROCESS, (result?.message || RESPONSEMSG.UNPROCESS), RESPONSE_EMPTY_DATA) :
//             ResponseMessages(ResponseCode.SUCCESS, (result?.message || RESPONSEMSG.RETRIVE_SUCCESS), result.data);
//         res.send(response);
//     } catch (e) {
//         Logger.error("SchoolController => ", e);
//         return ResponseMessages(ResponseCode.EXCEPTION, (e || RESPONSEMSG.EXCEPTION), RESPONSE_EMPTY_DATA);
//     }
// });
export default router;