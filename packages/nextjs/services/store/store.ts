import { LatLng, LatLngBounds, Map } from "leaflet";
import create from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { EVMObject, evmAddress } from "~~/types/10tance/EVMObject";
import { CoordinatesLayer, CoordinatesLayerType } from "~~/utils/leaflet/evmWorld";
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
    bounds: LatLngBounds;
    goingTo: LatLng | null;
    activeTiles: Set<tileKey>;
    evmObjectsIndex: Record<tileKey, tileIndex>;
  };
  setMapTileLayerInstance: (map: Map) => void;
  setMapBounds: (bounds: LatLngBounds) => void;
  setMapToGoTo: (goingTo: LatLng | null) => void;
  setSelectedObject: (selectedObject: EVMObject["id"] | null) => void;
  addActiveTile: (tile: tileKey) => void;
  removeActiveTile: (tile: tileKey) => void;
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
    bounds: new LatLngBounds([0, 0], [0, 0]),
    goingTo: null,
    evmObjectsIndex: {},
    activeTiles: new Set(),
  },
  setMapTileLayerInstance: (map: Map): void =>
    set(state => {
      // TODO could do better:
      // - create a specialized "virtual layer"
      // - it would register himself somehow instead of iterating through the map layers
      let tileLayerInstance: CoordinatesLayerType | null = null;
      map.eachLayer(layer => {
        if (tileLayerInstance == null && layer instanceof CoordinatesLayer) {
          tileLayerInstance = layer;
        }
      });
      return { map: { ...state.map, tileLayerInstance } };
    }),
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
  flushActiveTiles: (): void => set(state => ({ map: { ...state.map, activeTiles: new Set() } })),
  fetchBatchEvmObjects: async (tileKey: tileKey): Promise<void> => {
    const oldIndexEntry: tileIndex =
      tileKey in get().map.evmObjectsIndex
        ? get().map.evmObjectsIndex[tileKey]
        : { status: { isLoading: false, isLoaded: false }, addresses: new Set() };

    if (oldIndexEntry.status.isLoaded || oldIndexEntry.status.isLoading) {
      // do nothing if already loaded or being loaded
      return;
    } else {
      // flag the entry as being loaded
      set(state => ({
        map: {
          ...state.map,
          evmObjectsIndex: {
            ...state.map.evmObjectsIndex,
            [tileKey]: { ...oldIndexEntry, status: { ...oldIndexEntry.status, isLoading: true } },
          },
        },
      }));
    }

    const layerInstance = get().map.tileLayerInstance;
    if (layerInstance === null) {
      throw new Error("Missing layer instance to compute tile coordinates");
    }
    const boundsString = layerInstance.keyToBounds(tileKey).toBBoxString();
    const response = await fetch(`http://localhost:3001/objects?bounds=${boundsString}`);
    const objects: EVMObject[] = await response.json();

    set(state => {
      // create a partial record with incoming data
      const newObjectsPartialRecord: EVMObjectRecord = Object.fromEntries(
        objects.map(newObject => {
          let oldEntry, status;
          if (newObject.id in state.evmObjects) {
            oldEntry = state.evmObjects[newObject.id].data;
            status = state.evmObjects[newObject.id].status;
          } else {
            oldEntry = {};
            // status here refers to the extra data fetched from the fetchExtraEvmObject action
            status = { isLoaded: false, isLoading: false };
          }
          // create or update if it is already known
          return [newObject.id, { status, data: { ...oldEntry, ...newObject } }];
        }),
      );

      // also record them in the index
      const newIndexEntry = {
        status: { isLoaded: true, isLoading: false },
        addresses: state.map.evmObjectsIndex[tileKey].addresses.union(new Set(Object.keys(newObjectsPartialRecord))),
      };

      return {
        evmObjects: { ...state.evmObjects, ...newObjectsPartialRecord },
        map: { ...state.map, evmObjectsIndex: { ...state.map.evmObjectsIndex, [tileKey]: newIndexEntry } },
      };
    });
  },
  // it's supposed to update an already known object
  fetchExtraEvmObject: async (id: EVMObject["id"]): Promise<void> => {
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

    const response = await fetch(`https://optimism.blockscout.com/api/v2/tokens/${id}`);
    const data = await response.json();

    set(state => {
      return {
        evmObjects: {
          ...state.evmObjects,
          [id]: {
            data: {
              ...(state.evmObjects[id].data ?? {}),
              ...data,
            },
            status: { isLoaded: true, isLoading: false },
          },
        },
      };
    });
  },
}));
