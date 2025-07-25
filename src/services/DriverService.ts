import { BasicDriver, DriverCarLapCountDict } from "../types/BasicDriver";

export const fetchDriverByID = async (driverId: string): Promise<BasicDriver> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/driver/basic?driverId=${driverId}`);
    if (!response.ok) throw new Error("Failed to fetch driver");
    return response.json();
};

export const fetchBasicDrivers = async (): Promise<BasicDriver[]> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/drivers/basic`);
    if (!response.ok) throw new Error("Failed to fetch driver names");
    return response.json();
};

export const fetchBasicDriverLapCounts = async (afterDate: string, beforeDate: string): Promise<DriverCarLapCountDict> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/misc/lap-counts?afterDate=${afterDate}&beforeDate=${beforeDate}`);
    if (!response.ok) throw new Error("Failed to fetch driver lap counts");
    return response.json();
};