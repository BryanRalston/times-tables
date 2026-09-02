import { useEffect, useState } from "react";
import { isPhoneViewport, PHONE_MAX_PX } from "./viewport";

export type Route =
  | { id: "home" }
  | { id: "lessons" }
  | { id: "shelf" }
  | { id: "path" }
  | { id: "play"; kind: "welcome" | "daily" | "activity"; activityId?: string }
  | { id: "unit"; unitId: string }
  | { id: "grownup" };

export function aliasActivityId(id: string): string {
  return id === "u1-pictograph" ? "u1-graph" : id;
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, "").replace(/^\//, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "lessons") return { id: "lessons" };
  if (parts[0] === "shelf") return { id: "shelf" };
  if (parts[0] === "path") return { id: "path" };
  if (parts[0] === "play") {
    if (parts[1] === "welcome") return { id: "play", kind: "welcome" };
    if (parts[1] === "daily") return { id: "play", kind: "daily" };
    if (parts[1] === "activity" && parts[2]) {
      return { id: "play", kind: "activity", activityId: aliasActivityId(parts[2]) };
    }
  }
  if (parts[0] === "unit" && parts[1]) return { id: "unit", unitId: parts[1] };
  if (parts[0] === "grownup") return { id: "grownup" };
  return { id: "home" };
}

export function usePhoneDoor(): boolean {
  const [phone, setPhone] = useState(() => isPhoneViewport());
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(`(max-width: ${PHONE_MAX_PX}px)`);
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

/** Phone empty Guest opens leftover. Tablet/laptop keep the hashed route (Home catalog). Grown-ups stay reachable. */
export function doorRoute(seenWelcome: boolean, route: Route, phone = true): Route {
  if (seenWelcome) return route;
  if (route.id === "grownup") return route;
  if (!phone) return route;
  if (route.id === "play" && route.kind === "welcome") return route;
  return { id: "play", kind: "welcome" };
}

export function toHash(route: Route): string {
  if (route.id === "play") {
    if (route.kind === "activity" && route.activityId) {
      return `#/play/activity/${aliasActivityId(route.activityId)}`;
    }
    return `#/play/${route.kind}`;
  }
  if (route.id === "unit") return `#/unit/${route.unitId}`;
  if (route.id === "lessons") return "#/lessons";
  if (route.id === "shelf") return "#/shelf";
  if (route.id === "path") return "#/path";
  if (route.id === "grownup") return "#/grownup";
  return "#/";
}

export function navigate(route: Route, opts?: { replace?: boolean }) {
  const next = toHash(route);
  if (opts?.replace) {
    const url = `${location.pathname}${location.search}${next}`;
    history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  if (location.hash !== next) location.hash = next;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}
