import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./db/schema";
import { resolvers } from "./db/resolvers";

require("dotenv").config({ path: "variables.env" });

const app = express();
const server = new ApolloServer({ typeDefs, resolvers });

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(
    `El servidor esta corriendo http://localhost:4000${server.graphqlPath}`
  )
);

import mongoose, { connect, mongo } from "mongoose";
import dotenv from "dotenv";

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB_MONGO, { useNewUrlParser: true });
