import React from 'react';
import cityStateMapping from '../components/cityStateMapping'; // Import cityStateMapping

function DateLocationSelector({ selectedDate, selectedLocation, onDateChange, onLocationChange }) {
    return (
        <div className="date-location-selector">
            <label>Select a date: </label>
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
            />
            <br />
            <label>Select a location: </label>
            <select value={selectedLocation} onChange={(e) => onLocationChange(e.target.value)}>
                {Object.entries(cityStateMapping).map(([state, cities]) => (
                    <optgroup key={state} label={`--${state}--`}>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}

export default DateLocationSelector;
