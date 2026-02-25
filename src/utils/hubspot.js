
export const refreshAccessToken = async (session) => {
    try {
        const refreshTokenProof = {
            grant_type: 'refresh_token',
            client_id: process.env.HUBSPOT_CLIENT_ID,
            client_secret: process.env.HUBSPOT_CLIENT_SECRET,
            redirect_uri: `http://localhost:${process.env.PORT}/oauth-callback`,
            refresh_token: session.hubspotToken.refresh_token
        }
        const response = await exchageForTokens(refreshTokenProof);
        return response;
    } catch (error) {
        console.error(error);
    }
}

export const exchageForTokens = async (exchangeProof) =>{
    try {
        const formData = new URLSearchParams(exchangeProof);

        const response = await fetch('https://api.hubapi.com/oauth/v1/token',{
            method:"POST",
            headers:{
                'Content-Type':'application/x-www-form-urlencoded'
            },
            body:formData
        })
        const data = await response.json();
      
        if(!response.ok){
            throw new Error(data.message || `HTTP Error! status:${response.status} // ${response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error("Error en el exchangeForTokens: ",error.message);
        throw (error);
    }
}


export const isAuthorized = (session) => {
    return !!(session?.hubspotToken?.access_token);
};


/***Llamada con reintentos a Hubspot! */
export const safeHubspotCall = async(fn,session, retries=3, delay=1000)=>{
    try {
        return await fn();
    } catch (error) {
        /**Token expirado 401 */
        if(error.status === 401 && session.hubspotToken?.refresh_token){
            console.log("Token Expirado, intentando refresco...");
            const newTokens = await refreshAccessToken(session);
            session.hubspotToken = {
                ...session.hubspotToken,
                ...newTokens,
                updatedAt: Date.now()
            };
            return await fn();
        }
        /**Rate limit 429 */
        if(error.code === 429 && retries>0){
            console.warn("Rate limit, esperando...",delay,"ms");
            await new Promise (r => setTimeout(r,delay));
            return safeHubspotCall(fn,session ,retries-1,delay*2);
        }
        throw error
    }
}