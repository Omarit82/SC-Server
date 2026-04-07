import { exchageForTokens, safeHubspotCall } from "../utils/hubspot.js";
import pLimit from "p-limit";
/**
* CONTROLADOR DE HUBSPOT 
*/
export const taskProperties = async(req,res) => {
    try {
        const resultado = await safeHubspotCall(()=>req.hubClient.crm.properties.coreApi.getAll('task'));
        res.status(200).json({Payload:resultado})
    } catch (error) {
        res.status(500).json({Message:"Error en taskProperties",Details: error.message});
    }
}
export const hubspotUsers = async (req,res) => {
    try {
        const users = await safeHubspotCall(() => req.hubClient.crm.owners.ownersApi.getPage(undefined,undefined,100,false));       
        const pay = users.results.filter(it => it.teams?.some(team => team.id == process.env.PRODUCCION_ID)).map(item => ({
            "name":item.firstName,
            "lastName":item.lastName,
            "id":item.id
        }));
        res.status(200).json({Payload:pay});
    } catch (error) {
        res.status(500).json({Message:"Error al obtener los users"+error})
    }
}

export const dealProperties = async(req,res) => {
    try {
        const resultado = await safeHubspotCall(()=>req.hubClient.crm.properties.coreApi.getAll('deal'));
        res.status(200).json({Payload:resultado})
    } catch (error) {
        res.status(500).json({Message: "Error en dealProperties",Details:error.message});
    }
}

export const companiesProperties = async(req,res) => {
    try {
        const resultado = await safeHubspotCall(()=>req.hubClient.crm.properties.coreApi.getAll('companies'));
        res.status(200).json({Payload:resultado})
    } catch (error) {
        res.status(500).json({Message: "Error en companiesProperties",Details:error.message});
    }
}

