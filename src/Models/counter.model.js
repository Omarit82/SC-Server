import { model, Schema } from "mongoose";


const counterSchema = new Schema ({
    _id:String, // nombre de la secuencia
    seq:{ type: Number, default:0}
});

const Counter =  model("Counter",counterSchema);

async function getNextSequence (name) {
    const counter = await Counter.findByIdAndUpdate(
        name,
        { $inc: {seq:1}},
        { new:true, upsert:true }
    );
    return counter.seq;
}

export default getNextSequence;
