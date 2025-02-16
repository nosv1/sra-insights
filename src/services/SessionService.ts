import { Session } from "../types/Session";
import { Weekend } from "../types/Weekend";

export const fetchRecentSessions = async (limit: number): Promise<Session[]> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/recent?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch recent sessions");
    return response.json();
}

export const fetchWeekendByKey = async (sessionKey: string): Promise<Weekend> => {
    const queryParams = new URLSearchParams({ sessionKey });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/basic-weekend?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch weekend");
    return response.json();
}

export const fetchCompleteSessionByKey = async (sessionKey: string): Promise<Session> => {
    const queryParams = new URLSearchParams({ sessionKey });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/complete?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch session");
    return response.json();
}

export const fetchCompleteWeekendByKey = async (sessionKey: string): Promise<Weekend> => {
    const queryParams = new URLSearchParams({ sessionKey });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/complete-weekend?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch weekend");
    return response.json();
}

export const fetchTeamSeriesTracksByAttrs = async (season: string, limit: number): Promise<{ track: string, season: number }[]> => {
    const queryParams = new URLSearchParams({ season: season, limit: limit.toString() });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/team-series-tracks?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch tracks");
    return response.json();
}

export const fetchTeamSeriesRacesByAttrs = async (trackName: string, season: number): Promise<Session[]> => {
    const queryParams = new URLSearchParams({ trackName, season: season.toString() });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/team-series-races?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch races");
    return response.json();
}

export const fetchTeamSeriesWeekendsByAttrs = async (trackName: string, season: number): Promise<Weekend[]> => {
    const queryParams = new URLSearchParams({ trackName, season: season.toString() });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/team-series-weekends?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch weekends");
    return response.json();
}