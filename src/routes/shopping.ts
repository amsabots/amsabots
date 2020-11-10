import express from "express";
import { poolClient } from "../middlewares/constants";
import {
  SHOPPING_URL_PREFIX as url_prefix,
  ResultResponse,
} from "../middlewares/constants";
import {
  currentSession,
  onInitBackaction,
  addToBackStackSession,
} from "../middlewares/session";
import { QueryResult } from "pg";
import {
  PostgressQuerySyntax,
  SubCategoryResponse,
  Item,
} from "../extras/interfaces";
import * as _ from "lodash";
import { CommonUtils } from "../extras/common";
import { redisClient } from "../app";
import { PayoutGateway } from "./payout";

const router = express.Router();

router.get(
  `${url_prefix}subcategory`,
  onInitBackaction,
  addToBackStackSession,
  async (req, res) => {
    /*
     *  request parameters retrived from the request Query string
     *
     * https://hostName/api/v1/select_category?msisdn=from_Number&category=selectednumber
     *
     *Return result will be a list of subcategories belonging to the selected category from the querty string
     */
    const { msisdn, action } = req.query;
    const Sql: PostgressQuerySyntax = {
      // give the query a unique name
      name: "fetch-sub-category",
      text: "SELECT * FROM subcategory WHERE category_id = $1",
      values: [<string>action],
    };
    let message: ResultResponse;
    try {
      const queryResponse = (await poolClient(Sql)) as QueryResult;
      let createMessageBubble = "";
      if (queryResponse.rowCount > 0) {
        queryResponse.rows.forEach((element: SubCategoryResponse) => {
          createMessageBubble += `
        ${element.id}. ${element.name}`;
        });
        createMessageBubble = `Reply with an option you are interested in
      0. To go back
      menu: To exit
      ---------------`.concat(createMessageBubble);
        message = {
          statusCode: 200,
          errorMessage: null,
          message: createMessageBubble,
          sessionId: req.sessionId,
          msisdn: <string>msisdn,
        };
        return res.send(message);
      }
      message = {
        sessionId: req.sessionId,
        message: `Results not found or you provided an invalid out of range input
      0. To go back
      menu: To exit`,
        statusCode: 404,
        msisdn: <string>msisdn,
        errorMessage: "EMPTY RESPONSE:: Database returned no results",
      };
      return res.send(message);
    } catch (error) {
      throw error;
    }
  }
);
router.get(
  `${url_prefix}sort_by_method`,
  onInitBackaction,
  addToBackStackSession,
  async (req, res) => {
    const { msisdn, action } = req.query;
    const utils = new CommonUtils(<string>msisdn);
    const message: ResultResponse = {
      statusCode: 200,
      message: `Select the filter method to apply
    1. By Price
    2. By Volume/Size
    ------------
    0. To go back
    menu: To exit`,
      errorMessage: null,
      sessionId: req.sessionId,
      msisdn: <string>msisdn,
    };
    //save subcategory id from previous outbound response
    utils.setSubCategoryIDInstance(<string>action);
    return res.send(message);
  }
);

router.get(`${url_prefix}get_sort_parameters`, async (req, res) => {
  const { msisdn, action } = req.query;
  const utils = new CommonUtils(<string>msisdn);
  const subId = await utils.getSavedInstanceSubCategoryID();
  const SQL: PostgressQuerySyntax = {
    name: "fetch-return-volume-or-price-sortable",
    text: "SELECT * FROM items WHERE subcategory_id = $1 ORDER BY price ASC",
    values: [subId],
  };
  const result = (await poolClient(SQL)) as QueryResult;
  console.log(result.rows);
  const resultRows = result.rows;
  let messageContent = "";
  let counter = 1;
  let message: ResultResponse;
  switch (parseInt(<string>action)) {
    case 1:
      let sortbyPrice = _.map(resultRows, (obj: Item) => {
        if (obj.price) return Math.pow(10, Math.ceil(Math.log10(obj.price)));
      });
      sortbyPrice = _.uniq(sortbyPrice);
      //push the array to redis storage
      _.forEach(sortbyPrice, (el) => {
        messageContent += `${counter++}: Within Kshs ${el}
     `;
      });
      messageContent = "All items with Prices:\n".concat(messageContent);
      message = {
        statusCode: 200,
        message: messageContent,
        msisdn: <string>msisdn,
        sessionId: "",
        errorMessage: null,
      };
      utils.setPriceRangeToSavedInstance(sortbyPrice, "price");
      return res.send(message);

    case 2:
      let sortbySize = _.map(resultRows, (obj: Item) => {
        if (obj.size) return obj.size;
      });

      sortbySize = _.uniq(sortbySize);
      redisClient.hmset("70", { array: sortbySize.toString() });
      _.forEach(sortbySize, (arr) => {
        return (messageContent += `${counter++}: ${arr}
      `);
      });
      messageContent = "All items with Size/Volume\n".concat(messageContent);
      message = {
        statusCode: 200,
        message: messageContent,
        msisdn: <string>msisdn,
        sessionId: req.sessionId,
        errorMessage: null,
      };
      utils.setPriceRangeToSavedInstance(sortbySize, "size");
      return res.send(message);
    default:
      return res.send("redirect to backstack");
  }
});

router.get(
  `${url_prefix}get-all-items`,
  onInitBackaction,
  addToBackStackSession,
  async (req, res) => {
    const { msisdn, action } = req.query;
    const utils = new CommonUtils(<string>msisdn);
    utils.setsavedInstanceItemID(<string>action);
    const SQL: PostgressQuerySyntax = {
      name: "get-all-items-per-category",
      text: "",
      values: [],
    };
    let filterColumn = await utils.getSavedInstanceSortMethod();
    const subId = await utils.getSavedInstanceSubCategoryID();
    const sortRange = await utils.getSavedInstanceSortRangeValues(
      parseInt(<string>action)
    );
    if (filterColumn == "price") {
      SQL.text =
        "SELECT * FROM items WHERE subcategory_id = $1 AND price > $2 ORDER BY price ASC";
      SQL.values = [subId, sortRange];
      console.log(subId, sortRange);
    } else if (filterColumn == "size") {
      SQL.text =
        "SELECT * FROM items WHERE subcategory_id = $1 AND size = $2 ORDER BY size ASC";
      SQL.values = [subId, sortRange];
    }
    let message: ResultResponse;
    try {
      const sqlResponse = (await poolClient(SQL)) as QueryResult;
      if (sqlResponse.rowCount > 0) {
        let createMessageBubble = "";
        let sqlRows = sqlResponse.rows;
        _.forEach(sqlRows, (element: Item) => {
          createMessageBubble += `
        ${element.id}: ${element.name} @ *Kshs ${element.price}* - ${element.size}`;
        });
        // createMessageBubble = `Select an item and proceed to next Step
        // --------------
        // Provide reply in this format *Product-Index#quantity-you-want* i.e 1#4 will be product id-> 1, 4-> in wanted
        // --------------
        // ${createMessageBubble}`;

        message = {
          statusCode: 200,
          errorMessage: null,
          msisdn: <string>msisdn,
          message: createMessageBubble,
          sessionId: req.sessionId,
        };
        return res.send(message);
      }
      message = {
        statusCode: 404,
        sessionId: req.sessionId,
        message: `No results found, Reply with
        0. To go back`,
        msisdn: <string>msisdn,
        errorMessage: "EMPTY RESPONSE:: no results returned",
      };
      return res.send(message);
    } catch (error) {
      throw error;
    }
  }
);

export { router as shoppingRouter };
