import mongoose, { model, Schema } from "mongoose";
import getNextSequence  from "./counter.model.js";

const remitoSchema = new Schema({
  exported:{
    type: Boolean,
    default: false
  },
  numero: {
    type: Number,
    unique: true    // crea índice único (refuerzo, aunque getNextSequence ya evita duplicados)
  },
  clientData: {type: Object},
  remitar: {type: Array},
  fecha: { type: Date, default: Date.now }
}, { timestamps: true }); // crea createdAt y updatedAt

// Middleware para asignar el número autoincremental
remitoSchema.pre("save", async function(next) {
  try {
    if (this.isNew) {
      this.numero = await getNextSequence("remitoNumero");
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Remito = mongoose.models.Remito || model("Remito", remitoSchema);
export { Remito };