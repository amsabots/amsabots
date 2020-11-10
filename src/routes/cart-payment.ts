import {
  PAYMENT_URL_PREFIX as url_prefix,
  ResultResponse,
  SHOPPING_URL_PREFIX as url_shopping_prefix,
} from "../middlewares/constants";
import express from "express";
import * as _ from "lodash";
import { poolClient } from "../middlewares/constants";
import { PostgressQuerySyntax } from "../extras/interfaces";
import { QueryResult } from "pg";
import { CommonUtils } from "../extras/common";

const router = express.Router();
router.get(`${url_prefix}`, (req, res) => {
  let { action, msisdn } = req.query;
  action = <string>action;
  const splitAction = action.split("#");
  const product_id = +splitAction[0];
  const quantity = +splitAction[1];
  if (Boolean(product_id) && Boolean(quantity)) {
    res.send("is a number");
  } else {
    res.send("invalid input given");
  }
});
router.post(`${url_prefix}add_to_cart`, async (req, res) => {
  let { msisdn, action } = req.query;
  action = <string>action;
  let message: ResultResponse;
  if (action.includes("#")) {
    const actionQueryValues: string[] = action.split(`#`);
    const product_id = +actionQueryValues[0];
    const quantity = +actionQueryValues[1];
    if (Boolean(product_id) && Boolean(quantity)) {
      const SQL: PostgressQuerySyntax = {
        name: "save the selected product id",
        text:
          "INSERT INTO cart(user_id, product_id, quantity) VALUES($1,$2,$3) RETURNING *",
        values: [req.user_id, product_id, quantity],
      };

      try {
        const sqlResponse = (await poolClient(SQL)) as QueryResult;
        console.log(sqlResponse.rows[0]);
        message = {
          statusCode: 200,
          sessionId: "",
          errorMessage: null,
          msisdn: <string>msisdn,
          message: `successfully added ${quantity} item(s) to your cart, Reply with:
          0. To continue shopping
          1. To proceed to checkout`,
        };
        return res.send(sqlResponse.rows[0]);
      } catch (error) {
        throw error;
      }
    }
  }
  /*
   *
   * return the message with message of invalid input format
   * The message should be int format product#quantity
   * quantity should be strictly a number
   *
   * redirect to shopping url with sort value and subcategory number
   *
   * from redis get
   * - sort value
   * - subcategory number
   * - sorting column
   *
   */
  message = {
    statusCode: 404,
    message:
      "Please provide valid input in the form product#number-of-items i.e 1#2 will be interpreted as item number one, two items needed",
    errorMessage: "Invalid input format",
    sessionId: "req.sessionId",
    msisdn: <string>msisdn,
  };
  return res.send(message);
});

router.get(`${url_prefix}proceed-to-checkout`, async (req, res) => {
  const { msisdn, action } = req.query;
  let userInput = +(<string>action);
  const utils = new CommonUtils(<string>msisdn);
  const itemID = await utils.getsavedInstanceItemID();
  if (Boolean(userInput)) {
    if (userInput === 0) {
      return res.redirect(
        `${url_shopping_prefix}get-all-items?msisdn=${msisdn}&action=${itemID}`
      );
    } else if (userInput === 1) {
      return res.send("redirect to checkout");
    }
    /*
     * redirect to checkout section
     *
     */
  }
  return res.redirect(
    `${url_shopping_prefix}get-all-items?msisdn=${msisdn}&action=${itemID}`
  );
});

export { router as cartPaymentSystem };
