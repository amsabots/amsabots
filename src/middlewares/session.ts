import { redisClient } from "../app";
import { Request, Response, NextFunction } from "express";
import {
  ResultResponse,
  INDEX_URL_PREFIX as index_prefix,
} from "../middlewares/constants";
import { RedisConstrains, CommonUtils } from "../extras/common";

export const currentSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await redisClient.exists(<string>req.query.msisdn);
    if (result === 1) {
      const storage = ((await redisClient.hgetall(
        <string>req.query.msisdn
      )) as unknown) as RedisConstrains;

      req.sessionId = storage.sessionId;
      req.user_id = storage.userID;
      return next();
    }
    return res.redirect(
      `${index_prefix}startsession?msisdn=${<string>req.query.msisdn}`
    );
  } catch (error) {
    console.log(`SESSION CHECK ERROR:: ${error}`);
  }
};

export const onInitBackaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { msisdn, action } = req.query;
  const utils = new CommonUtils(<string>msisdn);
  switch (<string | number>action) {
    case "0":
      const lastEntry = await utils.getLastBackStackEntry();
      if (lastEntry) return res.redirect(`${lastEntry}&addToBackStack=true`);
      return res.redirect(
        `/index/api/v1/startsession?msisdn=${<string>msisdn}&action=hello`
      );
    case "menu":
      await utils.resetBackstackEntry();
      return res.redirect(
        `/index/api/v1/startsession?msisdn=${<string>msisdn}&action=hello`
      );
    default:
      return next();
  }
};

export const addToBackStackSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { msisdn } = req.query;

  const utils = new CommonUtils(<string>msisdn);
  if (typeof req.query.addToBackStack == "undefined") {
    utils.previous = req.originalUrl;
    utils.setBackStackEntry();
  }
  return next();
};

export const verifyQueryStringFormat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message: ResultResponse | null = {
    errorMessage: null,
    statusCode: 400,
    message: null,
    msisdn: null,
    sessionId: null,
  };
  const { msisdn, action } = req.query;
  if (typeof msisdn == "undefined" || typeof action == "undefined") {
    message.errorMessage =
      "BAD REQUEST:: The request query string should have a msisdn and action as query string parameters";
    return res.send(message);
  }
  if (msisdn.length! > 10 && msisdn.length! <= 13) {
    const phonenumber = <string>msisdn;
    req.query.msisdn = phonenumber.replace("+", "");
    return next();
  } else {
    message.errorMessage =
      "BAD REQUEST:: Invalid phonenumber, Phonenumber should be in the fomart +country-codeXXXXXXXXXX";
    res.send(message);
  }
};

export const getLastSessionActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { msisdn, action } = req.query;
  try {
    const redisStorage = ((await redisClient.hgetall(
      <string>msisdn
    )) as unknown) as RedisConstrains;
    const backstack = redisStorage.backstack;

    if (backstack) {
      const utils = new CommonUtils(<string>msisdn);
      const lastActivity = await utils.getLastBackStackEntry();
      console.log("session activity present");
      return res.redirect(`${lastActivity}&addToBackStack=true`);
    } else {
      console.log("no session activity");
      return next();
    }
  } catch (error) {
    throw error;
  }
};
