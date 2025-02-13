import React, { useEffect } from 'react';
import { DivSelection } from '../DivSelection';

interface SelectionAreaProps {
    selectedDivisions: (number)[];
    uniqueDivisions: (number)[];
    sortByDivisionEnabled: boolean;
    sortBy: 'apd' | 'slope' | 'variance';
    minNumSessions: number;
    pastNumSessions: number;
    singleSeasonEnabled: boolean;
    singleSeason: number | '';
    setSelectedDivisions: React.Dispatch<React.SetStateAction<(number)[]>>;
    setSortByDivisionEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    setSortBy: React.Dispatch<React.SetStateAction<'apd' | 'slope' | 'variance'>>;
    setMinNumSessions: React.Dispatch<React.SetStateAction<number>>;
    setPastNumSessions: React.Dispatch<React.SetStateAction<number>>;
    setSeasons: React.Dispatch<React.SetStateAction<number[]>>;
    setSingleSeasonEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    setSingleSeason: React.Dispatch<React.SetStateAction<number | ''>>;
}

export const SelectionArea: React.FC<SelectionAreaProps> = ({
    selectedDivisions,
    uniqueDivisions,
    sortByDivisionEnabled,
    sortBy,
    minNumSessions,
    pastNumSessions,
    singleSeasonEnabled,
    singleSeason,
    setSelectedDivisions,
    setSortByDivisionEnabled,
    setSortBy,
    setMinNumSessions,
    setPastNumSessions,
    setSeasons,
    setSingleSeasonEnabled,
    setSingleSeason
}) => {
    useEffect(() => {
        if (singleSeasonEnabled && singleSeason) {
            setSeasons([singleSeason]);
        } else {
            setSeasons([]);
        }
    }, [singleSeasonEnabled, singleSeason]);

    const handleSortChange = (sortBy: 'apd' | 'slope' | 'variance') => {
        setSortBy(sortBy);
    }

    const handleSortByDivisionToggle = () => {
        setSortByDivisionEnabled(!sortByDivisionEnabled);
    }

    const handleMinNumSessionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        setMinNumSessions(value > 0 ? value : 1);
    }

    const handlePastNumSessionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        setPastNumSessions(value > 0 ? value : 1);
    };

    const handleSingleSeasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        setSingleSeason(value > 0 ? value : '');
    };

    const handleSingleSeasonToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSingleSeasonEnabled(event.target.checked);
        if (!event.target.checked) {
            setSingleSeason(13);
        }
    };

    return (
        <div className="selection-area">
            <DivSelection
                selectedDivisions={selectedDivisions}
                setSelectedDivisions={setSelectedDivisions}
                uniqueDivisions={uniqueDivisions}
            />
            <div className="sort-options">
                <label>
                    <input
                        type="checkbox"
                        checked={sortByDivisionEnabled}
                        onChange={() => handleSortByDivisionToggle()}
                    />
                    Sort by Division
                </label>
                <label>
                    <input
                        type="radio"
                        name="sortOption"
                        checked={sortBy == 'apd'}
                        onChange={() => handleSortChange('apd')}
                    />
                    Sort by APD
                </label>
                <label title="Slope is the trend of APD over time. The more negative the slope, the faster the driver is showing improvement.">
                    <input
                        type="radio"
                        name="sortOption"
                        checked={sortBy == 'slope'}
                        onChange={() => handleSortChange('slope')}
                    />
                    Sort by Slope
                </label>
                <label title="Variance is the spread of APD values. The lower the variance, the more consistent the driver is.">
                    <input
                        type="radio"
                        name="sortOption"
                        checked={sortBy == 'variance'}
                        onChange={() => handleSortChange('variance')}
                    />
                    Sort by Variance
                </label>
            </div>
            <div className="session-count-controls">
                <div className="session-count-control">
                    <label htmlFor="numSessions">Past <i>n</i> Races:</label>
                    <input
                        type="number"
                        value={pastNumSessions}
                        onChange={handlePastNumSessionsChange}
                        min="1"
                        title="Adjust the number of recent races to consider for computing the average."
                        className="styled-number-input"
                    />
                </div>
                <div className="session-count-control">
                    <label htmlFor="numSessions">Minimum Races:</label>
                    <input
                        type="number"
                        value={minNumSessions}
                        onChange={handleMinNumSessionsChange}
                        min="1"
                        title="Adjust the minimum number of races a driver must have to be included in the plot."
                        className="styled-number-input"
                    />
                </div>
                <div className="season-filter session-count-control">
                    <label>
                        <input
                            type="checkbox"
                            checked={singleSeasonEnabled}
                            onChange={handleSingleSeasonToggle}
                        />
                        Single Season
                    </label>
                    {singleSeasonEnabled && (
                        <input
                            type="number"
                            value={singleSeason}
                            onChange={handleSingleSeasonChange}
                            min="1"
                            title="Select a single season."
                            className="styled-number-input"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};