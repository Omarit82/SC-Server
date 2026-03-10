import mongoose from "mongoose";

export const connectDB = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MONGO DB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        //process.exit(1);
        throw new Error("No se pudo conectar a la db");
    }
}
export const closeDB = async () => {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
};