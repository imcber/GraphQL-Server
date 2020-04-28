import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./db/schema";
import { resolvers } from "./db/resolvers";
import jwt from "jsonwebtoken";

require("dotenv").config({ path: "variables.env" });

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    //console.log(req.headers["authorization"]);
    const token = req.headers["authorization"] || "";
    if (token) {
      try {
        const usuario = jwt.verify(token, process.env.SECRETA);
        return { usuario };
      } catch (error) {
        console.log(error);
      }
    }
  },
});

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(
    `El servidor esta corriendo http://localhost:4000${server.graphqlPath}`
  )
);

import mongoose, { connect, mongo } from "mongoose";

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB_MONGO, { useNewUrlParser: true });
