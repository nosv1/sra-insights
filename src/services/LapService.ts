import { Lap } from "../types/Lap";

export const fetchLapsByAttrs = async (attrs: { afterDate: string, beforeDate: string, trackName: string, carGroups: string[] }): Promise<Lap[]> => {
    const queryParams = new URLSearchParams(attrs as any);
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/laps?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch laps");
    return response.json();
}