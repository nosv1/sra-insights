import { CarDriver } from '../types/CarDriver';

export const fetchTeamSeriesCarDrivers = async (attrs: { trackNames: string[], divisions: number[], seasons: number[], sessionTypes: string[], pastNumSessions: number }): Promise<CarDriver[]> => {
    const queryParams = new URLSearchParams(attrs as any);
    const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/car-drivers/team-series?${queryParams.toString()}`
    );
    if (!response.ok) throw new Error("Failed to fetch car drivers");
    return response.json();
}