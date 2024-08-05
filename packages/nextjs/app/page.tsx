"use client";

import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import { MapContainer, TileLayer } from "react-leaflet";

const Home: NextPage = () => {
  return (
    <div className="hero min-h-[calc(100vh-9rem)]">
      <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom={true} className="hero-content size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
};

export default Home;
