import React from 'react';
import TemperatureAnomalyChart from './components/TemperatureAnomalyChart';
import HumidityLineChart from './components/HumidityLineChart';

function App() {
  return (
    <div>
      <h1>Victoria Weather Overview</h1>

      {/* Temperature Line Chart Section */}
      <section>
        <h2>Humidity Data by Location</h2>
        <HumidityLineChart />
      </section>

      {/* Humidity Stacked Area Chart Section */}
      <section>
        <h2>Temperature Trend</h2>
        <TemperatureAnomalyChart />
      </section>
    </div>
  );
}

export default App;
