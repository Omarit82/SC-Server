import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import path from 'path';
import indexRouter from './Routes/index.routes.js';
import { __dirname } from './utils/path.js';
import {initializedPassport} from './Config/passport.config.js';
import passport from 'passport';
import { closeDB, connectDB } from './Config/database.js';

dotenv.config();
connectDB();
initializedPassport();
const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_CODE));
app.use(cors({origin:'http://localhost:5173',credentials:true}));
app.use(session({
        name: 'connect.sid',
        store: MongoStore.create({mongoUrl:process.env.MONGO_URL,mongoOptions:{},ttl: 60*60*24*7}),
        secret:process.env.SESSION_CODE,
        resave:false,
        saveUninitialized:false,
        cookie: {
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'lax',
            path:'/',
            maxAge:60*60*1000*24*7 
        }
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use('/static', express.static(path.join(__dirname, 'tmp')));
app.use('/uploads',express.static('uploads'));
app.use('/',indexRouter);


const server = app.listen(PORT,()=>{
    console.log("Server on PORT: ",PORT);
})

const shutdown = async (signal) => {
    console.log(`Recibida señal ${signal}. Iniciando cierre...`);
    server.close(async () => {
        console.log('Servidor HTTP cerrado.');
        try {
            await closeDB();
            console.log('Cierre finalizado correctamente.');
            process.exit(0);
        } catch (err) {
            console.error('Error durante el cierre:', err);
            process.exit(1); 
        }
    });
    //Forzado del cierre
    setTimeout(() => {
        console.error('Forzando cierre por timeout...');
        process.exit(1);
    }, 10000);
};

// Escuchar señales de interrupción y terminación
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
