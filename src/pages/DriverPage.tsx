import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DriverSearch from '../components/DriverSearch';
import { BasicDriver } from '../types/BasicDriver';
import { useBasicDrivers as useBasicDrivers } from '../hooks/useBasicDrivers';

const DriverPage: React.FC = () => {
    const [selectedDriver, setSelectedDriver] = useState<BasicDriver | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const { basicDrivers, loading, error } = useBasicDrivers();

    const handleDriverSelect = (basicDriver: BasicDriver) => {
        setSelectedDriver(basicDriver);
        setSearchParams({ driverID: basicDriver.driverID });
    };

    return (
        <div>
            <h1>Driver Stats</h1>
            <DriverSearch
                onDriverSelect={handleDriverSelect}
                basicDrivers={basicDrivers}
                basicDriversLoading={loading}
                initialDriverID={searchParams.get('driverID')}
                selectedDriver={selectedDriver}
            />
            {selectedDriver && <p className="selected-driver">Selected Driver: {selectedDriver.name} {selectedDriver.driverID}</p>}
        </div>
    );
};

export default DriverPage;