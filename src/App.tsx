import React, { useState } from 'react';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
// import HomePage from './pages/HomePage';
import { DriverPage } from './pages/DriverPage';
import { TeamSeriesAPDPlotPage } from './pages/TeamSeries/APDPlotPage';
import { TeamSeriesLeaderboardsPage } from './pages/TeamSeries/LeaderboardsPage';

const App: React.FC = () => {
  const [isTeamSeriesDropdownOpen, setIsTeamSeriesDropdownOpen] = useState(false);

  const toggleTeamSeriesDropdown = () => {
    setIsTeamSeriesDropdownOpen(!isTeamSeriesDropdownOpen);
  };

  return (
    <Router>
      <nav>
        <ul>
          {/* <li>
            <Link to="/">Home</Link>
          </li> */}
          <li>
            <Link to="/driver">Driver</Link>
          </li>
          <li>
            <div onMouseEnter={toggleTeamSeriesDropdown} onMouseLeave={toggleTeamSeriesDropdown}>
              Team Series {isTeamSeriesDropdownOpen ? '▼' : '►'}
              {isTeamSeriesDropdownOpen && (
                <ul>
                  <li>
                    <Link to="/team-series/lap-time-insights">Lap Time Insights</Link>
                  </li>
                  <li>
                    <Link to="/team-series/apd-plot">Average Percent Difference (APD) Plot</Link>
                  </li>
                </ul>
              )}
            </div>
          </li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/team-series/lap-time-insights" element={<TeamSeriesLeaderboardsPage />} />
        <Route path="/team-series/apd-plot" element={<TeamSeriesAPDPlotPage />} />
        <Route path="/driver" element={<DriverPage />} />
      </Routes>
    </Router>
  );
};

export default App;