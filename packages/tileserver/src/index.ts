import 'dotenv/config';
import express, { Express } from "express";
import cors from "cors";

import {tilesRouteFactory, objectsRouteFactory  } from './routes';

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());

const promise_app = Promise.all([
    tilesRouteFactory(),
    objectsRouteFactory()
  ])
  .then(([tilesRoute, objecstRoute]) => {
    app.get("/tiles/:z/:x/:y", tilesRoute);
    app.get("/objects", objecstRoute);

    app.listen(port, async () => {  
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
    return app;
  });


process.on("exit", () => {

})


module.exports = promise_app;
