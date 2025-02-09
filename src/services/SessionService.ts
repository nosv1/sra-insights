import { Session } from "../types/Session";
import { Weekend } from "../types/Weekend";

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

export const fetchTeamSeriesWeekendsByAttrs = async (trackName: string, season: number): Promise<Weekend[]> => {
    const queryParams = new URLSearchParams({ trackName, season: season.toString() });
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/team-series-weekends?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch weekends");
    return response.json();
}