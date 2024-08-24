import { FunctionComponent, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { Coords, LeafletEvent, TileEvent } from "leaflet";
import {
  LayersControl,
  MapContainer,
  Marker,
  ScaleControl,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvent,
} from "react-leaflet";
import CoordinatesLayerComponent from "~~/components/leaflet/CoordinatesLayer";
import useErc20Icons from "~~/hooks/10tance/useErc20Icons";
import useRetrieveDisplayedObjects from "~~/hooks/10tance/useRetrieveDisplayedObjects";
import { type tileKey, useGlobalState } from "~~/services/store/store";
import { EvmTorus, ISO_ZOOM } from "~~/utils/leaflet/evmWorld";

// copied from GridLayer._tileCoordsToKey since the instance created by the map is not easily reachable
const tileCoordsTokey = (coords: Coords): tileKey => `${coords.x}:${coords.y}:${coords.z}`;

const Map: FunctionComponent = () => {
  const addActiveTile = useGlobalState(state => state.addActiveTile);
  const removeActiveTile = useGlobalState(state => state.removeActiveTile);
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

  return (
    <MapContainer
      center={[0, 0]} // immutable, it will only be used as the intial value. See <MoveTrigger /> component to handle changes
      zoom={2}
      minZoom={1}
      maxZoom={ISO_ZOOM}
      scrollWheelZoom={true}
      crs={EvmTorus}
      className="hero-content size-full"
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
          <CoordinatesLayerComponent crs={EvmTorus} noWrap={false} mode="hex" />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ScaleControl />
      <MoveHandler />
      ``
      <MoveTrigger />
      <EvmMarkers />
    </MapContainer>
  );
};

// store the bounds coordinates when the map move
const MoveHandler: FunctionComponent = () => {
  const map = useMap();
  const setMapBounds = useGlobalState(state => state.setMapBounds);
  useLayoutEffect(() => setMapBounds(map.getBounds()), [map, setMapBounds]); // call it once at first render
  useMapEvent("move", event => setMapBounds(event.target.getBounds()));
  return null;
};

// reacts to a change in the "goingTo" state
const MoveTrigger: FunctionComponent = () => {
  const map = useMap();
  const goingTo = useGlobalState(state => state.map.goingTo);
  useEffect(() => {
    map.setView(goingTo);
  }, [goingTo, map]);
  return null;
};

// load objects and display them
const EvmMarkers: FunctionComponent = () => {
  const map = useMap();
  const setMapTileLayerInstance = useGlobalState(state => state.setMapTileLayerInstance);
  useEffect(() => setMapTileLayerInstance(map), [map, setMapTileLayerInstance]);

  const getIcon = useErc20Icons();
  const setSelectedObject = useGlobalState(state => state.setSelectedObject);

  const data = useRetrieveDisplayedObjects();

  const eventHandlers = useMemo(
    () => ({
      click(event: LeafletEvent) {
        setSelectedObject(event.target.options["data-data"]);
      },
    }),
    [setSelectedObject],
  );

  return data.map(d => (
    <Marker position={[d.lat, d.lng]} icon={getIcon(d.icon_url)} key={d.id} data-data={d} eventHandlers={eventHandlers}>
      <Tooltip>{d.name}</Tooltip>
    </Marker>
  ));
};

export default Map;
