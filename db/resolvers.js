import mongoose from "mongoose";
import { Usuario } from "../models/Usuario";
import { Producto } from "../models/Producto";
import { Cliente } from "../models/Clientes";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

require("dotenv").config({ path: "variables.env" });

const creatToken = (usuario, secreta, expiresIn) => {
  console.log(usuario);
  const { id, email, nombre, apellido } = usuario;

  return jwt.sign({ id }, secreta, { expiresIn });
};

export const resolvers = {
  Query: {
    obtenerUsuario: async (_, { token }) => {
      const usuarioId = await jwt.verify(token, process.env.SECRETA);

      return usuarioId;
    },
    obtenerProductos: async () => {
      const productos = await Producto.find({});
      return productos;
    },
    obtenerProducto: async (_, { id }) => {
      const producto = await Producto.findById(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      return producto;
    },
    obtenerClientes: async () => {
      return await Cliente.find({});
    },
    obtenerClientesXVendedor: async (_, {}, { usuario }) => {
      const clientes = await Cliente.find({ vendedor: usuario.id.toString() });

      if (!clientes) {
        throw new Error("Clientes no encontrados");
      }
      return clientes;
    },
    obtenerClienteId: async (_, { id }, { usuario }) => {
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }
      const { vendedor } = cliente;
      if (vendedor.toString() !== usuario.id.toString()) {
        throw new Error("Cliente de otro vendedor");
      }
      return cliente;
    },
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) {
        throw new Error("EL usuario ya existe");
      }
      const salt = await bcryptjs.genSalt(2);
      input.password = await bcryptjs.hash(password, salt);
      console.log(input);

      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      //revisar si usuario existe
      if (!existeUsuario) {
        throw new Error("EL usuario no existe");
      }

      //revisar password
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error("password incorrecto");
      }
      //crear token
      return {
        token: creatToken(existeUsuario, process.env.SECRETA, "24h"),
      };
    },
    nuevoProducto: async (_, { input }) => {
      const { nombre, existencia, precio } = input;
      const existeProducto = await Producto.findOne({ nombre });
      if (existeProducto) {
        throw new Error("El producto ya existe");
      }

      try {
        const producto = new Producto(input);
        const resultado = await producto.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      producto = await Producto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return producto;
    },
    eliminarProducto: async (_, { id }) => {
      let producto = await Producto.findById(id);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      await Producto.findOneAndDelete({ _id: id });

      return "Producto Eliminado";
    },
    nuevoCliente: async (_, { input }, { usuario }) => {
      //verificar si existe
      const { email } = input;
      const existeCliente = await Cliente.findOne({ email });

      if (existeCliente) {
        throw new Error("El cliente ya existe");
      }

      const nuevoCliente = new Cliente(input);

      nuevoCliente.vendedor = usuario.id;

      try {
        const resultado = await nuevoCliente.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarCliente: async (_, { id, input }) => {
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no existe");
      }
      cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });

      return cliente;
    },
    eliminarCliente: async (_, { id }) => {
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no existe");
      }
      await Cliente.findOneAndDelete({ _id: id });

      return "Cliente eliminado";
    },
  },
};
