import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BasicDriver } from "../types/BasicDriver";

interface DriverSearchProps {
    onDriverSelect: (basicDriver: BasicDriver) => void;
    basicDrivers: BasicDriver[];
    basicDriversLoading: boolean;
    initialDriverID?: string | null;
    selectedDriver?: BasicDriver | null;
}

const DriverSearch: React.FC<DriverSearchProps> = ({ onDriverSelect, basicDrivers, basicDriversLoading, initialDriverID, selectedDriver }) => {
    const [searchValue, setSearchValue] = useState<string>("");
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [currentDriverID, setCurrentDriverID] = useState<string | null>(initialDriverID ?? null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Set initial driver based on provided ID
    useEffect(() => {
        if (basicDrivers.length > 0 && currentDriverID) {
            const existingDriver = basicDrivers.find(driver => driver.driverID === currentDriverID);
            if (!existingDriver) {
                console.error(`Driver with ID ${currentDriverID} not found`);
                return;
            }
            setSearchValue(existingDriver.name);
        }
    }, [basicDrivers, currentDriverID]);

    // Update search value when selectedDriver changes
    useEffect(() => {
        if (selectedDriver) {
            setSearchValue(selectedDriver.name);
        }
    }, [selectedDriver]);

    // Handle driver selection
    const handleSelect = (basicDriver: BasicDriver) => {
        setSearchValue(basicDriver.name);
        setShowSuggestions(false);
        onDriverSelect(basicDriver);
        setCurrentDriverID(basicDriver.driverID);
        navigate({
            search: `?driverID=${basicDriver.driverID}`
        });
    };

    // Handle input focus
    const handleFocus = () => {
        setShowSuggestions(true);
        inputRef.current?.select();
    };

    // Render suggestions list
    const renderSuggestions = () => {
        if (!showSuggestions) return null;

        const filteredDrivers = basicDrivers.filter(driver =>
            driver.name.toLowerCase().includes(searchValue.toLowerCase())
        );

        if (filteredDrivers.length === 0) {
            return <li>No matching drivers found</li>;
        }

        return filteredDrivers.map(driver => (
            <li
                key={driver.driverID}
                onClick={() => handleSelect(driver)}
            >
                {driver.name}
            </li>
        ));
    };

    // if (loading) return <p>Loading driver names...</p>;
    // if (error) return <p>Error: {error}</p>;

    return (
        <div className="driver-search-container">
            <input
                ref={inputRef}
                className="driver-search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={basicDriversLoading ? "Loading driver names..." : "Search for a driver..."}
                onFocus={handleFocus}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                disabled={basicDriversLoading}
            />
            {showSuggestions && <ul>{renderSuggestions()}</ul>}
        </div>
    );
};

export default DriverSearch;


