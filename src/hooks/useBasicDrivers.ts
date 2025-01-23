import { useEffect, useState } from "react";
import { fetchBasicDrivers } from "../services/DriverService";
import { BasicDriver } from "../types/BasicDriver";

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
