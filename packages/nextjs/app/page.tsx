"use client";

import { FunctionComponent, useLayoutEffect, useState } from "react";
import { EvmTorus } from "../utils/leaflet/evmWorld";
import { Icon, LatLngBounds } from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import { MapContainer, Marker, ScaleControl, TileLayer, useMap, useMapEvent } from "react-leaflet";
import useSWR, { Fetcher } from "swr";

const icon = new Icon.Default({
  iconUrl: iconUrl.src,
  iconRetinaUrl: iconRetinaUrl.src,
  shadowUrl: shadowUrl.src,
});

interface EVMObject {
  id: string;
  lat: number;
  lng: number;
}

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

// TODO : better fetch by area batches
const dataFetch: Fetcher<EVMObject[], LatLngBounds> = async bounds => {
  const response = await fetch(`http://localhost:3001/objects?bounds=${bounds.toBBoxString()}`);
  const data = await response.json();
  return data;
};

const Markers: FunctionComponent<{ bounds: LatLngBounds }> = ({ bounds }) => {
  const map = useMap();
  const { data, isLoading } = useSWR(EvmTorus.constraintsLatLngBounds(map.wrapLatLngBounds(bounds)), dataFetch);

  if (!isLoading && data) {
    return data.map(d => {
      return <Marker position={[d.lat, d.lng]} icon={icon} key={d.id} />;
    });
  } else {
    return null;
  }
};

export default Home;
