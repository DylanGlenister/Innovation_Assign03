import React from 'react';
import HumidityLineChart from '../components/HumidityLineChart';
import TempScatterChart from '../components/TempScatterChart';

function DataViz() {
  return (
    <div id="visualisation_page">
      <h1>Data Visualization Page</h1>
      <p>This page displays both temperature and humidity data visualizations.</p>
      
      <div id="humidity_chart">
        <h2>Humidity Chart</h2>
        <HumidityLineChart />
      </div>

      <div id="temperature_chart">
        <h2>Temperature Chart</h2>
        <TempScatterChart />
      </div>
    </div>
  );
}

export default DataViz;
