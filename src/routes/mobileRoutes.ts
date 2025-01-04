import express from 'express';
import Container from 'typedi';
import multer from "multer";
const router = express.Router()

import { MobileController } from '../controller/mobileController';
import { authenticateToken, authVersion } from '../utils/middlewares';

const mobileController = Container.get(MobileController);

const memoryStorage = multer.memoryStorage();
const uploadImage = multer({ storage: memoryStorage });

/* user apis */
router.post('/loginWithoutEncryption', authVersion, mobileController.loginWithoutEncryption);
router.post('/validateUser', mobileController.verifyOtp);  
/* school apis */
router.post('/add_schoolWithVersion', authenticateToken, mobileController.addSchoolData);  
router.post('/get_school', authenticateToken, mobileController.getSchoolData);  
router.post('/all_schools', authenticateToken, mobileController.getAllSchoolsData);  
router.post('/update_school_byid', authenticateToken, mobileController.UpdateSchoolData);  
/* student apis */
router.post('/add_studentWithVersion', authenticateToken, mobileController.addStudentData);  
router.post('/get_student', authenticateToken, mobileController.getStudentData);  
router.post('/all_student', authenticateToken, mobileController.getAllStudentData);  
router.post('/all_delivered', authenticateToken, mobileController.getAllDelivereData);  
router.post('/update_student', authenticateToken, mobileController.UpdateStudnetData);  
router.post('/change_student_to_deliver', authenticateToken, mobileController.ChangeStudentStatusToDeliver);  
router.post('/change_pending_to_ready', authenticateToken, mobileController.ChangeStudentStatusToReady);  
router.post('/getImageStudentWise', authenticateToken, mobileController.getImageStudentWise); 
/* other beneficiary apis */
router.post('/addDemoAuthWithVersion', authenticateToken, mobileController.addDemoAuthWithVersion);  
router.post('/saveDemoAuthResponse', authenticateToken, mobileController.saveDemoAuthResponse);  
router.post('/ekycProcessWithKutumba', authenticateToken, mobileController.ekycProcessWithKutumba);  
router.post('/addDataAfterEkyc', authenticateToken, mobileController.addDataAfterEkyc);  
router.post('/rcBasedOnNumberWise', authenticateToken, mobileController.rcBasedOnNumberWise);  
router.post('/otpCheckRcMember', authenticateToken, mobileController.otpCheckRcMember);  
router.post('/updateRcAadharData', authenticateToken, mobileController.updateRcAadharData);  
router.post('/eachStatusWise', authenticateToken, mobileController.eachStatusWise);  
router.post('/readyToDeliverOtp', authenticateToken, mobileController.readyToDeliverOtp);  
router.post('/validateReadyToDeliverOtp', authenticateToken, mobileController.validateReadyToDeliverOtp);  
router.post('/delivered', authenticateToken, mobileController.delivered);  
router.post('/otpSentToNewNumber', authenticateToken, mobileController.otpSentToNewNumber);  
router.post('/read_to_delivered', authenticateToken, mobileController.chnageStatusReadyToDeliver);  
router.post('/pending_to_ready', authenticateToken, mobileController.chnageStatusPendingToReady);  
router.post('/rc_aadhar_data', authenticateToken, mobileController.getAaadharDataFromRcData);  
router.post('/get_aadhar_data', authenticateToken, mobileController.getAadharHashData);  
router.post('/get_bef_history', authenticateToken, mobileController.getBenfHistory);  
router.post('/get_bef_status', authenticateToken, mobileController.getBenfStatusWise);  

export default router;