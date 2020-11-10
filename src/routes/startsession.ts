import express, { Request, Response, NextFunction } from "express";
const router = express.Router();
import { redisClient } from "../app";
import { User } from "../models/usermodel";
import randomString from "crypto-random-string";
import {
  INDEX_URL_PREFIX as index_prefix,
  ResultResponse,
} from "../middlewares/constants";
import { getLastSessionActivity } from "../middlewares/session";

const actionSetter = (req: Request, res: Response, next: NextFunction) => {
  req.query.action = "hello";
  next();
};

router.get(
  `${index_prefix}startsession`,
  getLastSessionActivity,
  actionSetter,
  async (req, res) => {
    //incoming request via this end point must have a phonenumber attached as a query parameter
    //query parametr must container the msisdn appeded as a query string to the end point
    //validation returns a true object or an error in json format
    let phoneNumber = <string>req.query.msisdn;
    let message;
    let options = `
    1. Search and Shopping
    2. Payment and Delivery
    3. Profile
   `;
    const sessionId = randomString({ length: 16 });
    try {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        //restart a new session
        redisClient.hmset(phoneNumber, {
          sessionId: sessionId,
          userID: existingUser._id,
        });
        message = "Welcome back dear User, Please select an option to proceed".concat(
          options
        );
      } else {
        const newUser = await new User({ phoneNumber }).save();
        redisClient.hmset(phoneNumber, {
          sessionId: sessionId,
          userID: newUser._id,
        });
        message = "Welcome dear User, Please select an option to proceed".concat(
          options
        );
      }
      const response: ResultResponse = {
        message,
        sessionId,
        statusCode: 200,
        msisdn: phoneNumber,
        errorMessage: null,
      };
      return res.send(response);
      //save and start a new session
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

export { router as startSession };
