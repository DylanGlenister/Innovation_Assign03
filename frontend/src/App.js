import React from 'react';
import Map from './components/Map'; 
import TempLineChart from './components/TempLineChart';
import './App.css';


function App() {
  return (
    <div>
      <h1>Victoria Weather Overview</h1>
      <section>
        <h2>Victoria Weather Map</h2>
        <Map /> {/* Ensure this matches the component name */}
      </section>
      <section>
        
        <TempLineChart />
      </section>
    </div>
  );
}

export default App;
