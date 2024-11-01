import React from 'react';
import HumidityLineChart from '../components/HumidityLineChart';
import TempScatterChart from '../components/TempScatterChart';

function DataViz() {
  return (
    <div id="visualisation_page" style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Data Visualization Page</h1>
      <p>This page displays both temperature and humidity data visualizations.</p>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Humidity Chart</h2>
        <HumidityLineChart />
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Temperature Chart</h2>
        <TempScatterChart />
      </div>
    </div>
  );
}

export default DataViz;
