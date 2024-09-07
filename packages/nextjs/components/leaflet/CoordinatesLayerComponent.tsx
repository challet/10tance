import dynamic from "next/dynamic";
import type { CoordinatesLayerOptions, CoordinatesLayerType } from "@10tance/map";
import {
  type LayerProps,
  createElementObject,
  createTileLayerComponent,
  updateGridLayer,
  withPane,
} from "@react-leaflet/core";
import type { CRS } from "leaflet";

export interface CoordinatesLayerComponentProps extends CoordinatesLayerOptions, LayerProps {
  crs: CRS;
}

async function factory() {
  const { CoordinatesLayer } = await import("@10tance/map");

  const CoordinatesLayerComponent = createTileLayerComponent<CoordinatesLayerType, CoordinatesLayerComponentProps>(
    function createTileLayer({ crs, ...options }, context) {
      const layer = new CoordinatesLayer(crs, withPane(options, context));
      return createElementObject<CoordinatesLayerType>(layer, context);
    },
    function updateTileLayer(layer, props, prevProps) {
      updateGridLayer(layer, props, prevProps);
    },
  );

  return CoordinatesLayerComponent;
}

export default dynamic(factory, { ssr: false });
