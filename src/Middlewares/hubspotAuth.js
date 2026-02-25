import { isAuthorized, refreshAccessToken } from "../utils/hubspot.js"

export const ensureHubspotToken = async(req,res,next) => {
    if(!isAuthorized(req.session)){
        return res.status(401).json({ Message: "No autorizado en HubSpot"});
    }
    const {Create, expires_in} = req.session.hubspotToken;
    const bufferTime = 60000;
    if(Date.now()>(Create+(expires_in*1000)-bufferTime)){
        console.log("Refrescando Token");
        try{
            const newTokens = await refreshAccessToken(req.session);
            req.session.hubspotToken = { ...newTokens, Create: Date.now()};
            req.session.save((err)=>{ 
                if(err) { 
                    console.error("Error al guardar sesion post-refresh",err);
                    return res.status(500).json({ Message: "Error de persistencia"});
                }
                next();
            })
            return;

        }catch(error){
            return res.status(500).json({ Message: "Error al refrescar token"});
        }
    }
    next();
}