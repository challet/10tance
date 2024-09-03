// colorthief.d.ts

declare module 'colorthief' {
  import type getPixels from "get-pixels";
  // Colorthief (node verions) uses get-pixels to load the image
  type imgArg = Parameters<typeof getPixels>[0];
  export type RGBColor = [number, number, number];
  export function getColor(
    img: imgArg,
    quality: number = 10
  ): Promise<RGBColor | null>;
  export function getPalette(
    img: imgArg,
    colorCount: number = 10,
    quality: number = 10
  ): Promise<RGBColor[] | null>;
}
