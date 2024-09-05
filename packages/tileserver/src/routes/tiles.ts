import { Request, Response } from "express";
import initDb from '../common/sequelize';
import { Op, type FindAttributeOptions, type ModelCtor  } from "sequelize";
import { getColor } from "colorthief";
import File from "../services/files";
import type { EVMObjectType } from "../common/sequelize/models/EVMObject";
import createImage, { type pixelInfluencer } from "../services/image";

const tilesRoute = async (req: Request, res: Response) => {
  const { x, y, z } = res.locals.tile.coords;
  const file = await File.init(`tiles/${z}`, `${x}-${y}.png`);

  if (!file.exists) {
    const db = await initDb();
    const EVMObject = db.models.EVMObject as EVMObjectType;

    // TODO should it vary with the zoom level ?
    const MIN_STRENGTH = 1 / Math.pow(2, 46);

    // get the influencers object of the tile
    const [innerTileData, outerTileData] = await Promise.all([
      EVMObject.findAllInfluencersInTile(res.locals.tile.bounds),
      EVMObject.findAllInfluencersOffTile(res.locals.tile.bounds, MIN_STRENGTH),
    ]);
    const data = innerTileData.concat(outerTileData) ;
    
    // prepare the data
    const influencers = await Promise.all(data.map(async (d): Promise<pixelInfluencer> => {
      let color;
      // TODO color pickcing could be done once and stored in the db
      try {
        color = await getColor(d.meta.icon_url!);
      } catch(e) {
        // can happen for "webp" images not supported by node-pixels
        color = null;
      }
      return {
        color: color != null ? { r: color[0], g: color[1], b: color[2] } : { r: 255, g: 255, b: 255 },
        latlng: {lat: d.latlng.y, lng: d.latlng.x},
        rawStrength: d.meta.circulating_market_cap!
      };
    }));

    // create the image and save it 
    const image = await createImage(res.locals.tile.coords, influencers, MIN_STRENGTH);
    await file.save(await image.getBuffer("image/png"));
  }
  file.sendToResponse(res.type("image/png"));
}

export default tilesRoute;
