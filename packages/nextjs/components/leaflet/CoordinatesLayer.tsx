import {
  LayerProps,
  createElementObject,
  createTileLayerComponent,
  updateGridLayer,
  withPane,
} from "@react-leaflet/core";
import { CRS, GridLayerOptions } from "leaflet";
import {
  CoordinatesLayerMode,
  CoordinatesLayerType,
  CoordinatesLayer as LeafletCoordinatesLayer,
} from "~~/utils/leaflet/evmWorld";

export interface CoordinatesLayerProps extends GridLayerOptions, LayerProps {
  crs: CRS;
  mode: CoordinatesLayerMode;
}

const CoordinatesLayer = createTileLayerComponent<CoordinatesLayerType, CoordinatesLayerProps>(
  function createTileLayer({ crs, mode, ...options }, context) {
    const layer = new LeafletCoordinatesLayer(crs, mode, withPane(options, context));
    return createElementObject<CoordinatesLayerType>(layer, context);
  },
  function updateTileLayer(layer, props, prevProps) {
    updateGridLayer(layer, props, prevProps);
  },
);

export default CoordinatesLayer;
