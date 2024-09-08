import { Jimp, limit255, rgbaToInt, type RGBColor } from "jimp";
import type { Coords, LatLng } from "leaflet";


// Ugly hack to be able to use leaflet withtout a browser
// Until [this PR](https://github.com/Leaflet/Leaflet/pull/9385) makes it to a release
globalThis.window = { screen: {}} as any;
globalThis.document = { documentElement: { style: {}}, createElement: () => ({}) } as any;
globalThis.navigator = { userAgent: '', platform:'' } as any;

export type pixelInfluencer = {
  color: RGBColor;
  latlng: Pick<LatLng, "lat" | "lng">;
  rawStrength: number;
}

// Async could be removed and dynamic import made static after [this PR](https://github.com/Leaflet/Leaflet/pull/9385) makes it to a release
const createImage = async (tileCoords: Coords, influencers: pixelInfluencer[], MIN_STRENGTH: number): Promise<InstanceType<typeof Jimp>> => {
  const { Point, latLng } = await import("leaflet");
  const { CoordinatesLayer, EvmTorusCRS } = await import("@10tance/map");
  
  const layer = new CoordinatesLayer(EvmTorusCRS, { mode: "hex"});
  const image = new Jimp({ width: 256, height: 256, color:'#888888ff' });
  
  for(let x = 0; x < 256; x++) {
    for(let y = 0; y < 256; y++) {
      const pixelLocation = layer.pixelInTileToLatLng(tileCoords, new Point(x,y));
      const pixelColorParameters = influencers.reduce((pixelColor, influencer: typeof influencers[number]) => {
        const distance = EvmTorusCRS.distance(latLng(influencer.latlng), pixelLocation);
        const strength = Math.log(influencer.rawStrength) / distance;

        if (strength > MIN_STRENGTH) {
          const strengthRatio = 1 - (strength / MIN_STRENGTH);
          return {
            r: pixelColor.r + strengthRatio * influencer.color.r,
            g: pixelColor.g + strengthRatio * influencer.color.g,
            b: pixelColor.b + strengthRatio * influencer.color.b,
            totalStrength: pixelColor.totalStrength + strengthRatio
          }
        } else {
          return pixelColor;
        }
      }, { r: 0, g: 0, b: 0, totalStrength: 0 });

      const pixelColor = {
        r: pixelColorParameters.r / pixelColorParameters.totalStrength,
        g: pixelColorParameters.g / pixelColorParameters.totalStrength,
        b: pixelColorParameters.b / pixelColorParameters.totalStrength
      }

      image.setPixelColor(rgbaToInt(limit255(pixelColor.r), limit255(pixelColor.g), limit255(pixelColor.b), 255), x, y);
    }
  }
  return image;
};

export default createImage;