export const listadoProductos = async(req,res) => {
    try {
        const all = [];
        let after = undefined;
        let siguiente = true;
        while(siguiente){
            const resultado = await safeHubspotCall(
                () => req.hubClient.crm.products.basicApi.getPage(
                    100,
                    undefined,
                    ['name','info_uno_id','description','hs_product_id']
                )
            );
            all.push(...resultado.results);
            if (resultado.paging && resultado.paging.next) {
                after = resultado.paging.next.after;
            } else {
                siguiente = false;
            }
        }
        
        res.status(200).json({Payload:all,Quantity:all.length});
    } catch (error) {
        res.status(500).json({Message:"Error al obtener el listado de productos.",Details:error.message});
    }
}
/************************************************************************************************************** */
export const getClient = async(req,res) => {
    try {
        const id = req.params.id;
        const resultado = await safeHubspotCall(()=> req.hubClient.crm.companies.basicApi.getById(id,['state','razon_social','phone','numero_cliente_infouno','cuit___tax_id','condicion_frente_al_iva','city','zip','address']));
        res.status(200).json({Payload:resultado});
    } catch (error) {
        res.status(500).json({Message: "Error en getClients",Details:error.message});
    }
}
export const getLineItemFromDeal = async(req,res) => {
    try {
        const dealId = req.params.id;
        const associations = await safeHubspotCall(() =>  req.hubClient.crm.associations.v4.basicApi.getPage('deal',dealId,'line_item',100,undefined));
        const lineItemsId = associations.results.map(a => a.toObjectId);
        if(lineItemsId.length === 0){
            res.status(200).json({Message:"No se encontraron line items.",Payload:[]});
        }else{
            const batch = await safeHubspotCall(() => req.hubClient.crm.lineItems.batchApi.read({
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
export const endTask = async (req,res) => {
    try {
        const id = req.params.id;
        const status = req.body.status;     
        console.log("id: "+id+" status: "+status);
        const tarea = await safeHubspotCall(()=>req.hubClient.apiRequest({
            method:"PATCH",
            path:`/engagements/v1/engagements/${id}`,
            body: {
                engagement:{id:id},
                metadata:{
                    status:`${status}`
                }
            }
        }));
        res.status(200).json({Message:"Tarea Finalizada", CODE:tarea.status});
    } catch (error) {
        res.status(error.statusCode || 500).json({Message:"Error en lowTask",Details: error.message})
    }
}
export const updatePriorityTask = async(req,res) => {
    try {
        const id = req.params.id;
        const priority = req.body.priority;
        const tarea = await safeHubspotCall(()=>req.hubClient.apiRequest({
            method:"PATCH",
            path:`/engagements/v1/engagements/${id}`,
            body: {
                engagement: {id:id},
                metadata:{
                    priority:`${priority}`
                }
            }
        }));
        res.status(200).json({Message:"Listo a cerrarse", CODE:tarea.status});
    }catch(error){
        res.status(error.statusCode || 500).json({Message:"Error en lowTask",Details: error.message})
    }
}

export const updateDeal = async (req,res) => {
    console.log(req.body);
    
    try {
        const envioInfo = await safeHubspotCall(()=> req.hubClient.crm.deals.basicApi.update(req.body.dealId,{
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
        const ownerId = req.params.ownerId||null;        
        const tasks = await safeHubspotCall(()=> req.hubClient.crm.deals.basicApi.getById(id,undefined,undefined,['tasks'],undefined,undefined,undefined));
        const limit = pLimit(5);
        const tarea = await Promise.all(
            tasks.associations.tasks.results.map(task =>
                limit(()=>
                    safeHubspotCall(()=> req.hubClient.crm.objects.tasks.basicApi.getById(task.id,[
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
        const filtradas =tarea.filter( aux => aux?.properties?.hubspot_owner_id === ownerId);
        res.status(200).json({Task:filtradas})
    } catch (error) {
        res.status(500).json({Message:"Error de conexion al realizar getTask", Error: error})
    }
}

export const despachosReales = async(req,res) => {
    try {
        const limit = parseInt(req.query.pageSize) || 20;
        const after = req.query.after || undefined;
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
        const deals = await safeHubspotCall(()=> req.hubClient.crm.deals.searchApi.doSearch(request));         
        res.status(200).json({Deals:deals.results,paging:deals.paging})
    } catch (error) {
        res.status(500).json({Message:error});
    }
}


// Función auxiliar para esperar (opcional si el rate limit es muy estricto)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const dealsAnalitics = async (req, res) => {
    try {
        const limit = parseInt(req.query.pageSize) || 100;
        let after = req.query.after || undefined;
        if (after === "undefined" || after === "null" || !after) {
            after = undefined;
        }
        const fechas = req.query.fechas ? JSON.parse(req.query.fechas) : null;
        const filters = [];
    
        const STAGE_ACUERDOS_COMERCIALES_APROBADOS = '80401557';
        const STAGE_DESPACHADOS_SIN_COBRAR = '71065978';
        const STAGE_PROPUESTA_ACEPTADA ='67052576';
        const REPARACIONES='34803074';
        const PIPELINE_V1='2509056';
        const PIPELINE_AMIAR='741510706';
        const STAGE_NEGOCIOS_CERRADOS ='71114253';

        filters.push({ 
            propertyName: 'dealstage', 
            operator: 'IN', 
            values: [STAGE_NEGOCIOS_CERRADOS,STAGE_PROPUESTA_ACEPTADA,STAGE_DESPACHADOS_SIN_COBRAR,STAGE_ACUERDOS_COMERCIALES_APROBADOS]
        });
        filters.push({
            "propertyName": "closedate",
            "operator": "HAS_PROPERTY"
        });
        filters.push({ 
            propertyName: 'pipeline', 
            operator: 'NOT_IN', 
            values:[PIPELINE_V1,PIPELINE_AMIAR,REPARACIONES]
        });
        if (fechas?.fechaDesde) {
            filters.push({ propertyName: 'closedate', operator: 'GTE', value: new Date(fechas.fechaDesde).getTime() });
        }
        if (fechas?.fechaHasta) {
            filters.push({ propertyName: 'closedate', operator: 'LTE', value: new Date(fechas.fechaHasta).getTime() });
        }
        const request = {
            filterGroups: filters.length > 0 ? [{ filters }] : [],
            sorts: [{ propertyName: "closedate", direction: "DESCENDING" }],
            properties: ["dealname", "amount", "createdate", "closedate", "hs_primary_associated_company"],
            limit,
            after
        };
        let allDeals = [];
        let hasNextPage = true;
        let resultado = null;
        if (filters.length !== 3) {
            while (hasNextPage) {
                resultado = await safeHubspotCall(() => req.hubClient.crm.deals.searchApi.doSearch(request));
                allDeals.push(...resultado.results);
                if (resultado.paging?.next?.after) {
                    request.after = resultado.paging.next.after; 
                    await delay(100); 
                } else {
                    hasNextPage = false;
                }
            }
        } else {
            resultado = await safeHubspotCall(() => req.hubClient.crm.deals.searchApi.doSearch(request));
            allDeals = resultado.results;
        }
        if (!allDeals || allDeals.length === 0) {
            return res.status(200).json({ Deals: [], paging: null });
        }
        const companyIds = [...new Set(allDeals.map(d => d.properties.hs_primary_associated_company).filter(id => !!id))];
        let companiesMap = {};
        for (let i = 0; i < companyIds.length; i += 100) {
            const batch = companyIds.slice(i, i + 100);
            const companiesResp = await req.hubClient.crm.companies.batchApi.read({
                inputs: batch.map(id => ({ id })),
                properties: ["name", "domain","city","state","cuit___tax_id","razon_social"]
            });
            
            companiesResp.results.forEach(c => {
                companiesMap[c.id] = c.properties;
            });
        }
        const dealsWithCompany = allDeals.map(d => ({
            ...d,
            company: companiesMap[d.properties.hs_primary_associated_company] || null
        }));
        res.status(200).json({ 
            Deals: dealsWithCompany, 
            totalCount: dealsWithCompany.length,
            paging:resultado.paging||null
        });
    } catch (error) {
        console.error("HubSpot Detail Error:", error.response?.body || error);
        res.status(500).json({ Message: "Error al obtener los deals", Error: error.message });
    }
};

export const getDeals = async(req,res) => {
    try {
        const dealstage = req.params.stage;
        let despachado = req.params.completed;
        let userId = req.query.userId;
        console.log(userId); /*A partir del usuario pasado, obtenidos los deals, filtro por tareas y devuelvo los deals.*/ 
        despachado = JSON.parse(despachado);           
        let prop;
        if(despachado){
            prop = "HAS_PROPERTY" 
        }else{
            prop ="NOT_HAS_PROPERTY"
        }
        const deals = await safeHubspotCall(()=> req.hubClient.crm.deals.searchApi.doSearch({
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
    } catch (error) {
        res.status(500).json({Message:"Error en getDeals",Details:error.message})
    }
}

export const hubspotConnection = (req,res) => {
    try {
        //HUBSPOT APP CONFIG  RECORDAR ACTUALIZAR LOS SCOPES!!
        const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
        const REDIRECT_URI = `${process.env.URL_BACK}${process.env.PORT}/hubspot/oauth-callback`;
        const authURL = 
            'https://app.hubspot.com/oauth/authorize'+
            `?client_id=${encodeURIComponent(HUBSPOT_CLIENT_ID)}`+
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=oauth%20crm.objects.contacts.read%20crm.objects.companies.read%20crm.objects.deals.read%20crm.objects.orders.read%20crm.objects.products.read%20tickets%20e-commerce%20crm.schemas.line_items.read%20crm.objects.line_items.read%20business-intelligence%20crm.objects.deals.write%20crm.schemas.deals.write%20crm.schemas.deals.read%20crm.objects.owners.read`
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
            'redirect_uri': `${process.env.URL_BACK}${process.env.PORT}/hubspot/oauth-callback`,
            'code': req.query.code
        }
        const token = await exchageForTokens(authCodeProof);     
        
        req.session.hubspotToken ={
            ...token,
            Create: Date.now()
        };
        req.session.save(() => {
            res.redirect(`${process.env.URL_FRONT}`);
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