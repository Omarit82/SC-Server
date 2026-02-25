import hubspot from "@hubspot/api-client";
import { exchageForTokens, isAuthorized, refreshAccessToken, safeHubspotCall } from "../utils/hubspot.js";
import pLimit from "p-limit";

/**
* CONTROLADOR DE HUBSPOT 
*/


export const taskProperties = async(req,res) => {
    try {
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const resultado = await hub.crm.properties.coreApi.getAll('task');
        res.status(200).json({Payload:resultado})
    } catch (error) {
        res.status(500).json({Message:"Error en taskProperties",Details: error.message});
    }
}

export const dealProperties = async(req,res) => {
    try {
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const resultado = await hub.crm.properties.coreApi.getAll('deal');
        res.status(200).json({Payload:resultado})
    } catch (error) {
        res.status(500).json({Message: "Error en dealProperties",Details:error.message});
    }
}

export const companiesProperties = async(req,res) => {
    try {
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const resultado = await hub.crm.properties.coreApi.getAll('companies');
        res.status(200).json({Payload:resultado})
    } catch (error) {
        res.status(500).json({Message: "Error en companiesProperties",Details:error.message});
    }
}
/************************************************************************************/

export const listadoProductos = async(req,res) => {
    try {
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const resultado = await hub.crm.products.basicApi.getPage(100,undefined,['name','info_uno_id','description','hs_product_id']);
        res.status(200).json({Payload:resultado.results});
    } catch (error) {
        res.status(500).json({Message:"Error al obtener el listado de productos.",Details:error.message});
    }
}
/************************************************************************************************************** */
export const getClient = async(req,res) => {
    try {
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const id = req.params.id;
        const resultado = await safeHubspotCall(()=> hub.crm.companies.basicApi.getById(id,['state','razon_social','phone','numero_cliente_infouno','cuit___tax_id','condicion_frente_al_iva','city','zip','address']));
        res.status(200).json({Payload:resultado});
    } catch (error) {
        res.status(500).json({Message: "Error en getClients",Details:error.message});
    }
}
export const getLineItemFromDeal = async(req,res) => {
    try {
        const dealId = req.params.id;
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const associations = await safeHubspotCall(() =>  hub.crm.associations.v4.basicApi.getPage('deal',dealId,'line_item',100,undefined));
        const lineItemsId = associations.results.map(a => a.toObjectId);
        if(lineItemsId.length === 0){
            res.status(200).json({Message:"No se encontraron line items.",Payload:[]});
        }else{
            const batch = await safeHubspotCall(() => hub.crm.lineItems.batchApi.read({
                inputs: lineItemsId.map(id => ({ id })),
                properties: ['name', 'quantity', 'hs_product_id']
            })
            );
            res.status(200).json({Payload:batch});
        }
    } catch (error) {
        res.status(500).json({Message:"Error en getLineItem",Details: error.message})
    }
}
export const updateTask = async(req,res) => {
    try {
        const id = req.params.id;
        const priority = req.body.priority;
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const tarea = await hub.apiRequest({
            method:"PATCH",
            path:`/engagements/v1/engagements/${id}`,
            body: {
                engagement: {id:id},
                metadata:{
                    priority:`${priority}`
                }
            }
        });
        res.status(200).json({Message:"Listo a cerrarse", CODE:tarea.status});
    }catch(error){
        res.status(error.statusCode || 500).json({Message:"Error en lowTask",Details: error.message})
    }
}

