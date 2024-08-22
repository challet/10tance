import { FunctionComponent, useEffect, useLayoutEffect, useMemo } from "react";
import { LatLng, LatLngBounds, LeafletEvent } from "leaflet";
import { LayersControl, MapContainer, Marker, ScaleControl, TileLayer, useMap, useMapEvent } from "react-leaflet";
import useSWR, { Fetcher } from "swr";
import CoordinatesLayer from "~~/components/leaflet/CoordinatesLayer";
import useErc20Icons from "~~/hooks/10tance/useErc20Icons";
import { useGlobalState } from "~~/services/store/store";
import type { EVMObject } from "~~/types/10tance/EVMObject";
import { EvmTorus, ISO_ZOOM } from "~~/utils/leaflet/evmWorld";

const Map: FunctionComponent = () => {
  const setMapBounds = useGlobalState(state => state.setMapBounds);
  const setSelectedObject = useGlobalState(state => state.setSelectedObject);
  const goingTo = useGlobalState(state => state.map.goingTo);
  const mapBounds = useGlobalState(state => state.map.bounds);

  return (
    <MapContainer
      center={goingTo} // immutable, it will only be used as the intial value. See <MoveTrigger /> component to handle changes
      zoom={1}
      minZoom={0}
      maxZoom={ISO_ZOOM}
      scrollWheelZoom={true}
      crs={EvmTorus}
      className="hero-content size-full"
    >
      <TileLayer url="http://localhost:3001/tiles/{z}/{x}/{y}.png" noWrap={false} />
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Integer coordinates" checked={false}>
          <CoordinatesLayer crs={EvmTorus} noWrap={false} mode="int" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Hexadecimal coordinates" checked={true}>
          <CoordinatesLayer crs={EvmTorus} noWrap={false} mode="hex" />
        </LayersControl.BaseLayer>
      </LayersControl>
      <ScaleControl />
      <MoveHandler onBoundsChange={setMapBounds} />
      <MoveTrigger goto={goingTo} />
      {mapBounds && <Markers bounds={mapBounds} onSelect={setSelectedObject} />}
    </MapContainer>
  );
};

const MoveHandler: FunctionComponent<{ onBoundsChange: (bounds: LatLngBounds) => void }> = ({ onBoundsChange }) => {
  const map = useMap();
  useLayoutEffect(() => onBoundsChange(map.getBounds()), [map, onBoundsChange]);
  useMapEvent("move", event => onBoundsChange(event.target.getBounds()));
  return null;
};

const MoveTrigger: FunctionComponent<{ goto: LatLng }> = ({ goto }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(goto);
  }, [goto, map]);
  return null;
};

// TODO : better fetch by area batches and throttle sequantial moves
const dataFetch: Fetcher<EVMObject[], [LatLngBounds, string]> = async ([bounds]) => {
  const response = await fetch(`http://localhost:3001/objects?bounds=${bounds.toBBoxString()}`);
  const data = await response.json();
  return data;
};

const Markers: FunctionComponent<{ bounds: LatLngBounds; onSelect: (data: EVMObject) => void }> = ({
  bounds,
  onSelect,
}) => {
  const map = useMap();
  const { data } = useSWR([EvmTorus.constraintsLatLngBounds(map.wrapLatLngBounds(bounds)), "map-data"], dataFetch, {
    fallbackData: [],
  });
  const icons = useErc20Icons(data);
  const eventHandlers = useMemo(
    () => ({
      click(event: LeafletEvent) {
        onSelect(event.target.options["data-data"]);
      },
    }),
    [onSelect],
  );

  return data.map(d => (
    <Marker position={[d.lat, d.lng]} icon={icons[d.id]} key={d.id} data-data={d} eventHandlers={eventHandlers} />
  ));
};

export default Map;
