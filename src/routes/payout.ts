import express from "express";
import {
  PAYOUT_URL_GATEWAY as url_prefix,
  INDEX_URL_PREFIX as index_url,
  poolClient,
  ResultResponse,
} from "../middlewares/constants";
import { Item, PostgressQuerySyntax } from "../extras/interfaces";
import { Message } from "../middlewares/response";
import { QueryResult } from "pg";
import * as _ from "lodash";

const router = express.Router();

router.get(url_prefix, (req, res) => {
  return res.send("Payout gateway connected successfully");
});

router.get(`${url_prefix}cart-checkout`, async (req, res) => {
  const { msisdn, action } = req.query;
  let message: ResultResponse;
  const SQL: PostgressQuerySyntax = {
    name: "unpaid-user-products-from-db",
    text: "SELECT * FROM cart WHERE user_id=$1 AND isPaid=$2",
    values: [req.user_id, false],
  };
  try {
    const sqlResponse = (await poolClient(SQL)) as QueryResult;
    if (sqlResponse.rowCount > 0) {
      let itemsMessage = "";
      let subTotal = 0;
      _.forEach(sqlResponse.rows, (element: Item) => {
        itemsMessage += `${element.id}: ${element.name} @ Kshs${element.price}
        `;
        subTotal += +element.price;
      });
      itemsMessage = `yes: To confirm Purchase
      no: To cancel purchase
      - Reply with relevant index number to remove item from cart
      `.concat(itemsMessage).concat(`------------------
      *Cart Subtotal: ${subTotal}*`);

      message = {
        errorMessage: null,
        statusCode: 200,
        sessionId: "",
        msisdn: <string>msisdn,
        message: itemsMessage,
      };
      return res.send(message);
    }
    return res.redirect(
      `/index/api/v1/category?msisdn=${<string>msisdn}&action=1`
    );
  } catch (error) {
    throw error;
  }
});
router.get(`${url_prefix}confirm-checkout`, async (req, res) => {
  let { msisdn, action } = req.query;
  action = <string>action;
  if (action.toLowerCase() === "yes") {
    /*
     *
     *Initialise Payment microservice via a event bus action
     */
  } else if (action.toLowerCase() == "no") {
    return res.redirect(
      `${index_url}category?msisdn=${<string>msisdn}&action=1`
    );
  } else {
    let actionDelete = +action;
    if (Boolean(actionDelete)) {
      const SQL: PostgressQuerySyntax = {
        name: "delete-items-added-to-cart",
        text: "DELETE FROM cart WHERE product_id =$1",
        values: [actionDelete],
      };

      try {
        await poolClient(SQL);
        return res.redirect(
          `${url_prefix}cart-checkout?msisdn=${<string>msisdn}&action=1`
        );
      } catch (error) {
        throw error;
      }
    } else {
      return res.redirect(`${index_url}startsession`);
    }
  }
});

export { router as PayoutGateway };
