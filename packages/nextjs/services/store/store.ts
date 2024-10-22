import type { CoordinatesLayerType } from "@10tance/map";
import type { LatLng, LatLngBounds, Layer } from "leaflet";
import create from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { EVMObject, evmAddress } from "~~/types/10tance/EVMObject";
import { ChainWithAttributes } from "~~/utils/scaffold-eth";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

export type tileKey = ReturnType<CoordinatesLayerType["_tileCoordsToKey"]>;
export type loadStatus = { isLoading: boolean; isLoaded: boolean };
export type EVMObjectRecord = Record<evmAddress, { status: loadStatus; data: EVMObject | null }>;
export type tileIndex = {
  status: loadStatus;
  addresses: Set<evmAddress>;
};

const API_URL = `${process.env.NEXT_PUBLIC_TILESERVER_HOST}/objects`;

export type GlobalState = {
  nativeCurrency: {
    price: number;
    isFetching: boolean;
  };
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  setIsNativeCurrencyFetching: (newIsNativeCurrencyFetching: boolean) => void;
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;

  evmObjects: EVMObjectRecord;
  selectedObject: EVMObject["id"] | null;

  map: {
    tileLayerInstance: CoordinatesLayerType | null;
    bounds: LatLngBounds | null;
    goingTo: LatLng | null;
    activeTiles: Set<tileKey>;
    evmObjectsIndex: Record<tileKey, tileIndex>;
  };
  setMapTileLayerInstance: (layer: Layer) => void;
  setMapBounds: (bounds: LatLngBounds) => void;
  setMapToGoTo: (goingTo: LatLng | null) => void;
  setSelectedObject: (selectedObject: EVMObject["id"] | null) => void;
  addActiveTile: (tile: tileKey) => void;
  removeActiveTile: (tile: tileKey) => void;
  setIndexEntry: (tileKey: tileKey, status?: Partial<tileIndex["status"]>, addresses?: tileIndex["addresses"]) => void;
  flushActiveTiles: () => void;
  fetchBatchEvmObjects: (tileKey: tileKey) => void;
  fetchExtraEvmObject: (object: EVMObject["id"]) => void;
};

