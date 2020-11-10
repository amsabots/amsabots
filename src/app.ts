import express from "express";
import mongoose from "mongoose";
import redis from "ioredis";
import IORedis from "ioredis";

//route handler imports
import { startShopping } from "./routes/index";
import { shoppingRouter } from "./routes/shopping";
import { cartPaymentSystem } from "./routes/cart-payment";
import { PayoutGateway } from "./routes/payout";
import { currentSession, verifyQueryStringFormat } from "./middlewares/session";
import { startSession } from "./routes/startsession";

//initialization and assignments

//create a debugger module

//const env variables
const app = express();
const port = process.env.PORT || 3000;

//use url and request body encoder middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//router handlers inclusion to app module
// ------A route handler to verify the query parametrs from all other routes----
app.use(verifyQueryStringFormat);
//------------------
app.use(startSession);
// ------- Middleware for appending the sessionid, userId to the request object of the next route handler---
//Must run after initiating the user session inside redis temp storage
app.use(currentSession);
//-----------------
app.use(startShopping);
app.use(shoppingRouter);
app.use(cartPaymentSystem);
app.use(PayoutGateway);

const connect = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://amsabots:andrewmwebi5426@cluster0.37w0a.mongodb.net/amsabots?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    //log("Mongoose connected successfully");
  } catch (e) {
    //log(e.getMessage());
  }
  app.listen(port, () => console.log(`App listening on port ${port}`));
};

//redis connection
let redisConnection: IORedis.Redis;
const connectToRedis = (): void => {
  redisConnection = new redis();
  redisConnection.on("connect", () => {
    console.log("Redis client connected successful");
  });
};

connect();
connectToRedis();
export { redisConnection as redisClient };
