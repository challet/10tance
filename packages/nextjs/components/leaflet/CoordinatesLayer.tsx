import dynamic from "next/dynamic";
import {
  type LayerProps,
  createElementObject,
  createTileLayerComponent,
  updateGridLayer,
  withPane,
} from "@react-leaflet/core";
import type { CoordinatesLayerMode, CoordinatesLayerOptions, CoordinatesLayerType } from "common/leaflet/evmWorld";
import type { CRS } from "leaflet";

export interface CoordinatesLayerProps extends CoordinatesLayerOptions, LayerProps {
  crs: CRS;
  mode: CoordinatesLayerMode;
}

async function factory() {
  const { CoordinatesLayer: LeafletCoordinatesLayer } = await import("common/leaflet/evmWorld");

  const CoordinatesLayer = createTileLayerComponent<CoordinatesLayerType, CoordinatesLayerProps>(
    function createTileLayer({ crs, mode, ...options }, context) {
      const layer = new LeafletCoordinatesLayer(crs, mode, withPane(options, context));
      return createElementObject<CoordinatesLayerType>(layer, context);
    },
    function updateTileLayer(layer, props, prevProps) {
      updateGridLayer(layer, props, prevProps);
    },
  );

  return CoordinatesLayer;
}

export default dynamic(factory, { ssr: false });
