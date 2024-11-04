import React, { useState } from 'react';
import PredictTemperature from '../components/PredictTemperature';
import PredictedWindGustSpeed from '../components/PredictWindGustSpeed';
import PredictHumidity from '../components/PredictHumidity';
import DateLocationSelector from '../components/DateLocationSelector';

function Predict() {
    const [selectedDate, setSelectedDate] = useState("2008-07-14");
    const [selectedLocation, setSelectedLocation] = useState("Melbourne");

    return (
        <div>
            <h1>Weather Prediction</h1>
            <DateLocationSelector
                selectedDate={selectedDate}
                selectedLocation={selectedLocation}
                onDateChange={setSelectedDate}
                onLocationChange={setSelectedLocation}
            />
            <PredictTemperature selectedDate={selectedDate} selectedLocation={selectedLocation} />
            <PredictedWindGustSpeed selectedDate={selectedDate} selectedLocation={selectedLocation} />
            <PredictHumidity selectedDate={selectedDate} selectedLocation={selectedLocation} />
        </div>
    );
}

export default Predict;
