import * as React from 'react';
import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

export default function TempLineChart() {
  const [dataset, setDataset] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState({ month: 6, year: 2008 }); // Default to July 2008
  const [selectedCity, setSelectedCity] = useState("Melbourne"); // Default city
  const [cities, setCities] = useState([]); // Dynamically populated cities
  const [availableMonths, setAvailableMonths] = useState([]); // Filtered months

  // Data range in the CSV file
  const MIN_YEAR = 2008;
  const MAX_YEAR = 2017;

  const allMonths = [
    { label: "January", value: 0 },
    { label: "February", value: 1 },
    { label: "March", value: 2 },
    { label: "April", value: 3 },
    { label: "May", value: 4 },
    { label: "June", value: 5 },
    { label: "July", value: 6 },
    { label: "August", value: 7 },
    { label: "September", value: 8 },
    { label: "October", value: 9 },
    { label: "November", value: 10 },
    { label: "December", value: 11 }
  ];

  const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('http://localhost:8000/data/weatherAUS.csv'); // Ensure this path is correct
        if (!response.ok) throw new Error("Failed to fetch CSV data");

        const csvText = await response.text();
        const allData = csvText.split('\n').map((row, index) => {
          if (index === 0) return null; // Skip header row, if any
          const columns = row.split(',');
          const dateStr = columns[0]?.trim(); // Date should be in the first column
          const location = columns[1]?.trim(); // Assuming Location is in the second column
          const minTempStr = columns[2]?.trim(); // Assuming MinTemp is in the third column
          const maxTempStr = columns[3]?.trim(); // Assuming MaxTemp is in the fourth column

          const minTemperature = parseFloat(minTempStr);
          const maxTemperature = parseFloat(maxTempStr);

          // Parse date in DD-MM-YYYY format
          const [day, month, year] = dateStr.split('-');
          const parsedDate = new Date(`${year}-${month}-${day}`);

          return { 
            date: parsedDate, 
            location,
            minTemp: minTemperature,
            maxTemp: maxTemperature
          };
        }).filter(Boolean); // Filter out any null entries

        // Get unique cities and filter out empty values
        const uniqueCities = [...new Set(allData.map(row => row.location).filter(location => location && location.trim() !== ""))];
        setCities(uniqueCities); // Update the cities state dynamically

        // Filter available months for the selected city and year
        const monthsForYear = allData
          .filter(row => row.location === selectedCity && row.date.getFullYear() === selectedMonth.year)
          .map(row => row.date.getMonth());
        
        const uniqueMonths = [...new Set(monthsForYear)].sort();
        setAvailableMonths(allMonths.filter(month => uniqueMonths.includes(month.value)));

        // Filter data for the selected city, month, and year
        const filteredData = allData.filter(row =>
          row.location === selectedCity &&
          row.date.getFullYear() === selectedMonth.year &&
          row.date.getMonth() === selectedMonth.month
        );

        // Create an array with placeholders for all days in the selected month
        const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
        const monthData = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const entry = filteredData.find(d => d.date.getDate() === day);
          return {
            x: day,
            minTemp: entry ? entry.minTemp : null, // Use null if data is missing
            maxTemp: entry ? entry.maxTemp : null, // Use null if data is missing
          };
        });

        setDataset(monthData);
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    }

    fetchData();
  }, [selectedMonth, selectedCity]);

  // Update selected month and year, with auto-adjustment
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setSelectedMonth(prev => ({ ...prev, month: newMonth }));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setSelectedMonth(prev => ({ ...prev, year: newYear }));
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  return (
    <div>
      <h1>Temperature Data by Location</h1>
      <div>
        <label>City: </label>
        <select onChange={handleCityChange} value={selectedCity}>
          {cities.map((city, index) => (
            <option key={index} value={city}>
              {city}
            </option>
          ))}
        </select>
        <label> Month: </label>
        <select onChange={handleMonthChange} value={selectedMonth.month}>
          {availableMonths.map((m, index) => (
            <option key={index} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <label> Year: </label>
        <select onChange={handleYearChange} value={selectedMonth.year}>
          {years.map((year, index) => (
            <option key={index} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <LineChart
        dataset={dataset}
        xAxis={[{ dataKey: 'x', label: 'Day' }]}
        series={[
          { dataKey: 'minTemp', label: 'Min Temperature' },
          { dataKey: 'maxTemp', label: 'Max Temperature' }
        ]}
        height={300}
        margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
        grid={{ vertical: true, horizontal: true }}
      />
    </div>
  );
}
