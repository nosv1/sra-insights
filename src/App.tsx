import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
// import HomePage from './pages/HomePage';
import DriverPage from './pages/DriverPage';
import './App.css'
import TeamSeries from './pages/TeamSeries';

const App: React.FC = () => {
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
            <Link to="/team-series">Team Series</Link>
          </li>
        </ul>
      </nav>
      <Routes>
        {/* <Route path="/" element={<HomePage />} /> */}
        <Route path="/team-series" element={<TeamSeries />} />
        <Route path="/driver" element={<DriverPage />} />
      </Routes>
    </Router>
  );
};

export default App;