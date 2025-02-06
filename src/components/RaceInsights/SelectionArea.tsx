import React, { useEffect } from 'react';
import { DivSelection } from '../DivSelection';
import { TrackSelection } from '../TrackSelection';

interface SelectionAreaProps {
    selectedDivisions: (number)[];
    uniqueDivisions: (number)[];
    sortByDivisionEnabled: boolean;
    trackName: string;
    setSelectedDivisions: React.Dispatch<React.SetStateAction<(number)[]>>;
    setSortByDivisionEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    setTrackName: React.Dispatch<React.SetStateAction<string>>;
}

export const SelectionArea: React.FC<SelectionAreaProps> = ({
    selectedDivisions,
    uniqueDivisions,
    sortByDivisionEnabled,
    trackName,
    setSelectedDivisions,
    setSortByDivisionEnabled,
    setTrackName,
}) => {

    const handleSortByDivisionToggle = () => {
        setSortByDivisionEnabled(!sortByDivisionEnabled);
    }

    return (
        <div className="selection-area">
            <DivSelection
                selectedDivisions={selectedDivisions}
                setSelectedDivisions={setSelectedDivisions}
                uniqueDivisions={uniqueDivisions}
            />
            <div className="leaderboard-controls">
                <div className="sort-options">
                    <label>
                        <input
                            type="checkbox"
                            checked={sortByDivisionEnabled}
                            onChange={() => handleSortByDivisionToggle()}
                        />
                        Sort by Division
                    </label>
                </div>
                <TrackSelection trackName={trackName} onTrackSelect={setTrackName} />
            </div>
        </div>
    );
};