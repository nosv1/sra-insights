import { useEffect, useState } from "react";
import { fetchBasicDrivers, fetchBasicDriverLapCounts as fetchDriverCarLapCounts } from "../services/DriverService";
import { BasicDriver, DriverCarLapCountDict } from "../types/BasicDriver";

export const useBasicDrivers = () => {
    const [basicDrivers, setBasicDrivers] = useState<BasicDriver[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const basicDrivers = await fetchBasicDrivers();
                setBasicDrivers(basicDrivers);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return { basicDrivers, loading, error };
};

export const useDriverCarLapCounts = (afterDate: string, beforeDate: string) => {
    const [driverCarLapCounts, setDriverLapCounts] = useState<DriverCarLapCountDict>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const driverCarLapCounts = await fetchDriverCarLapCounts(afterDate, beforeDate);
                setDriverLapCounts(driverCarLapCounts);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return { driverCarLapCounts: driverCarLapCounts, loading, error };
}
