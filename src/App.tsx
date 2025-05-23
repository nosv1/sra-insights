import React, { useState } from 'react';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';

import { DriverPage } from './pages/DriverPage';
import { LapCountsPage } from './pages/LapCounts';
import { LeaderboardsPage } from './pages/LapTimes/LeaderboardsPage';
import { TeamSeriesAPDPlotPage } from './pages/Races/APDPlotPage';
import { DivisionPercentDifferences } from './pages/Races/DivisionPercentDifferences';
import { RaceInsightsPage } from './pages/Races/RaceInsightsPage';

const App: React.FC = () => {
  const [isLapTimesDropdownOpen, setIsLapTimesDropdownOpen] = useState(false);
  const [isRacesDropdownOpen, setIsRacesDropdownOpen] = useState(false);

  // Function to toggle dropdown state
  const toggleDropdown = (isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => {
    setIsOpen(!isOpen);
  };

  return (
    <Router>
      <nav>
        <ul>
          {/* Driver Link */}
          <li>
            <Link to="/driver">Driver (WIP)</Link>
          </li>

          {/* Lap Counts*/}
          <li>
            <Link to="/lap-counts">Lap Counts</Link>
          </li>

          {/* Lap Times Dropdown */}
          <li>
            <div
              onMouseEnter={() => toggleDropdown(isLapTimesDropdownOpen, setIsLapTimesDropdownOpen)}
              onMouseLeave={() => toggleDropdown(isLapTimesDropdownOpen, setIsLapTimesDropdownOpen)}
            >
              Lap Times {isLapTimesDropdownOpen ? '▼' : '►'}
              {isLapTimesDropdownOpen && (
                <ul>
                  <li>
                    <Link to="/lap-times/leaderboards?series=team-series">Team Series</Link>
                    <Link to="/lap-times/leaderboards?series=endurance-series">Endurance Series</Link>
                  </li>
                  {/* Uncomment if needed */}
                  {/* <li>
                    <Link to="/lap-times/weather-plot">Weather Plot</Link>
                  </li> */}
                </ul>
              )}
            </div>
          </li>

          {/* Races Dropdown */}
          <li>
            <div
              onMouseEnter={() => toggleDropdown(isRacesDropdownOpen, setIsRacesDropdownOpen)}
              onMouseLeave={() => toggleDropdown(isRacesDropdownOpen, setIsRacesDropdownOpen)}
            >
              Races {isRacesDropdownOpen ? '▼' : '►'}
              {isRacesDropdownOpen && (
                <ul>
                  <li>
                    <Link to="/races/race-insights">Race Insights</Link>
                  </li>
                  <li>
                    <Link to="/races/apd-plot">Average Percent Difference</Link>
                  </li>
                  <li>
                    <Link to="/races/division-percent-differences">Division Percent Differences</Link>
                  </li>
                </ul>
              )}
            </div>
          </li>
        </ul>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/lap-times/leaderboards" element={<LeaderboardsPage />} />
        <Route path="/lap-counts" element={<LapCountsPage />} />
        {/* <Route path="/lap-times/weather-plot" element={<WeatherPlotPage />} /> */}
        <Route path="/races/race-insights" element={<RaceInsightsPage />} />
        {/* <Route path="/races/championships" element={<ChampionshipsPage />} /> */}
        <Route path="/races/apd-plot" element={<TeamSeriesAPDPlotPage />} />
        <Route path="/races/division-percent-differences" element={<DivisionPercentDifferences />} />
      </Routes>
    </Router>
  );
};

export default App;