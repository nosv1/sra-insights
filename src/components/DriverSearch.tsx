import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BasicDriver } from "../types/BasicDriver";

interface DriverSearchProps {
    onDriverSelect: (basicDriver: BasicDriver) => void;
    basicDrivers: BasicDriver[];
    setSelectedDriver: (driver: BasicDriver | null) => void;
}

export const DriverSearch: React.FC<DriverSearchProps> = ({ onDriverSelect, basicDrivers, setSelectedDriver }) => {
    const [searchValue, setSearchValue] = useState<string>("");
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [currentDriverId, setCurrentDriverId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Set initial driver based on provided ID
    useEffect(() => {
        if (basicDrivers.length > 0 && currentDriverId) {
            const existingDriver = basicDrivers.find(driver => driver.driverId === currentDriverId);
            if (!existingDriver) {
                console.error(`Driver with ID ${currentDriverId} not found`);
                return;
            }
            setSearchValue(existingDriver.name);
            setSelectedDriver(existingDriver);
        }
    }, [basicDrivers, currentDriverId, setSelectedDriver]);

    // Handle driver selection
    const handleSelect = (basicDriver: BasicDriver) => {
        setSearchValue(basicDriver.name);
        setShowSuggestions(false);
        onDriverSelect(basicDriver);
        setCurrentDriverId(basicDriver.driverId);
        setSelectedDriver(basicDriver);
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
                key={driver.driverId}
                onClick={() => handleSelect(driver)}
            >
                {`${driver.name}` + (driver.raceDivision ? ` | Division ${driver.raceDivision}` : "")}
            </li>
        ));
    };

    return (
        <div className="driver-search-container">
            <input
                ref={inputRef}
                className="driver-search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search for a driver..."
                onFocus={() => {
                    setShowSuggestions(true);
                    inputRef.current?.select();
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            />
            {showSuggestions && <ul className="driver-suggestions">{renderSuggestions()}</ul>}
        </div>
    );
};
