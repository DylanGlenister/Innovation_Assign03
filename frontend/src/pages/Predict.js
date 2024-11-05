import React, { useState } from 'react';
import PredictTemperature from '../components/PredictTemperature';
import PredictedWindGustSpeed from '../components/PredictWindGustSpeed';
import PredictHumidity from '../components/PredictHumidity';
import DateLocationSelector from '../components/DateLocationSelector';

function Predict() {
    const [selectedDate, setSelectedDate] = useState("2008-07-14");
    const [selectedLocation, setSelectedLocation] = useState("Melbourne");

    return (
        <div id="main_page">
            <h1>Weather Prediction</h1>
            <DateLocationSelector
                selectedDate={selectedDate}
                selectedLocation={selectedLocation}
                onDateChange={setSelectedDate}
                onLocationChange={setSelectedLocation}
            />

            {/* Each prediction in its own container */}
            <div className="prediction-container">
                <h2>Temperature Prediction</h2>
                <PredictTemperature selectedDate={selectedDate} selectedLocation={selectedLocation} />
            </div>
            
            <div className="prediction-container">
                <h2>Wind Gust Speed Prediction</h2>
                <PredictedWindGustSpeed selectedDate={selectedDate} selectedLocation={selectedLocation} />
            </div>

            <div className="prediction-container">
                <h2>Humidity Prediction</h2>
                <PredictHumidity selectedDate={selectedDate} selectedLocation={selectedLocation} />
            </div>

            <hr />
            <footer id="footer">
                <p>&copy; Group 69 @ Swinburne 2024</p>
            </footer>
        </div>
    );
}

export default Predict;
