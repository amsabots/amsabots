import { redisClient } from "../app";
import { Request, Response, NextFunction, response } from "express";
import {
  ResultResponse,
  INDEX_URL_PREFIX as index_prefix,
} from "../middlewares/constants";
import * as _ from "lodash";
import { some } from "lodash";
import { async } from "crypto-random-string";
export interface RedisConstrains {
  //this is augmented to a rubost less temporary assignment solution
  backstack: string;
  sessionId: string;
  sortRange: string;
  sortMethod: string;
  subcategory_id: string;
  item_ID: string;
  userID: string;
}

export class CommonUtils {
  constructor(private userNumber: string) {}
  previous: string;
  setBackStackEntry = async () => {
    try {
      let storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      storage.sessionId = storage.sessionId;
      if (
        Boolean(storage.backstack) &&
        typeof storage.backstack != "undefined"
      ) {
        storage.backstack = storage.backstack.concat(`:${this.previous}`);
      } else {
        storage.backstack = this.previous;
      }
      await redisClient.hmset(this.userNumber, <any>storage);
    } catch (error) {
      console.log(error);
    }
  };

  getLastBackStackEntry = async () => {
    console.log("ON BACKPRESSED");
    try {
      let storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      if (storage.backstack) {
        let backstackEntries: string[] = storage.backstack.split(":");
        const lastEntry = backstackEntries.pop() as string;
        const newBackstack = backstackEntries.toString().replace(",", ":");
        storage.sessionId = storage.sessionId;
        storage.backstack = newBackstack;
        console.log("new BackStack", storage);
        await redisClient.hmset(this.userNumber, <any>storage);
        return lastEntry;
      }
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };
  setPriceRangeToSavedInstance = async (
    priceRange: boolean[],
    sortMethod: string
  ) => {
    try {
      let storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      const priceRangeText = priceRange.toString();
      storage.sortRange = priceRangeText;
      storage.sortMethod = sortMethod;
      await redisClient.hmset(this.userNumber, <any>storage);
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };

  setSubCategoryIDInstance = async (subcategory_id: string) => {
    try {
      let storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      storage.subcategory_id = subcategory_id;
      await redisClient.hmset(this.userNumber, <any>storage);
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };

  getSavedInstanceSortRangeValues = async (rangeNumber: number) => {
    try {
      const storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      let rangeValues = storage.sortRange;
      const rangeArray = rangeValues.split(",");
      rangeValues = rangeArray[rangeNumber - 1];
      return rangeValues;
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };
  getSavedInstanceSortMethod = async () => {
    try {
      const storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      const sortMethod = storage.sortMethod;
      return sortMethod;
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };
  getSavedInstanceSubCategoryID = async () => {
    try {
      const storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      const sub_id = storage.subcategory_id;
      return sub_id;
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };

  setsavedInstanceItemID = async (itemId: string) => {
    try {
      let storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      storage.item_ID = itemId;
      await redisClient.hmset(this.userNumber, <any>storage);
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };
  getsavedInstanceItemID = async () => {
    try {
      const storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      const item_id = storage.item_ID;
      return item_id;
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };
  setUserID = async (user_id: string) => {
    try {
      const storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      const user_id = storage.userID;
      return user_id;
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };
  getUserID = async () => {
    try {
      const storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      const user_id = storage.userID;
      return user_id;
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };

  resetBackstackEntry = async () => {
    try {
      const storage = ((await redisClient.hgetall(
        this.userNumber
      )) as unknown) as RedisConstrains;
      storage.backstack = "";
      await redisClient.hmset(this.userNumber, <any>storage);
    } catch (error) {
      console.log(`ERROR FOR REDIS OPERATION ${error}`);
      throw error;
    }
  };
}
