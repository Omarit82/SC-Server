import { isAuthorized, refreshAccessToken } from "../utils/hubspot.js"
import hubspot from "@hubspot/api-client";


export const ensureHubspotToken = async(req,res,next) => {
    if(!isAuthorized(req.session)){
        return res.status(401).json({ Message: "No autorizado en HubSpot"});
    }
    const {Create, expires_in, access_token} = req.session.hubspotToken;
    const bufferTime = 60000;
    if(Date.now()>(Create+(expires_in*1000)-bufferTime)){
        console.log("Refrescando Token");
        try{
            const newTokens = await refreshAccessToken(req.session);
            req.session.hubspotToken = { ...newTokens, Create: Date.now()};
            console.log("Nuevo token: "+newTokens.access_token);
            
            await new Promise((resolve,reject)=>{
                req.session.save((err)=>{ 
                    if(err) reject(err);
                    else resolve();
                })
            })
            req.hubClient = new hubspot.Client({ accessToken: req.session.hubspotToken.access_token });
            return next();
        }catch(error){
            console.log("Fallo al refrescar el token: ",error);
            return res.status(500).json({ Message: "Sesión de HubSpot expirada, re-autentique"});
        }
    }
    req.hubClient = new hubspot.Client({ accessToken: access_token });
    next();
}