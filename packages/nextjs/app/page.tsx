"use client";

import { FunctionComponent, useState } from "react";
import { EvmTorus } from "../utils/leaflet/evmWorld";
import { LeafletEvent, latLng, latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import { MapContainer, Marker, ScaleControl, TileLayer, useMapEvent } from "react-leaflet";

const MoveHandler: FunctionComponent<{ onMove: (event: LeafletEvent) => void }> = ({ onMove }) => {
  useMapEvent("move", onMove);
  return null;
};

const Home: NextPage = () => {
  const [mapBounds, setMapBounds] = useState(latLngBounds(latLng(0, 0), latLng(0, 0)));

  const onMove = (event: LeafletEvent) => {
    setMapBounds(event.target.getBounds());
  };

  return (
    <>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">West</div>
          <div className="stat-value">{mapBounds.getWest()}</div>
        </div>
        <div className="stat">
          <div className="stat-title">North</div>
          <div className="stat-value">{mapBounds.getNorth()}</div>
        </div>
        <div className="stat">
          <div className="stat-title">South</div>
          <div className="stat-value">{mapBounds.getSouth()}</div>
        </div>
        <div className="stat">
          <div className="stat-title">East</div>
          <div className="stat-value">{mapBounds.getEast()}</div>
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
          <TileLayer
            url="http://localhost:3001/{z}/{x}/{y}.png"
            //url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap={false}
          />
          <ScaleControl />
          <Marker position={[0, 0]} />
          <MoveHandler onMove={onMove} />
        </MapContainer>
      </div>
    </>
  );
};

export default Home;
