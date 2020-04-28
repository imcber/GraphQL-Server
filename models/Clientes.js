import mongoose, { connect, mongo } from "mongoose";

//definicion del schema de Usuarios

const ClienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellido: {
    type: String,
    required: true,
    trim: true,
  },
  empresa: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  telefono: {
    type: String,
    trim: true,
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Usuario",
  },
});

const Cliente = mongoose.model("Cliente", ClienteSchema);

export { Cliente };
