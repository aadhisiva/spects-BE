import express from 'express';
import Container from 'typedi';
import multer from "multer";
const router = express.Router()

import { MobileController } from '../controller/mController';
import { authenticateToken, authVersion } from '../utils/middlewares';

const webController = Container.get(MobileController);

const memoryStorage = multer.memoryStorage();
const uploadImage = multer({ storage: memoryStorage });

router.post('/updateRecordFromTalukLevel', authenticateToken, webController.updateRecordFromTalukLevel);
router.post('/addImagesToSubId', authenticateToken, webController.addImagesToSubId);

router.post('/loginToTaluk', authVersion, webController.loginToTaluk);
router.post('/verfiyTalukOtp', webController.verfiyTalukOtp);
router.post('/getTalukLevelSurvey', authenticateToken, webController.getTalukLevelSurvey);

router.post('/sendOtp', authVersion, webController.sendOtp);
router.post('/assignedHobliDetails', webController.assignedHobliDetails);
router.post('/verifyOtp', webController.verifyOtp);

router.post('/updateRecordFromTalukLevel', authenticateToken, webController.updateRecordFromTalukLevel);
router.post('/addImagesToSubId', authenticateToken, webController.addImagesToSubId);
router.post('/getWatershedOrSub', authenticateToken, webController.getWatershedOrSub);
router.post('/getAllSchemes', authenticateToken, webController.getAllSchemes);
router.post('/getAllRoles', webController.getAllRoles);

router.post('/getSectors', authenticateToken, webController.getSectors);
router.post('/getActivity', authenticateToken, webController.getActivity);
router.post('/getCategory', authenticateToken, webController.getCategory);
router.post('/getQuestionsBasedOnActivity', authenticateToken, webController.getQuestionsBasedOnActivity);
router.post('/getPrivateLand', authenticateToken, webController.getPrivateLand);
router.post('/getCommonLand', authenticateToken, webController.getCommonLand);
router.post('/saveSurveyData', authenticateToken, webController.saveSurveyData);
router.post('/getSubmissionList', authenticateToken, webController.getSubmissionList);
router.post('/getAllSubmissionList', authenticateToken, webController.getAllSubmissionList);
/* New */
router.post('/getSurveyByUserAndStatus', authenticateToken, webController.getSurveyByUserAndStatus);
router.post('/getAllSurveyListByUserId', authenticateToken, webController.getAllSurveyListByUserId);

router.post('/getRecord', authenticateToken, webController.getRecord);
router.post('/updateSurveyData', authenticateToken, webController.updateSurveyData);
router.post('/retriveMasters', authenticateToken, webController.retriveMasters);
router.post('/uploadImages', uploadImage.single('image'), authenticateToken, webController.uploadImages);
router.get('/getImage/:id', webController.getImage);

router.get('/updateFromLowerLevel', authenticateToken, webController.updateFromLowerLevel);

export default router;