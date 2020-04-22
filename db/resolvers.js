import mongoose from "mongoose";
import { Usuario } from "../models/Usuario";
import { Producto } from "../models/Producto";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

require("dotenv").config({ path: "variables.env" });

const creatToken = (usuario, secreta, expiresIn) => {
  console.log(usuario);
  const { id, email, nombre, apellido } = usuario;

  return jwt.sign({ id, nombre }, secreta, { expiresIn });
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
  },
};
