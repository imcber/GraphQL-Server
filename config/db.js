import mongoose, { connect, mongo } from "mongoose";
import dotenv from "dotenv";

mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost/clientes", { useNewUrlParser: true });
