import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import cityStateMapping from '../components/cityStateMapping'; // Adjust the path as needed
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure'; // Adjust the path as needed

const PredictTemp = () => {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("2008-07-14");
  const [selectedLocation, setSelectedLocation] = useState("Melbourne");
  const [predictedMinTemp, setPredictedMinTemp] = useState(null);
  const chartRef = useRef();

  const fetchData = async (date, location) => {
    const endDate = new Date(date);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 13);

    const dataResponse = await d3.csv("http://localhost:8000/data/weatherAUS_processed.csv");

    const filteredData = dataResponse
      .filter((row) => {
        const rowDate = new Date(`${row.Year}-${row.Month}-${row.Day}`);
        return (
          row.Location === location &&
          rowDate >= startDate &&
          rowDate <= endDate // Include end date
        );
      });

    // Use `parseCsvData` to format the filtered data
    const parsedData = parseCsvData(filteredData);
    setData(parsedData);

    // Build the payload using `buildPredictPayload`, but we only care about the MinTemp
    const payload = buildPredictPayload(parsedData);

    try {
      const predictionResponse = await axios.post("http://localhost:8000/api/v1/endpoints/models/linear/predict", payload);
      setPredictedMinTemp(predictionResponse.data.Result.MinTemp); // Store the predicted temperature
    } catch (error) {
      console.error("Error fetching prediction:", error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedLocation);
  }, [selectedDate, selectedLocation]);

  useEffect(() => {
    if (data.length > 0) {
      d3.select(chartRef.current).selectAll("*").remove();
  
      const width = 600;
      const height = 300;
      const margin = { top: 20, right: 30, bottom: 60, left: 40 };
  
      const svg = d3
        .select(chartRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      const x = d3.scaleBand()
        .domain(data.map(d => d.date.toLocaleDateString("en-GB"))) // Use the date field from CSV
        .range([0, width - margin.left - margin.right])
        .padding(0.2);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max([...data.map(d => d.MinTemp || 0), predictedMinTemp || 0])])
        .range([height - margin.top - margin.bottom, 0]);
  
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
  
      svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}°C`));
  
      // Render the original data bars
      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.date.toLocaleDateString("en-GB"))) // Use the formatted date directly
        .attr("width", x.bandwidth())
        .attr("y", (d) => d.MinTemp !== null && d.date.toLocaleDateString("en-GB") !== new Date(selectedDate).toLocaleDateString("en-GB") ? y(d.MinTemp) : height) // Only draw the original bar if it's not the selected date
        .attr("height", (d) => d.MinTemp !== null && d.date.toLocaleDateString("en-GB") !== new Date(selectedDate).toLocaleDateString("en-GB") ? height - margin.top - margin.bottom - y(d.MinTemp) : 0) // Set height to 0 for the selected date
        .attr("fill", "steelblue");
  
      // Render a new bar for the predicted value at the selected date
      if (predictedMinTemp !== null) {
        svg.append("rect")
          .attr("class", "predicted-bar")
          .attr("x", x(new Date(selectedDate).toLocaleDateString("en-GB"))) // Position it on the selected date
          .attr("width", x.bandwidth()) // Same width as other bars
          .attr("y", y(predictedMinTemp)) // Set the height according to the predicted temperature
          .attr("height", height - margin.top - margin.bottom - y(predictedMinTemp)) // Calculate height
          .attr("fill", "orange"); // Fill color for the predicted bar
      }
    }
  }, [data, predictedMinTemp, selectedDate]);
  
  

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  return (
    <div>
      <h1>Weather Prediction</h1>
      <label>Select a date: </label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <br />
      <label>Select a location: </label>
      <select value={selectedLocation} onChange={handleLocationChange}>
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
      <div ref={chartRef}>
        {data.length === 0 && <p>Loading data...</p>}
      </div>
      {predictedMinTemp !== null && <p>Predicted Minimum Temperature for {selectedDate}: {predictedMinTemp}°C</p>}
    </div>
  );
};

export default PredictTemp;