export const useGlobalState = create<GlobalState>((set, get) => ({
  // TODO should be removed
  nativeCurrency: {
    price: 0,
    isFetching: true,
  },
  setNativeCurrencyPrice: (newValue: number): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, price: newValue } })),
  setIsNativeCurrencyFetching: (newValue: boolean): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, isFetching: newValue } })),
  targetNetwork: scaffoldConfig.targetNetworks[0],
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),
  // until here

  evmObjects: {},
  selectedObject: null,
  map: {
    tileLayerInstance: null,
    bounds: null,
    goingTo: null,
    evmObjectsIndex: {},
    activeTiles: new Set(),
  },
  setMapTileLayerInstance: async (layer: Layer): Promise<void> => {
    const { CoordinatesLayer } = await import("@10tance/map");
    set(state => {
      // TODO could do better:
      // - create a specialized "virtual layer"
      // - it would register himself somehow instead of iterating through the map layers
      if (state.map.tileLayerInstance === null && layer instanceof CoordinatesLayer) {
        return { map: { ...state.map, tileLayerInstance: layer } };
      } else {
        return {};
      }
    });
  },
  setMapBounds: (bounds: LatLngBounds): void => set(state => ({ map: { ...state.map, bounds } })),
  setMapToGoTo: (goingTo: LatLng | null): void => set(state => ({ map: { ...state.map, goingTo } })),
  setSelectedObject: (selectedObject: EVMObject["id"] | null): void => set(() => ({ selectedObject })),
  addActiveTile: (tile: tileKey): void =>
    set(state => ({ map: { ...state.map, activeTiles: new Set(state.map.activeTiles).add(tile) } })),
  removeActiveTile: (tile: tileKey): void =>
    set(state => {
      const nextSet = new Set(state.map.activeTiles);
      nextSet.delete(tile); // Unlike add, delete doesn't return the set
      return { map: { ...state.map, activeTiles: nextSet } };
    }),
  setIndexEntry: (
    tileKey: tileKey,
    status: Partial<tileIndex["status"]> = {},
    addresses?: tileIndex["addresses"],
  ): void =>
    set(state => {
      const oldIndexEntry: tileIndex =
        tileKey in get().map.evmObjectsIndex
          ? get().map.evmObjectsIndex[tileKey]
          : { status: { isLoading: false, isLoaded: false }, addresses: new Set() };

      const newIndexEntry = {
        addresses: addresses === undefined ? oldIndexEntry.addresses : addresses,
        status: { ...oldIndexEntry.status, ...status },
      };

      return {
        map: {
          ...state.map,
          evmObjectsIndex: {
            ...state.map.evmObjectsIndex,
            [tileKey]: newIndexEntry,
          },
        },
      };
    }),
  flushActiveTiles: (): void => set(state => ({ map: { ...state.map, activeTiles: new Set() } })),
  fetchBatchEvmObjects: async (tileKey: tileKey): Promise<void> => {
    const layerInstance = get().map.tileLayerInstance;
    if (layerInstance === null) {
      throw new Error("Missing layer instance to compute tile coordinates");
    }

    const oldIndexEntryStatus: loadStatus =
      tileKey in get().map.evmObjectsIndex
        ? get().map.evmObjectsIndex[tileKey].status
        : { isLoading: false, isLoaded: false };

    if (oldIndexEntryStatus.isLoaded || oldIndexEntryStatus.isLoading) {
      // do nothing if already loaded or being loaded
      return;
    } else {
      // flag the entry as being loaded
      get().setIndexEntry(tileKey, { isLoading: true });
    }

    try {
      const response = await fetch(`${API_URL}/${tileKey}`);
      // status that may probbaly not change over times won't raise an error are treated as an a empty response
      if (!response.ok && ![400, 402, 403, 404, 405, 406, 410, 413, 414].includes(response.status)) {
        throw new Error(response.statusText);
      }
      const objects: EVMObject[] = response.ok ? await response.json() : [];

      // create a partial record with incoming data
      const knownObjects = get().evmObjects;
      const newObjectsPartialRecord: EVMObjectRecord = Object.fromEntries(
        objects.map(newObject => {
          let oldEntry, status;
          if (newObject.id in knownObjects) {
            oldEntry = knownObjects[newObject.id].data;
            status = knownObjects[newObject.id].status;
          } else {
            oldEntry = {};
            // status here refers to the extra data fetched from the fetchExtraEvmObject action
            status = { isLoaded: false, isLoading: false };
          }
          return [newObject.id, { status, data: { ...oldEntry, ...newObject } }];
        }),
      );

      // add it to the store record
      set(state => ({ evmObjects: { ...state.evmObjects, ...newObjectsPartialRecord } }));
      // also record them in the index
      get().setIndexEntry(tileKey, { isLoaded: true, isLoading: false }, new Set(Object.keys(newObjectsPartialRecord)));
    } catch (e) {
      console.error(`Can't load evm objects on tile ${tileKey} : ${(e as Error).message}`);
      get().setIndexEntry(tileKey, { isLoading: false });
    }
  },
  // it's supposed to update an already known object
  fetchExtraEvmObject: async (id: EVMObject["id"]): Promise<void> => {
    const { EvmLonLat } = await import("@10tance/map");
    const oldEntry =
      id in get().evmObjects ? get().evmObjects[id] : { status: { isLoading: false, isLoaded: false }, data: null };

    if (oldEntry.status.isLoaded || oldEntry.status.isLoading) {
      // do nothing if already loaded or being loaded
      return;
    } else {
      // flag the entry as being loaded
      set(state => ({
        evmObjects: {
          ...state.evmObjects,
          [id]: { ...oldEntry, status: { ...oldEntry.status, isLoading: true } },
        },
      }));
    }

    let data;
    const response = await fetch(`https://optimism.blockscout.com/api/v2/tokens/${id}`);
    if (response.ok) {
      data = await response.json();
      const location = EvmLonLat.fromEvmAddress(id);
      data.id = id;
      data.lat = location.lat;
      data.lng = location.lng;
    } else if (response.status == 404) {
      data = null;
    } else {
      throw new Error(response.statusText);
    }

    set(state => {
      const newEntry = {
        data:
          oldEntry.data === null && data === null ? null : { ...(state.evmObjects[id].data ?? {}), ...(data ?? {}) },
        status: { isLoaded: true, isLoading: false },
      };
      return {
        evmObjects: {
          ...state.evmObjects,
          [id]: newEntry,
        },
      };
    });
  },
}));
