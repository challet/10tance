import 'dotenv/config';
import express, { Express } from "express";
import cors from "cors";

import {tilesRoute, objectsRoute, tileBasedMiddlewareFactory} from './routes';

const app: Express = express();
const port = process.env.PORT || 3001;

const ALLOWED_ORIGIN = (process.env.CORS_ORIGIN) ? new RegExp(process.env.CORS_ORIGIN) : false;

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: "GET,HEAD,OPTIONS"
}));

const promise_app = tileBasedMiddlewareFactory()
  .then((tileBasedMiddleware) => {
    app.get("/tiles/:x\::y\::z", tileBasedMiddleware, tilesRoute);
    app.get("/objects/:x\::y\::z", tileBasedMiddleware, objectsRoute);

    app.listen(port, async () => {  
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
    return app;
  });

process.on("exit", () => {
  // TODO close db;
})

module.exports = promise_app;