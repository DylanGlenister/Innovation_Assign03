import * as React from 'react';
import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import cityStateMapping from '../components/cityStateMapping';

export default function HumidityLineChart() {
  const [dataset, setDataset] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date(2008, 6)); // Default to July 2008
  const [selectedCity, setSelectedCity] = useState("Melbourne");

  const minDate = new Date(2008, 6); // July 2008
  const maxDate = new Date(2017, 5); // June 2017

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('http://localhost:8000/data/weatherAUS.csv');
        if (!response.ok) throw new Error("Failed to fetch CSV data");

        const csvText = await response.text();
        const allData = csvText.split('\n').map((row, index) => {
          if (index === 0) return null; // Skip header row, if any
          const columns = row.split(',');
          const dateStr = columns[0]?.trim();
          const location = columns[1]?.trim();
          const humidity9amStr = columns[13]?.trim(); // Adjust index to match 'Humidity9am' column
          const humidity3pmStr = columns[14]?.trim(); // Adjust index to match 'Humidity3pm' column

          const humidity9am = parseFloat(humidity9amStr);
          const humidity3pm = parseFloat(humidity3pmStr);

          const [day, month, year] = dateStr.split('-');
          const parsedDate = new Date(`${year}-${month}-${day}`);

          return { 
            date: parsedDate, 
            location,
            humidity9am,
            humidity3pm
          };
        }).filter(Boolean); // Filter out any null entries

        // Filter data for the selected city, month, and year
        const filteredData = allData.filter(row =>
          row.location === selectedCity &&
          row.date.getFullYear() === selectedDate.getFullYear() &&
          row.date.getMonth() === selectedDate.getMonth()
        );

        // Create an array with placeholders for all days in the selected month
        const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
        const monthData = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const entry = filteredData.find(d => d.date.getDate() === day);
          return {
            x: day,
            humidity9am: entry ? entry.humidity9am : null,
            humidity3pm: entry ? entry.humidity3pm : null,
          };
        });

        setDataset(monthData);
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    }

    fetchData();
  }, [selectedDate, selectedCity]);

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  return (
    <div>
      <h1>Humidity Data by Location</h1>

      <label>City: </label>
      <select onChange={handleCityChange} value={selectedCity}>
        {Object.keys(cityStateMapping).sort().map((state) => (
          <optgroup label={`---${state}---`} key={state}>
            {cityStateMapping[state].sort().map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <label>Month: </label>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        dateFormat="yyyy/MM"
        showMonthYearPicker
        minDate={minDate}
        maxDate={maxDate}
      />

      <LineChart
        dataset={dataset}
        xAxis={[{ dataKey: 'x', label: 'Day' }]}
        series={[
          { dataKey: 'humidity9am', label: 'Humidity 9AM (%)' },
          { dataKey: 'humidity3pm', label: 'Humidity 3PM (%)' }
        ]}
        height={300}
        margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
        grid={{ vertical: true, horizontal: true }}
      />
    </div>
  );
}
