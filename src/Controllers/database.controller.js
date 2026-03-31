import { connectDB } from "../Config/database.js"


export const getDbStatus = async(req,res) => {
    try {
        const connection =await connectDB();
        if(connection.status){
            res.status(200).json({Payload:connection});
        }else{
            res.status(400).json({Payload:connection});
        }        
    } catch (error) {
        res.status(500).json({Message:"Error en la conexion al server."})
    }
}