export const updateDeal = async (req,res) => {
    try {
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const envioInfo = await safeHubspotCall(()=> hub.crm.deals.basicApi.update(req.body.dealId,{
            properties:{
                observaciones_para_produccion: req.body.observaciones,
                numero_de_remito: req.body.remito,
                nro_de_guia_del_envio: req.body.guia
            }
        }));
        res.status(200).json({Message:"Deal updated"})
    } catch (error) {
        res.status(error.statusCode || 500).json({Message:"Error en updateTaks",Details: error.message})
    }
}
export const getTask = async(req,res) => {
    try {
        const id = req.params.id;
        const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
        const tasks = await safeHubspotCall(()=> hub.crm.deals.basicApi.getById(id,undefined,undefined,['tasks'],undefined,undefined,undefined));
        const limit = pLimit(5);
        const tarea = await Promise.all(
            tasks.associations.tasks.results.map(task =>
                limit(()=>
                    safeHubspotCall(()=> hub.crm.objects.tasks.basicApi.getById(task.id,[
                        'hubspot_owner_id',
                        'hs_task_is_completed',
                        'hs_task_is_past_due_date',
                        'hs_task_priority',
                        'hs_timestamp',
                        'hs_task_status',
                        'hs_task_subject',
                        'hs_body_preview',
                        'hs_task_type',
                        'hs_task_is_overdue'
                    ]))
                )
            )
        )
        const filtradas =tarea.filter( aux => aux?.properties?.hubspot_owner_id === '50141006');
        res.status(200).json({Task:filtradas})
    } catch (error) {
        res.status(500).json({Message:"Error de conexion al realizar getTask"})
    }
}

export const despachosReales = async(req,res) => {
    try {
        if(!isAuthorized(req.session)){
            res.redirect('/hubspot/install');
        }else{
            if(parseInt(Date.now()/1000)>(parseInt(req.session.hubspotToken.Create/1000)+req.session.hubspotToken.expires_in)){               
                const token = await refreshAccessToken(req.session);
                req.session.hubspotToken = token;
                req.session.hubspotToken.Create = Date.now();
            }
            const limit = parseInt(req.query.pageSize) || 20;
            const after = req.query.after || undefined;
            const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token});
            const request = {
                limit,
                after,
                sorts:[
                    {
                        propertyName:"closedate",
                        direction: "DESCENDING"
                    },
                ],
                properties: [
                    'dealname',
                    'pipeline',
                    'observaciones_para_produccion',
                    'numero_de_remito',
                    'datos_para_envio',
                    'cantidad_citymesh__autocalculada_',
                    'cantidad_de_equipos',
                    'description',
                    'despachado',
                    'nro_de_guia_del_envio',
                    'propuesta_comercial',
                    'hs_num_of_associated_line_items',
                    'hs_deal_amount_calculation_preference',
                    'hs_primary_associated_company'
                ]
            }
            const deals = await safeHubspotCall(()=> hub.crm.deals.searchApi.doSearch(request)); 
            /***Tarea de cada deal***/           
            // deals.results.map(async dl => {
            //     let task = await hub.crm.deals.basicApi.getById(dl.id,undefined,undefined,['tasks'],undefined,undefined,undefined)//.filter(task => task.id == '50141006');
            //     console.log(task);                
            // })
            
            res.status(200).json({Deals:deals.results,paging:deals.paging})
        }

    } catch (error) {
        res.status(500).json({Message:error});
    }
}

export const dealsAnalitics = async(req,res) => {
    try {
        if(!isAuthorized(req.session)){
            res.redirect('/hubspot/install');
        }else{
            if(parseInt(Date.now()/1000)>(parseInt(req.session.hubspotToken.Create/1000)+req.session.hubspotToken.expires_in)){               
                const token = await refreshAccessToken(req.session);
                req.session.hubspotToken = token;
                req.session.hubspotToken.Create = Date.now();
            }
            const limit = parseInt(req.query.pageSize) || 20;
            const after = req.query.after || undefined;
            const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token}); 
            const request = {
                limit,
                after,
                sorts:[
                    {
                        propertyName:"closedate",
                        direction: "DESCENDING"
                    },
                ],
                properties: ["dealname","amount","createdate","closedate","hs_primary_associated_company"]
            }
            const deals = await safeHubspotCall(()=> hub.crm.deals.searchApi.doSearch(request));   
            const companyIds = deals.results
                .map(d =>d.properties.hs_primary_associated_company)
                .filter(id => !!id);
            let companies = {};
            const companiesResp = await hub.crm.companies.batchApi.read({
                inputs:companyIds.map(id=>({id})),
                properties:["name","domain"]
            });
            companiesResp.results.forEach(c=>{companies[c.id]=c.properties}); 
            const dealsWithCompany = deals.results.map(d =>({
                ...d,
                company: companies[d.properties.hs_primary_associated_company] || null
            }))
            console.log(dealsWithCompany);
            
            res.status(200).json({Deals:dealsWithCompany,paging:deals.paging||null});
        }
    } catch (error) {
        res.status(500).json({Message:"Error al obtener los deals para analitics",Error:error});
    }
}

