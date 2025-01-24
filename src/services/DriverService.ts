import { BasicDriver } from "../types/BasicDriver";

export const fetchDriverByID = async (driverID: string): Promise<BasicDriver> => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/driver/basic?driverID=${driverID}`);
    if (!response.ok) throw new Error("Failed to fetch driver");
    return response.json();
};

export const fetchBasicDrivers = async (): Promise<BasicDriver[]> => {
    console.log(`${process.env.REACT_APP_API_BASE_URL}/api/drivers/basic`);
    console.log(`${process.env.PORT}`);
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/drivers/basic`);
    if (!response.ok) throw new Error("Failed to fetch driver names");
    return response.json();
};
