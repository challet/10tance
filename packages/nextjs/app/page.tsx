"use client";

import { useCallback } from "react";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import Map from "~~/components/leaflet/Map";
import ObjectDetails from "~~/components/web3/ObjectDetails";
import { useGlobalState } from "~~/services/store/store";

const Home: NextPage = () => {
  const selectedObject = useGlobalState(state => state.selectedObject);
  const setSelectedObject = useGlobalState(state => state.setSelectedObject);

  const unselectObjectHandler = useCallback(() => {
    setSelectedObject(null);
  }, [setSelectedObject]);

  return (
    <div className="drawer h-full">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" checked={selectedObject != null} readOnly />
      <div className="drawer-content min-h-[calc(100vh-4rem)] z-0">
        <Map />
      </div>
      <div className="drawer-side w-full sm:w-[30rem] h-full absolute z-1">
        <div className="min-h-full bg-base-200/[.98]">
          <button className="btn btn-circle btn-outline m-4 absolute top-0 right-0" onClick={unselectObjectHandler}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <ObjectDetails />
        </div>
      </div>
    </div>
  );
};

export default Home;