export const getDeals = async(req,res) => {
    try {
        if(!isAuthorized(req.session)){
            res.redirect('/hubspot/install')
        } else {
            if(parseInt(Date.now()/1000)>(parseInt(req.session.hubspotToken.Create/1000)+req.session.hubspotToken.expires_in)){               
                const token = await refreshAccessToken(req.session);
                req.session.hubspotToken = token;
                req.session.hubspotToken.Create = Date.now();
            }  
            const dealstage = req.params.stage;
            let despachado = req.params.completed;
            despachado = JSON.parse(despachado);           
            let prop;
            if(despachado){
                prop = "HAS_PROPERTY" 
            }else{
                prop ="NOT_HAS_PROPERTY"
            }
            const hub = new hubspot.Client({"accessToken":req.session.hubspotToken.access_token}); 
            const deals = await safeHubspotCall(()=> hub.crm.deals.searchApi.doSearch({
                filterGroups: [{
                    filters: [
                            {
                                propertyName: 'dealstage',
                                operator: 'EQ',
                                value: dealstage // SE PASO A ENVIAR Y SE GENERÓ LA TAREA DE PROD.
                            },
                            {
                                propertyName:'despachado',
                                operator: prop 
                            },
                        ]
                    }
                ],
                sorts: ['createdAt'],
                properties: [
                    'dealname',
                    'pipeline',
                    'observaciones_para_produccion',
                    'numero_de_remito',
                    'datos_para_envio',
                    'cantidad_citymesh__autocalculada_',
                    'cantidad_de_equipos',
                    'description',
                    'despachado',
                    'nro_de_guia_del_envio',
                    'propuesta_comercial',
                    'hs_num_of_associated_line_items',
                    'hs_deal_amount_calculation_preference',
                    'hs_primary_associated_company'
                ],
                limit: 100,
                after: 0,
                
            }));
            res.status(200).json({Deals:deals});
        }  
    } catch (error) {
        res.status(500).json({Message:"Error en getDeals",Details:error.message})
    }
}


export const hubspotConnection = (req,res) => {
    try {
        //HUBSPOT APP CONFIG  RECORDAR ACTUALIZAR LOS SCOPES!!
        const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
        const REDIRECT_URI = `http://localhost:${process.env.PORT}/hubspot/oauth-callback`;
        const authURL = 
            'https://app.hubspot.com/oauth/authorize'+
            `?client_id=${encodeURIComponent(HUBSPOT_CLIENT_ID)}`+
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=oauth%20crm.objects.contacts.read%20crm.objects.companies.read%20crm.objects.deals.read%20crm.objects.orders.read%20crm.objects.products.read%20tickets%20e-commerce%20crm.schemas.line_items.read%20crm.objects.line_items.read%20business-intelligence%20crm.objects.deals.write%20crm.schemas.deals.write%20crm.schemas.deals.read`
        res.redirect(authURL);     
    } catch (error) {
        res.status(500).json({"Message:":"Server connection error"})
    }
}

export const handleCallback = async (req,res) => {
    try {
        const authCodeProof ={
            'grant_type': 'authorization_code',
            'client_id': process.env.HUBSPOT_CLIENT_ID,
            'client_secret': process.env.HUBSPOT_CLIENT_SECRET,
            'redirect_uri': `http://localhost:${process.env.PORT}/hubspot/oauth-callback`,
            'code': req.query.code
        }
        const token = await exchageForTokens(authCodeProof);     
        
        req.session.hubspotToken ={
            ...token,
            Create: Date.now()
        };
        req.session.save(() => {
            res.redirect('http://localhost:5173/');
        });

      
    }
     catch (error) {
        console.error("Callback Error: ",error);
        res.redirect(`/error?msg=auth_failed`);
    }
}

export const getAccessToken = async (req,res,next) => {
  // Check si existe un token en la session del user.
  if (req.session.hubspotToken) {
    next()
  }
  hubspotConnection();
};