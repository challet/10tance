"use client";

import { FunctionComponent, useLayoutEffect, useState } from "react";
import { EvmTorus } from "../utils/leaflet/evmWorld";
import { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import { MapContainer, Marker, ScaleControl, TileLayer, useMap, useMapEvent } from "react-leaflet";
import useSWR, { Fetcher } from "swr";
import useErc20Icons from "~~/hooks/10tance/useErc20Icons";
import type { EVMObject } from "~~/types/10tance/EVMObject";

const Home: NextPage = () => {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);

  return (
    <>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">West</div>
          <div className="stat-value">{mapBounds ? mapBounds.getWest() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">North</div>
          <div className="stat-value">{mapBounds ? mapBounds.getNorth() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">South</div>
          <div className="stat-value">{mapBounds ? mapBounds.getSouth() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">East</div>
          <div className="stat-value">{mapBounds ? mapBounds.getEast() : null}</div>
        </div>
      </div>

      <div className="hero min-h-[calc(100vh-15rem)] w-full">
        <MapContainer
          center={[0, 0]}
          zoom={0}
          minZoom={0}
          maxZoom={44}
          scrollWheelZoom={true}
          crs={EvmTorus}
          className="hero-content size-full"
        >
          <TileLayer url="http://localhost:3001/tiles/{z}/{x}/{y}.png" noWrap={false} />
          <ScaleControl />
          <MoveHandler onBoundsChange={setMapBounds} />
          {mapBounds && <Markers bounds={mapBounds} />}
        </MapContainer>
      </div>
    </>
  );
};

const MoveHandler: FunctionComponent<{ onBoundsChange: (bounds: LatLngBounds) => void }> = ({ onBoundsChange }) => {
  const map = useMap();
  useLayoutEffect(() => onBoundsChange(map.getBounds()), [map, onBoundsChange]);
  useMapEvent("move", event => onBoundsChange(event.target.getBounds()));
  return null;
};

// TODO : better fetch by area batches and throttle sequancial moves
const dataFetch: Fetcher<EVMObject[], LatLngBounds> = async bounds => {
  const response = await fetch(`http://localhost:3001/objects?bounds=${bounds.toBBoxString()}`);
  const data = await response.json();
  return data;
};

const Markers: FunctionComponent<{ bounds: LatLngBounds }> = ({ bounds }) => {
  const map = useMap();
  const { data, isLoading } = useSWR(EvmTorus.constraintsLatLngBounds(map.wrapLatLngBounds(bounds)), dataFetch, {
    fallbackData: [],
  });
  const icons = useErc20Icons(data);

  if (!isLoading && data) {
    return data.map(d => <Marker position={[d.lat, d.lng]} icon={icons[d.id]} key={d.id} />);
  } else {
    return null;
  }
};

export default Home;
