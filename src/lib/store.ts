"use client";
import { useSyncExternalStore } from "react";
import { HubState, initialState, localDate, stateSchema } from "./model";

const KEY = "web3-career-hub:v1";
type Snapshot = { data: HubState; ready: boolean; error: string };
const server: Snapshot = { data: initialState, ready: false, error: "" };
let snapshot = server;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    snapshot = {
      data: raw
        ? stateSchema.parse(JSON.parse(raw))
        : structuredClone(initialState),
      ready: true,
      error: "",
    };
  } catch {
    snapshot = {
      ...snapshot,
      ready: true,
      error:
        "Saved data could not be read. Your existing storage has not been overwritten. Restore a valid backup or explicitly reset local data.",
    };
  }
  emit();
}
function onStorage(event: StorageEvent) {
  if (event.key === KEY || event.key === null) load();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    load();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}
export function useHub() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => server,
  );
}
export function save(data: HubState, recovery = false) {
  if (snapshot.error && !recovery) return false;
  try {
    const parsed = stateSchema.parse(data);
    localStorage.setItem(KEY, JSON.stringify(parsed));
    snapshot = { data: parsed, ready: true, error: "" };
    emit();
    return true;
  } catch {
    snapshot = {
      ...snapshot,
      error:
        "Could not save changes. Storage may be unavailable or full. Export a backup before resetting, or free browser storage and reload.",
    };
    emit();
    return false;
  }
}
export function update(
  change: (state: HubState) => HubState,
  learning = false,
) {
  const data = change(snapshot.data);
  if (learning)
    data.activity = Array.from(new Set([...data.activity, localDate()]));
  return save(data);
}
export function exportData() {
  const blob = new Blob([JSON.stringify(snapshot.data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `web3-career-backup-${localDate()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
