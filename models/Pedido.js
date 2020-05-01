import mongoose, { connect, mongo } from "mongoose";

//definicion del schema de Usuarios

const PedidoSchema = new mongoose.Schema({
  pedido: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  cliente: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "Cliente",
  },
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Usuario",
  },
  estado: {
    type: String,
    default: "PENDIENTE",
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

const Pedido = mongoose.model("Pedido", PedidoSchema);

export { Pedido };
