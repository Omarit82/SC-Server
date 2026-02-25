import { Router } from 'express';
import { andreaniLogin } from '../Controllers/andreani.controller.js';

const andreaniRouter = Router();

andreaniRouter.post('/login',andreaniLogin);

export default andreaniRouter;