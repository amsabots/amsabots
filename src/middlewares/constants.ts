import { Pool } from "pg";
export const INDEX_URL_PREFIX = "/index/api/v1/",
  SHOPPING_URL_PREFIX = "/shopping/api/v1/",
  PAYMENT_URL_PREFIX = "/payment/api/v1/",
  PAYOUT_URL_GATEWAY = "/payout/api/v1/";

const pool = new Pool({
  user: "postgres",
  password: "5426",
  host: "localhost",
  database: "amsabots",
});

const DB = (query: any) => {
  return new Promise((resolve, reject) => {
    pool.connect((err, client, done) => {
      if (err) return reject(err);
      client.query(query, (err, result) => {
        done();
        if (err) return reject(err);
        resolve(result);
      });
    });
  });
};

export interface ResultResponse {
  sessionId: string | null;
  message: string | null;
  statusCode: number | null;
  msisdn: string | null;
  errorMessage: string | null;
}
export { DB as poolClient };
