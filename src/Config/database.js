import mongoose from "mongoose";

export const connectDB = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MONGO DB connected: ${conn.connection.host}`);
        const response = {
            "connection":conn.connection.host,
            "status": true
        }
        return response;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        const response = {
            "connection":"Error",
            "status": false
        }
        //process.exit(1);
        //throw new Error("No se pudo conectar a la db");
        return false;
    }
}

export const closeDB = async () => {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
};