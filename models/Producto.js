import mongoose, { connect, mongo } from "mongoose";

//definicion del schema de Usuarios

const ProductoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  existencia: {
    type: Number,
    required: true,
    trim: true,
  },
  precio: {
    type: Number,
    required: true,
    trim: true,
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

ProductoSchema.index({ nombre: "text" });
const Producto = mongoose.model("Producto", ProductoSchema);

export { Producto };
