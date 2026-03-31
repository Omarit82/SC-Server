import { Router } from "express";
import { getDbStatus } from "../Controllers/database.controller.js";

const dBRouter = Router();

dBRouter.get('/api/db',getDbStatus);

export default dBRouter;