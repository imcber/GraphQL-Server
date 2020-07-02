import mongoose from "mongoose";
import { Usuario } from "../models/Usuario";
import { Producto } from "../models/Producto";
import { Cliente } from "../models/Clientes";
import { Pedido } from "../models/Pedido";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

require("dotenv").config({ path: "variables.env" });

const creatToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido } = usuario;
  return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
};

export const resolvers = {
  Query: {
    obtenerUsuario: async (_, {}, { usuario }) => {
      return usuario;
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
    obtenerPedidos: async () => {
      try {
        return await Pedido.find({});
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedidosVendedor: async (_, {}, { usuario }) => {
      try {
        const pedidos = await Pedido.find({
          vendedor: usuario.id.toString(),
        }).populate("cliente");
        console.log(pedidos);

        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedidoID: async (_, { id }, { usuario }) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) throw new Error("El pedido no existe");
      const { vendedor } = pedido;

      if (vendedor.toString() !== usuario.id)
        throw new Error("El pedido no es del vendedor");

      return pedido;
    },
    obtenerPedidosEstado: async (_, { estado }, { usuario }) => {
      const pedidos = await Pedido.find({ vendedor: usuario.id, estado });
      return pedidos;
    },
    mejoresClientes: async () => {
      const clientes = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$cliente",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "cliente",
          },
        },
        {
          $limit: 10,
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return clientes;
    },
    mejoresVendedores: async () => {
      const vendedores = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$vendedor",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "vendedor",
          },
        },
        {
          $limit: 3,
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return vendedores;
    },
    buscarProducto: async (_, { texto }) => {
      const productos = await Producto.find({
        $text: { $search: texto },
      }).limit(10);

      return productos;
    },
  },
  Mutation: {
    nuevoUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) {
        throw new Error("El usuario ya existe");
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
        throw new Error("El usuario no existe");
      }

      //revisar password
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error("Password incorrecto");
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
    actualizarCliente: async (_, { id, input }, { usuario }) => {
      let cliente = await Cliente.findById(id);
      //VERIFICAR SI EXISTE
      if (!cliente) {
        throw new Error("Cliente no existe");
      }

      //Verificar si el vendor es correcto
      const { vendedor } = cliente;
      if (vendedor.toString() !== usuario.id.toString()) {
        throw new Error("Cliente de otro vendedor");
      }
      //guardar cliente
      cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });

      return cliente;
    },
    eliminarCliente: async (_, { id }, { usuario }) => {
      //Verify if exist the client
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no existe");
      }
      //verify if the seller it´s correct
      const { vendedor } = cliente;
      if (vendedor.toString() !== usuario.id.toString()) {
        throw new Error("Cliente de otro vendedor");
      }
      //delete the client
      await Cliente.findOneAndDelete({ _id: id });

      return "Cliente eliminado";
    },
    nuevoPedido: async (_, { input }, { usuario }) => {
      //Verify if the client exist
      const { cliente, pedido } = input;
      let clienteExiste = await Cliente.findById(cliente);
      if (!clienteExiste) throw new Error("EL cliente no existe!");

      //Verify if the client belongs to seller
      const { vendedor } = clienteExiste;
      if (vendedor.toString() !== usuario.id)
        throw new Error("Cliente de otro vendedor");

      //Check the stock of the product
      for await (const { id, cantidad } of pedido) {
        const producto = await Producto.findById(id);
        const { existencia, nombre } = producto;
        if (cantidad > existencia) {
          throw new Error(
            `El producto ${nombre} excede la cantidad disponible`
          );
        } else {
          producto.existencia = existencia - cantidad;
          await producto.save();
        }
      }
      //Create new order
      const nuevoPedido = new Pedido(input);
      //saving a seller to order
      nuevoPedido.vendedor = usuario.id;
      //save order
      const resultado = await nuevoPedido.save();
      return resultado;
    },
    actualizarPedido: async (_, { id, input }, { usuario }) => {
      //Verify if the order exists
      let pedido = await Pedido.findById(id);
      if (!pedido) throw new Error("El pedido no existe");

      //verify if the client exists
      const { cliente } = pedido;
      const existeCliente = await Cliente.findById(cliente);
      if (!existeCliente) throw new Error("El cliente no existe");

      //verify if the client belongs to seller
      const { vendedor } = existeCliente;
      if (vendedor.toString() !== usuario.id)
        throw new Error("El cliente no es del vendedor");

      //verify stock of the products
      if (input.pedido) {
        for await (const { id, cantidad } of input.pedido) {
          const producto = await Producto.findById(id);
          const { existencia, nombre } = producto;
          if (cantidad > existencia) {
            throw new Error(
              `El producto ${nombre} excede la cantidad disponible`
            );
          } else {
            producto.existencia = existencia - cantidad;
            await producto.save();
          }
        }
      }

      pedido = await Pedido.findOneAndUpdate({ _id: id }, input, { new: true });

      return pedido;
    },
    eliminarPedido: async (_, { id }, { usuario }) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) throw new Error("El pedido no existe");
      const { vendedor } = pedido;
      if (vendedor.toString() !== usuario.id)
        throw new Error("El pedido no es del vendedor");

      try {
        await Pedido.findOneAndDelete({ _id: id });
        return "Pedido Eliminado";
      } catch (error) {
        console.log(error);
      }
    },
  },
};
