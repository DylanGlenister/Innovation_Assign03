import React from 'react';
import HumidityLineChart from '../components/HumidityLineChart';
import TempScatterChart from '../components/TempScatterChart';

function DataViz() {
  return (
    <div id="main_page">
      <div id="visualisation_page">
        <h1>Data Visualisation Page</h1>
        <p>This page displays both temperature and humidity data charts. Scroll down to access both visualisations.</p>
      </div>
      
      <div id="humidity_chart">
        <h2>Humidity Chart</h2>
        <HumidityLineChart />
      </div>

      <div id="temperature_chart">
        <h2>Temperature Chart</h2>
        <TempScatterChart />
      </div>

      <hr></hr>
      <footer id="footer">
        <p>&copy; Group 69 @ Swinburne 2024</p>
      </footer>
    </div>
  );
}

export default DataViz;
