import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BasicDriver } from "../types/BasicDriver";

interface DriverSearchProps {
    onDriverSelect: (basicDriver: BasicDriver) => void;
    basicDrivers: BasicDriver[];
    basicDriversLoading: boolean;
    initialDriverId?: string | null;
    selectedDriver?: BasicDriver | null;
}

export const DriverSearch: React.FC<DriverSearchProps> = ({ onDriverSelect, basicDrivers, basicDriversLoading, initialDriverId: initialDriverId, selectedDriver }) => {
    const [searchValue, setSearchValue] = useState<string>("");
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [currentDriverId, setCurrentDriverId] = useState<string | null>(initialDriverId ?? null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Set initial driver based on provided ID
    useEffect(() => {
        if (basicDrivers.length > 0 && currentDriverId) {
            const existingDriver = basicDrivers.find(driver => driver.driverId === currentDriverId);
            if (!existingDriver) {
                console.error(`Driver with ID ${currentDriverId} not found`);
                return;
            }
            setSearchValue(existingDriver.name);
            selectedDriver = existingDriver;
        }
    }, [basicDrivers, currentDriverId]);

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
        setCurrentDriverId(basicDriver.driverId);
        navigate({
            search: `?driverId=${basicDriver.driverId}`
        });
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
                placeholder={basicDriversLoading ? "Loading driver names..." : "Search for a driver..."}
                onFocus={() => {
                    setShowSuggestions(true);
                    inputRef.current?.select();
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                disabled={basicDriversLoading}
            />
            {showSuggestions && <ul>{renderSuggestions()}</ul>}
        </div>
    );
};


