import { model, Schema } from "mongoose"


const productSchema = new Schema({
    hubspotCode:{
        type:Number,
        unique:true,
        required:true
    },
    name:{
        type:String,
        required:true
    }
})

export default productModel = model("Product",productSchema)