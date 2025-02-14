import { useEffect, useState } from "react";
import { fetchLapsByAttrs } from "../services/LapService";
import { Lap } from "../types/Lap";

export const useLaps = (afterDate: string, beforeDate: string, trackName: string, carGroups: string[]) => {
    const [lapsState, setLaps] = useState<Lap[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the beginning
            const tempLaps = new Map<string, Lap>();
            try {
                let shouldFetchMore = true;
                while (shouldFetchMore) {
                    const laps = await fetchLapsByAttrs({ afterDate, beforeDate, trackName, carGroups });
                    if (laps.length === 0) break;

                    const lastLap = laps[laps.length - 1];
                    laps.forEach(lap => tempLaps.set(lap.key_, lap));

                    if (!lastLap.session?.finishTime || laps.length < 10000) {
                        shouldFetchMore = false;
                    } else {
                        afterDate = lastLap.session.finishTime.toString().split("T")[0];
                    }
                }
                setLaps(Array.from(tempLaps.values()));
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [afterDate, beforeDate, trackName]);

    return { laps: lapsState, loading, error };
};
