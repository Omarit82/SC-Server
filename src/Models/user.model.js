import { model, Schema } from "mongoose";


const userSchema = new Schema({
    nombre:{
        type:String,
        required:true
    },
    apellido:{
        type:String,
        required:true
    },
    email:{
        type: String,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    },
    googleId:{
        type:String,
        default:""
    },
    user:{
        type: String,
        default:"user"
    },
    avatar:{
        type: String,
        default:""
    }
});

export const userModel = new model("Users",userSchema);