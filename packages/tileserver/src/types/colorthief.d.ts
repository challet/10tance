// color-thief-node.d.ts

declare module '@janishutz/colorthief' {
  type ColorThiefResult = [number, number, number];
  type input = 
    | Buffer
    | ArrayBuffer
    | Uint8Array
    | Uint8ClampedArray
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    | string;
  export function getColor( img: input, quality: number = 10 ): Promise<ColorThiefResult>;
  export function getPalette( img: input, colorCount: number = 10, quality: number = 10 ): Promise<ColorThiefResult[]>;
}




