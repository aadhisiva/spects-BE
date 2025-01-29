import express from 'express';
import Container from 'typedi';
import { EkycController } from '../controller/ekycController';

const router = express.Router();

const ekycController = Container.get(EkycController);

router.get('/edcs_service_application', ekycController.ekycApplication);
router.post('/edcs_service', ekycController.saveEkycData);
router.post('/authDemoCallBackUrl', ekycController.authDemoCallBackUrl);
export default router;