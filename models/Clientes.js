import mongoose, { connect, mongo } from "mongoose";

//definicion del schema de clientes

const clientesSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  empresa: String,
  emails: Array,
  edad: Number,
  tipo: String,
  pedidos: Array,
});

const Clientes = mongoose.model("clientes", clientesSchema);

export { Clientes };
