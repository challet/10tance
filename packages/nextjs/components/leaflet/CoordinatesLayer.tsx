import dynamic from "next/dynamic";
import {
  type LayerProps,
  createElementObject,
  createTileLayerComponent,
  updateGridLayer,
  withPane,
} from "@react-leaflet/core";
import type { CRS } from "leaflet";
import type { CoordinatesLayerOptions, CoordinatesLayerType } from "~~/utils/leaflet/evmWorld";

export interface CoordinatesLayerProps extends CoordinatesLayerOptions, LayerProps {
  crs: CRS;
}

async function factory() {
  const { CoordinatesLayer: LeafletCoordinatesLayer } = await import("~~/utils/leaflet/evmWorld");

  const CoordinatesLayer = createTileLayerComponent<CoordinatesLayerType, CoordinatesLayerProps>(
    function createTileLayer({ crs, ...options }, context) {
      const layer = new LeafletCoordinatesLayer(crs, withPane(options, context));
      return createElementObject<CoordinatesLayerType>(layer, context);
    },
    function updateTileLayer(layer, props, prevProps) {
      updateGridLayer(layer, props, prevProps);
    },
  );

  return CoordinatesLayer;
}

export default dynamic(factory, { ssr: false });
