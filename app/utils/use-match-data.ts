import { useMatches } from "@remix-run/react";

export default function useMatchData<T>(routeId: string) {
  return useMatches().find((x) => x.id === routeId)?.data as T | undefined;
}
