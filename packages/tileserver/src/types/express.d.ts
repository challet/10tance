import type { tileData } from "../routes/tileBasedMiddleware";

declare global {
  declare namespace Express {
    interface Locals {
      tile: tileData;
    }
  }
}