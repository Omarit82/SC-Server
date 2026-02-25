import { Router } from "express";
import {saveRemito,getRemitos,exportarRemito } from "../Controllers/remitos.controller.js";


const remitoRouter = Router();

remitoRouter.post('/save',saveRemito);
remitoRouter.get('/',getRemitos);
remitoRouter.put('/:id',exportarRemito);

export default remitoRouter;