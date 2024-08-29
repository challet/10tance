"use client";

import { FunctionComponent, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Coords, LeafletEvent, TileEvent } from "leaflet";
import CoordinatesLayerComponent from "~~/components/leaflet/CoordinatesLayer";
import useRetrieveDisplayedObjects from "~~/hooks/10tance/useRetrieveDisplayedObjects";
import { type tileKey, useGlobalState } from "~~/services/store/store";

// copied from GridLayer._tileCoordsToKey since the instance created by the map is not easily reachable
const tileCoordsTokey = (coords: Coords): tileKey => `${coords.x}:${coords.y}:${coords.z}`;

async function factory() {
  const { EvmTorus, ISO_ZOOM } = await import("~~/utils/leaflet/evmWorld");
  const getIcon = (await import("~~/utils/leaflet/getIcon")).default;
  const { Marker, Tooltip, LayersControl, MapContainer, ScaleControl, TileLayer, useMap, useMapEvent } = await import(
    "react-leaflet"
  );

  const Map: FunctionComponent = () => {
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
      },
      [setMapTileLayerInstance],
    );

    return (
      <MapContainer
        center={[0, 0]} // immutable, it will only be used as the intial value. See <MoveTrigger /> component to handle changes
        zoom={2}
        minZoom={1}
        maxZoom={ISO_ZOOM}
        scrollWheelZoom={true}
        crs={EvmTorus}
        className="size-full"
      >
        <TileLayer
          url="http://localhost:3001/tiles/{z}/{x}/{y}.png"
          noWrap={true}
          eventHandlers={{ tileloadstart: onTileLoad, tileunload: onTileUnload }}
        />
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Integer coordinates" checked={false}>
            <CoordinatesLayerComponent crs={EvmTorus} noWrap={false} mode="int" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Hexadecimal coordinates" checked={true}>
            <CoordinatesLayerComponent crs={EvmTorus} noWrap={false} mode="hex" eventHandlers={{ add: onLayerAdded }} />
          </LayersControl.BaseLayer>
        </LayersControl>
        <ScaleControl />
        <MoveHandler />
        <EvmMarkers />
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
    // it shouldn't fire on thechange through "goingTo" state below, which uses the "noMoveStart" option
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
    /*
    const setMapTileLayerInstance = useGlobalState(state => state.setMapTileLayerInstance);
    useMapEvent("layeradd", (event) => {
      console.log(event);
      setMapTileLayerInstance(event.layer);
    });
    */
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
      >
        <Tooltip>{d.symbol}</Tooltip>
      </Marker>
    ));
  };

  return Map;
}

export default dynamic(factory, { ssr: false });
