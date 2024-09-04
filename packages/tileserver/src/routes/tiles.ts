import { Jimp, limit255, rgbaToInt } from "jimp";
import { Request, Response } from "express";
import { initModel } from '../common/sequelize';
import { LatLng, type Coords } from "leaflet";
import { Sequelize, Op } from "sequelize";
import { getColor, type RGBColor } from "colorthief";
import { FindAttributeOptions } from "sequelize/lib/model";
import { getFile, saveFile, sendFile, USE_BLOB_STORAGE, type fileType } from "../services/files";

// Ugly hack to be able to use leaflet withtout a browser
// Until [this PR](https://github.com/Leaflet/Leaflet/pull/9385) makes it to a release
globalThis.window = { screen: {}} as any;
globalThis.document = { documentElement: { style: {}}, createElement: () => ({}) } as any;
globalThis.navigator = { userAgent: '', platform:'' } as any;

const routeFactory = async (db: Sequelize) => {
  // They will be able to be statically imported after [this PR](https://github.com/Leaflet/Leaflet/pull/9385) makes it to a release
  const { Point, LatLng } = await import("leaflet");
  const { CoordinatesLayer, EvmTorus } = await import("../common/index.js");
  
  const EVMObject = initModel(db);
  const layer = new CoordinatesLayer(EvmTorus, "hex");

  return async (req: Request, res: Response) => {
    const {x, y, z}  = {
      x: parseInt(req.params.x),
      y: parseInt(req.params.y),
      z: parseInt(req.params.z)
    };

    const fileDir = USE_BLOB_STORAGE ? `tiles/${z}` : `${process.cwd()}/files/${z}`;
    const filePath = `${fileDir}/${x}-${y}.png`;

    let file: fileType | null = await getFile(filePath, fileDir);

    if (file === null) {
      // get the geograohic bounds of the requested tile
      const coords: Coords = new Point(x,y) as Coords;
      coords.z = z; 
      const bounds = layer.tileCoordsToBoundsWithoutAMap(coords);
      const tileGeom = `POLYGON((${bounds.getEast()} ${bounds.getSouth()}, ${bounds.getEast()} ${bounds.getNorth()}, ${bounds.getWest()} ${bounds.getNorth()}, ${bounds.getWest()} ${bounds.getSouth()}, ${bounds.getEast()} ${bounds.getSouth()}))`;

      const MIN_STRENGTH = 1 / Math.pow(2, 46);

      const attributes = [
        // TODO inpect why the binary data cannot be raw fetched
        // without the convert_from, it looks like something (postgre, sequelize ?) is converting it to integer representation
        [db.fn('convert_from', db.col('id'), 'utf8'), 'id'],
        [db.literal('latlng::POINT'), 'latlng'],
        'meta'
      ] as FindAttributeOptions;
      const where = [
        db.literal("meta->'circulating_market_cap' IS NOT NULL"),
        db.literal("(meta->>'circulating_market_cap')::float != 0"),
        db.literal("meta->'icon_url' IS NOT NULL")
      ];

      const innerTileQuery = EVMObject.findAll({
        attributes,
        where: {
          [Op.and]: [
            ...where,
            // inside the tile
            db.literal("ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))")
          ],
        },
        order: [
          [db.literal("(meta->>'circulating_market_cap')::float"), "DESC"]
        ],
        bind: { tileGeom },
        limit: 30
      });

      const outerTileQuery = await EVMObject.findAll({
        attributes,
        where: {
          [Op.and]: [
            ...where,
            // outside the tile
            db.literal("NOT ST_CoveredBy(latlng, ST_GeomFromText($tileGeom))"),
            // and with influence able to reach it
            db.literal("LOG((meta->>'circulating_market_cap')::float) / ST_Distance(latlng, ST_GeomFromText($tileGeom)) > $MIN_STRENGTH")
          ],
        },
        order: [
          [db.literal("LOG((meta->>'circulating_market_cap')::float) / ST_Distance(latlng, ST_GeomFromText($tileGeom))"), "DESC"]
        ],
        bind: { tileGeom, MIN_STRENGTH },
        limit: 150
      });

      const [innerTileData, outerTileData] = await Promise.all([innerTileQuery, outerTileQuery]);
      const data = innerTileData.concat(outerTileData);
      
      // prepare the data
      const influencers = await Promise.all(data.map(async (d): Promise<{color: RGBColor, latlng: LatLng, rawStrength: number}> => {
        let color;
        try {
          color = await getColor(d.meta.icon_url!);
        } catch(e) {
          // can happen for "webp" images not supported by node-pixels
          color = null;
        }
        return {
          color: color ?? [255,255,255],
          latlng: new LatLng(d.latlng.y, d.latlng.x),
          rawStrength: d.meta.circulating_market_cap!
        };
      }));

      //create the image
      const image = new Jimp({ width: 256, height: 256, color:'#ffffffff' });
      for(let x = 0; x < 256; x++) {
        for(let y = 0; y < 256; y++) {
          const pixelLocation = layer.pixelInTileToLatLng(coords, new Point(x,y));
          const pixelColorParameters = influencers.reduce((pixelColor, influencer: typeof influencers[number]) => {
            const distance = EvmTorus.distance(influencer.latlng, pixelLocation);
            const strength = Math.log(influencer.rawStrength) / distance;

            if (strength > MIN_STRENGTH) {
              return {
                r: pixelColor.r + strength * influencer.color[0],
                g: pixelColor.g + strength * influencer.color[1],
                b: pixelColor.b + strength * influencer.color[2],
                totalStrength: pixelColor.totalStrength + strength
              }
            } else {
              return pixelColor;
            }
          }, { r: 0, g: 0, b: 0, totalStrength: 0});

          const pixelColor = {
            r: pixelColorParameters.r / pixelColorParameters.totalStrength,
            g: pixelColorParameters.g / pixelColorParameters.totalStrength,
            b: pixelColorParameters.b / pixelColorParameters.totalStrength
          }

          image.setPixelColor(rgbaToInt(limit255(pixelColor.r), limit255(pixelColor.g), limit255(pixelColor.b), 255), x, y);
        }
      }
      
      // save it 
      const buffer = await image.getBuffer("image/png");
      file = await saveFile(buffer, filePath, fileDir);
    }
    // send it
    sendFile(file, res);
  }

}

export default routeFactory;