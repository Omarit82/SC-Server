import { Router } from "express";
import { hubspotConnection,handleCallback,despachosReales, getDeals,updateDeal,getTask,taskProperties, getLineItemFromDeal, dealProperties, getClient, companiesProperties, listadoProductos, updateTask, dealsAnalitics, hubspotUsers} from "../Controllers/husbpot.controller.js";
import { ensureAuthenticate } from "../Config/passport.config.js";
import { ensureHubspotToken } from "../Middlewares/hubspotAuth.js"; 


const hubspotRouter = Router();

hubspotRouter.get('/install',ensureAuthenticate,hubspotConnection);
hubspotRouter.get('/oauth-callback',handleCallback);

hubspotRouter.use(ensureAuthenticate);
hubspotRouter.use(ensureHubspotToken);

hubspotRouter.get('/dealsAnalitics',dealsAnalitics);
hubspotRouter.get('/despachosReales', despachosReales)
hubspotRouter.get('/deals/:stage/:completed',getDeals);
hubspotRouter.get('/task/:id/:ownerId',getTask);
hubspotRouter.get('/clients/:id',getClient);
hubspotRouter.get('/lineItem/:id',getLineItemFromDeal);
hubspotRouter.put('/deals',updateDeal)
hubspotRouter.put('/task/:id',updateTask)


/**DEBUG ROUTES**/
hubspotRouter.get('/tasksProperties',taskProperties);
hubspotRouter.get('/dealProperties',dealProperties);
hubspotRouter.get('/companiesProperties',companiesProperties);
hubspotRouter.get('/products',listadoProductos);
hubspotRouter.get('/users', hubspotUsers);


export default hubspotRouter;