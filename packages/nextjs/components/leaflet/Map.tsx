"use client";

import { FunctionComponent, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { CoordinateFormatterMode } from "@10tance/map";
import type { Coords, LeafletEvent, TileEvent } from "leaflet";
import CoordinatesLayerComponent from "~~/components/leaflet/CoordinatesLayerComponent";
import useRetrieveDisplayedObjects from "~~/hooks/10tance/useRetrieveDisplayedObjects";
import { type tileKey, useGlobalState } from "~~/services/store/store";

// copied from GridLayer._tileCoordsToKey since the instance created by the map is not easily reachable
const tileCoordsTokey = (coords: Coords): tileKey => `${coords.x}:${coords.y}:${coords.z}`;

const TILES_URL = `${process.env.NEXT_PUBLIC_TILESERVER_HOST}/tiles/{x}:{y}:{z}`;
const COORDINATES_LAYER_CLASSNAMES = {
  layer: "text-slate-400/80 text-center text-[0.7em]/[1.2em] tabular-nums font-mono select-none",
  tile: "border-t border-l border-slate-400/50",
  latAxis: "absolute inset-x-0 top-0",
  lngAxis: "absolute inset-y-0 left-0 [writing-mode:sideways-lr]",
};

async function factory() {
  const { EvmTorusCRS, ISO_ZOOM } = await import("@10tance/map");
  const getIcon = (await import("~~/utils/leaflet/getIcon")).default;
  const { Marker, Tooltip, LayersControl, LayerGroup, MapContainer, ScaleControl, TileLayer, useMap, useMapEvent } =
    await import("react-leaflet");

  const Map: FunctionComponent<{ onChangeCoordinatesMode: (mode: CoordinateFormatterMode) => void }> = ({
    onChangeCoordinatesMode,
  }) => {
    const addActiveTile = useGlobalState(state => state.addActiveTile);
    const removeActiveTile = useGlobalState(state => state.removeActiveTile);
    const setMapTileLayerInstance = useGlobalState(state => state.setMapTileLayerInstance);
    const onTileLoad = useCallback(
      (event: TileEvent) => {
        addActiveTile(tileCoordsTokey(event.coords));
      },
      [addActiveTile],
    );
    const onTileUnload = useCallback(
      (event: TileEvent) => {
        removeActiveTile(tileCoordsTokey(event.coords));
      },
      [removeActiveTile],
    );
    const onLayerAdded = useCallback(
      (event: LeafletEvent) => {
        setMapTileLayerInstance(event.target);
        onChangeCoordinatesMode(event.target.options.mode);
      },
      [setMapTileLayerInstance, onChangeCoordinatesMode],
    );

    return (
      <MapContainer
        center={[0, 0]} // immutable, it will only be used as the intial value. See <MoveTrigger /> component to handle changes
        zoom={2}
        minZoom={0}
        maxZoom={ISO_ZOOM}
        scrollWheelZoom={true}
        crs={EvmTorusCRS}
        className="size-full"
      >
        <TileLayer
          url={TILES_URL}
          noWrap={false}
          eventHandlers={{ tileloadstart: onTileLoad, tileunload: onTileUnload }}
          minZoom={0}
          maxZoom={ISO_ZOOM}
        />
        <LayersControl position="topright">
          <LayersControl.Overlay name="ERC20 Contracts" checked={true}>
            <LayerGroup>
              <EvmMarkers />
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Hexadecimal coordinates" checked={true}>
            <CoordinatesLayerComponent
              crs={EvmTorusCRS}
              noWrap={false}
              mode="hex"
              classNames={COORDINATES_LAYER_CLASSNAMES}
              eventHandlers={{ add: onLayerAdded }}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Integer coordinates" checked={false}>
            <CoordinatesLayerComponent
              crs={EvmTorusCRS}
              noWrap={false}
              mode="int"
              classNames={COORDINATES_LAYER_CLASSNAMES}
              eventHandlers={{ add: onLayerAdded }}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <ScaleControl />
        <MoveHandler />
      </MapContainer>
    );
  };

  // reacts to and control changes in the map position
  const MoveHandler: FunctionComponent = () => {
    const map = useMap();
    const goingTo = useGlobalState(state => state.map.goingTo);
    const setMapToGoTo = useGlobalState(state => state.setMapToGoTo);
    const setSelectedObject = useGlobalState(state => state.setSelectedObject);

    // reset states when the user moves the map
    // it shouldn't fire on the change through "goingTo" state below, which uses the "noMoveStart" option
    useMapEvent("movestart", () => {
      setMapToGoTo(null);
      setSelectedObject(null);
    });
    // move the map when it has been requested so
    useEffect(() => {
      if (goingTo !== null) {
        map.panTo(goingTo, { noMoveStart: true });
      }
    }, [goingTo, map]);
    return null;
  };

  // load objects and display them
  const EvmMarkers: FunctionComponent = () => {
    const data = useRetrieveDisplayedObjects();
    const selectedObjectId = useGlobalState(state => state.selectedObject);
    const setSelectedObject = useGlobalState(state => state.setSelectedObject);
    const eventHandlers = useMemo(
      () => ({
        click(event: LeafletEvent) {
          setSelectedObject(event.target.options["data-data"]);
        },
      }),
      [setSelectedObject],
    );

    return data.map(d => (
      <Marker
        position={[d.lat, d.lng]}
        icon={getIcon(d.icon_url, d.id === selectedObjectId)}
        key={d.id}
        data-data={d.id}
        eventHandlers={eventHandlers}
        zIndexOffset={d.id === selectedObjectId ? 1000 : 0}
        autoPanOnFocus={false}
      >
        <Tooltip>{d.symbol}</Tooltip>
      </Marker>
    ));
  };

  return Map;
}

export default dynamic(factory, { ssr: false });
