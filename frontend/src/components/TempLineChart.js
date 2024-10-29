import * as React from 'react';
import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

export default function TempLineChart() {
  const [dataset, setDataset] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState({ month: 6, year: 2008 }); // Default to July 2008

  // Data range in the CSV file
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
        const response = await fetch('http://localhost:8000/data/victoria_weather.csv'); // Ensure this path is correct
        if (!response.ok) throw new Error("Failed to fetch CSV data");

        const csvText = await response.text();
        const data = csvText.split('\n').map((row, index) => {
          if (index === 0) return null; // Skip header row, if any
          const columns = row.split(',');
          const date = columns[0]?.trim(); // Date should be in the first column
          const location = columns[1]?.trim(); // Assuming Location is in the second column
          const minTempStr = columns[2]?.trim(); // Assuming MinTemp is in the third column

          // Filter for Melbourne and valid numeric minTemp
          if (location !== 'Melbourne' || isNaN(parseFloat(minTempStr))) {
            return null;
          }

          const minTemperature = parseFloat(minTempStr);

          // Parse date in DD/MM/YYYY format
          const [day, month, year] = date.split('/');
          const parsedDate = new Date(`${year}-${month}-${day}`);

          return { 
            date: parsedDate, 
            minTemp: minTemperature 
          };
        }).filter(Boolean); // Filter out any null entries

        // Filter for the selected month and year
        const filteredData = data.filter(row => 
          row.date.getFullYear() === selectedMonth.year && 
          row.date.getMonth() === selectedMonth.month
        );

        // Prepare data for the chart
        const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
        const monthData = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const entry = filteredData.find(d => d.date.getDate() === day);
          return {
            x: day,
            minTemp: entry ? entry.minTemp : null, // Use null if data is missing
          };
        });

        setDataset(monthData);
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    }

    fetchData();
  }, [selectedMonth]);

  // Update selected month and year, with auto-adjustment
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);

    // Auto-correct if user selects December in 2017, change month to June
    if (selectedMonth.year === MAX_YEAR && newMonth > MAX_MONTH) {
      setSelectedMonth(prev => ({ ...prev, month: MAX_MONTH }));
    } else {
      setSelectedMonth(prev => ({ ...prev, month: newMonth }));
    }
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);

    // Auto-correct if user selects 2017 and a month after June
    if (newYear === MAX_YEAR && selectedMonth.month > MAX_MONTH) {
      setSelectedMonth({ month: MAX_MONTH, year: newYear });
    } else {
      setSelectedMonth(prev => ({ ...prev, year: newYear }));
    }
  };

  // Determine if a month should be disabled based on the selected year
  const isMonthDisabled = (month) => {
    if (selectedMonth.year === MIN_YEAR && month < MIN_MONTH) return true;
    if (selectedMonth.year === MAX_YEAR && month > MAX_MONTH) return true;
    return false;
  };

  return (
    <div>
      <h1>Melbourne Minimum Temperature Data</h1>
      <div>
        <label>Month: </label>
        <select onChange={handleMonthChange} value={selectedMonth.month}>
          {months.map((m, index) => (
            <option key={index} value={m.value} disabled={isMonthDisabled(m.value)}>
              {m.label}
            </option>
          ))}
        </select>
        <label> Year: </label>
        <select onChange={handleYearChange} value={selectedMonth.year}>
          {years.map((year, index) => (
            <option key={index} value={year} disabled={year < MIN_YEAR || year > MAX_YEAR}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <LineChart
        dataset={dataset}
        xAxis={[{ dataKey: 'x', label: 'Day' }]}
        series={[{ dataKey: 'minTemp', label: 'Min Temperature' }]}
        height={300}
        margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
        grid={{ vertical: true, horizontal: true }}
      />
    </div>
  );
}
