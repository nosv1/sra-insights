import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DriverSearch } from '../components/DriverSearch';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useBasicDrivers } from '../hooks/useBasicDrivers';
import { BasicDriver } from '../types/BasicDriver';

export const DriverPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    let { basicDrivers, loading, error } = useBasicDrivers();
    const initialDriverId = searchParams.get('driverId');
    const [selectedDriver, setSelectedDriver] = useState<BasicDriver | null>(
        basicDrivers.find(driver => driver.driverId === initialDriverId) || null
    );

    useEffect(() => {
        if (initialDriverId && !selectedDriver) {
            const driver = basicDrivers.find(driver => driver.driverId === initialDriverId);
            if (driver) {
                setSelectedDriver(driver);
            }
        }
    }, [initialDriverId, basicDrivers, selectedDriver]);

    const handleDriverSelect = (basicDriver: BasicDriver) => {
        setSelectedDriver(basicDriver);
        setSearchParams({ driverId: basicDriver.driverId });
    };

    return (
        <div>
            <Header />
            {/* <h2>Driver Stats</h2> */}
            {/* <DriverSearch
                onDriverSelect={handleDriverSelect}
                basicDrivers={basicDrivers}
            /> */}
            {selectedDriver ? <div>
                <h2>{selectedDriver.name}</h2>
                <p><a href={selectedDriver.sraMemberStatsURL} target="_blank" rel="noreferrer">SRA Member Stats</a></p>
                <p><a href={selectedDriver.sraInsightsURL} target="_blank" rel="noreferrer">SRA Insights</a></p>
                <pre>{JSON.stringify(selectedDriver, null, 2)}</pre>
            </div> : ''}
            <Footer />
        </div>
    );
};