

export const  andreaniLogin = async(req,res) => {
    try {
        const body = {
            userName: process.env.ANDREANI_USER, 
            password: process.env.ANDREANI_PASS
        }
        console.log(body);
        
        const credentials = btoa(`${process.env.ANDREANI_USER}:${process.env.ANDREANI_PASS}`);
        
        const response = await fetch('https://apis.andreani.com/login',{
            headers:{
                "Authorization": `Basic ${credentials}`,
                "Content-Type":"application/json",
                "Accept":"application/json"
            },
            method:"post",
            body:JSON.stringify(body)
        })
        
        const info = await response.json();
        console.log(info);
        
        res.status(200).json({Payload:info});
    } catch (error) {
        res.status(500).json({message:"Error de conexion"})
    }
}