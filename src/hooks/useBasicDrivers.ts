import { useEffect, useState } from "react";
import { fetchBasicDrivers, fetchBasicDriverLapCounts as fetchDriverLapCounts } from "../services/DriverService";
import { BasicDriver, DriverLapCountDict } from "../types/BasicDriver";

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

export const useDriverLapCounts = (afterDate: string, beforeDate: string) => {
    const [driverLapCounts, setDriverLapCounts] = useState<DriverLapCountDict>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const driverLapCounts = await fetchDriverLapCounts(afterDate, beforeDate);
                setDriverLapCounts(driverLapCounts);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return { driverLapCounts, loading, error };
}
