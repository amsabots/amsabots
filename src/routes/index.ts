import express from "express";
const router = express.Router();
import { addToBackStackSession } from "../middlewares/session";
import {
  INDEX_URL_PREFIX as index_prefix,
  poolClient,
  ResultResponse,
} from "../middlewares/constants";
import { QueryResult } from "pg";

interface Category {
  id: number;
  category: string;
}

router.get(index_prefix, async (req, res) => {
  const { msisdn, action } = req.query;
  res.json({ number: msisdn, userID: req.user_id, session: req.sessionId });
});
router.get(
  `${index_prefix}category`,
  addToBackStackSession,
  async (req, res) => {
    const action: string = <string>req.query.action;
    const from: string = <string>req.query.msisdn;
    switch (parseInt(action)) {
      case 1:
        const text = "SELECT * FROM categories";
        try {
          const results = (await poolClient(text)) as QueryResult;

          let label: string = `Select category for your shopping needs
          Reply with:
          0: to go back
          menu: To Exit
          `;

          let spreadItem = "";
          const resultsArray: Category[] = results.rows;
          resultsArray.forEach((element) => {
            spreadItem = `*${element.id}*: ${element.category}\n`;
            label = label.concat(spreadItem);
          });

          let response: ResultResponse = {
            sessionId: req.sessionId,
            msisdn: <string>req.query.msisdn,
            message: label,
            statusCode: 200,
            errorMessage: null,
          };
          return res.send(response);
        } catch (error) {
          console.log(error.message);
        }
        break;
      case 0:
        return res.redirect(`${index_prefix}startsession?msisdn=${from}`);

      default:
        return res.redirect(`${index_prefix}startsession?msisdn=${from}`);

        break;
    }
  }
);

export { router as startShopping };
