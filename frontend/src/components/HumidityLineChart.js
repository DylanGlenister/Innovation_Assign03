import * as React from 'react';
import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

// Manually map each city to its respective state
const cityStateMapping = {
  "NSW": [
    "Albury", "Badgerys Creek", "Cobar", "Coffs Harbour", "Moree", "Newcastle", 
    "Norah Head", "Norfolk Island", "Penrith", "Richmond", "Sydney", "Sydney Airport", 
    "Wagga Wagga", "Williamtown", "Wollongong"
  ],
  "VIC": [
    "Ballarat", "Bendigo", "Sale", "Melbourne Airport", "Melbourne", "Mildura", 
    "Nhil", "Portland", "Watsonia", "Dartmoor"
  ],
  "QLD": ["Brisbane", "Cairns", "Gold Coast", "Townsville"],
  "SA": ["Adelaide", "Mount Gambier", "Nuriootpa", "Woomera"],
  "WA": ["Albany", "Witchcliffe", "Pearce RAAF", "Perth Airport", "Perth", "Salmon Gums", "Walpole"],
  "TAS": ["Hobart", "Launceston"],
  "NT": ["Alice Springs", "Darwin", "Katherine", "Uluru"],
  "ACT": ["Canberra", "Tuggeranong", "Mount Ginini"]
};

export default function HumidityLineChart() {
  const [dataset, setDataset] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState({ month: 6, year: 2008 }); // Default to July 2008
  const [selectedCity, setSelectedCity] = useState("Melbourne"); // Default city

  const MIN_YEAR = 2008;
  const MIN_MONTH = 6; // July (0-indexed)
  const MAX_YEAR = 2017;
  const MAX_MONTH = 5; // June (0-indexed)

  const months = [
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
          const dateStr = columns[0]?.trim();
          const location = columns[1]?.trim();
          const humidity9amStr = columns[13]?.trim(); // Adjust index to match 'Humidity9am' column in your CSV
          const humidity3pmStr = columns[14]?.trim(); // Adjust index to match 'Humidity3pm' column in your CSV

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
  }, [selectedMonth, selectedCity]);

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    if (selectedMonth.year === MAX_YEAR && newMonth > MAX_MONTH) {
      setSelectedMonth(prev => ({ ...prev, month: MAX_MONTH }));
    } else {
      setSelectedMonth(prev => ({ ...prev, month: newMonth }));
    }
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    if (newYear === MAX_YEAR && selectedMonth.month > MAX_MONTH) {
      setSelectedMonth({ month: MAX_MONTH, year: newYear });
    } else {
      setSelectedMonth(prev => ({ ...prev, year: newYear }));
    }
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  const isMonthDisabled = (month) => {
    if (selectedMonth.year === MIN_YEAR && month < MIN_MONTH) return true;
    if (selectedMonth.year === MAX_YEAR && month > MAX_MONTH) return true;
    return false;
  };

  return (
    <div>
      <h1>Humidity Data by Location</h1>
      <div>
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
        <label> Month: </label>
        <select onChange={handleMonthChange} value={selectedMonth.month}>
          {months.map((m) => (
            <option key={m.value} value={m.value} disabled={isMonthDisabled(m.value)}>
              {m.label}
            </option>
          ))}
        </select>
        <label> Year: </label>
        <select onChange={handleYearChange} value={selectedMonth.year}>
          {years.map((year) => (
            <option key={year} value={year} disabled={year < MIN_YEAR || year > MAX_YEAR}>
              {year}
            </option>
          ))}
        </select>
      </div>
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
