import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import cityStateMapping from '../components/cityStateMapping';
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure';
import '../components/styles.css';

const PredictTemp = () => {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("2008-07-14");
  const [selectedLocation, setSelectedLocation] = useState("Melbourne");
  const [predictedMinTemp, setPredictedMinTemp] = useState(null);
  const [predictedMaxTemp, setPredictedMaxTemp] = useState(null);
  const chartRef = useRef();

  const fetchData = async (date, location) => {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() - 1); // Set endDate to t-1
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 13); // Set startDate to t-14
  
    const dataResponse = await d3.csv("http://localhost:8000/data/weatherAUS_processed.csv");
  
    const filteredData = dataResponse
      .filter((row) => {
        const rowDate = new Date(`${row.Year}-${row.Month}-${row.Day}`);
        return (
          row.Location === location &&
          rowDate >= startDate &&
          rowDate <= endDate // Includes dates from t-14 to t-1
        );
      });
  
    console.log("Filtered Data:", filteredData); // Logs filtered data for 13 days
  
    const parsedData = parseCsvData(filteredData);
    setData(parsedData);
  
    console.log("Parsed Data:", parsedData); // Logs parsed data after parsing/filtering
  
    const payload = buildPredictPayload(parsedData);
    console.log("Prediction Payload:", payload); // Logs payload to be sent for prediction
  
    try {
      const predictionResponse = await axios.post("http://localhost:8000/api/v1/endpoints/models/linear/predict", payload);
      setPredictedMinTemp(predictionResponse.data.Result.MinTemp); 
      setPredictedMaxTemp(predictionResponse.data.Result.MaxTemp);
  
      console.log("Prediction Response:", predictionResponse.data); // Logs prediction response
    } catch (error) {
      console.error("Error fetching prediction:", error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedLocation);
  }, [selectedDate, selectedLocation]);

  useEffect(() => {
    const margin = { top: 60, right: 100, bottom: 80, left: 80 };

    // Debounce function to limit the rate of resize events
    const debounce = (func, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    };

    const resizeChart = () => {
      if (!chartRef.current) return; // Prevent further execution if ref is null

      const width = chartRef.current.clientWidth - margin.left - margin.right;
      const height = chartRef.current.clientHeight - margin.top - margin.bottom;
      
      d3.select(chartRef.current).select("svg").remove(); // Clear previous SVG
  
      const svg = d3
        .select(chartRef.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const extendedData = [
        ...data.map(d => ({
          ...d,
          date: new Date(d.date),
          MinTemp: isNaN(d.MinTemp) ? null : +d.MinTemp,
          MaxTemp: isNaN(d.MaxTemp) ? null : +d.MaxTemp,
        })),
        ...(predictedMinTemp !== null && predictedMaxTemp !== null
          ? [{ date: new Date(selectedDate), MinTemp: predictedMinTemp, MaxTemp: predictedMaxTemp }]
          : [])
      ];

      const x = d3.scaleTime()
        .domain(d3.extent(extendedData, d => d.date))
        .range([0, width - margin.left - margin.right]);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(extendedData, d => Math.max(d.MinTemp || 0, d.MaxTemp || 0))])
        .range([height - margin.top - margin.bottom, 0]);
  
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m/%Y")))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
  
      svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}°C`));
  
      const area = d3.area()
        .x(d => x(d.date))
        .y0(d => y(d.MinTemp))
        .y1(d => y(d.MaxTemp))
        .curve(d3.curveMonotoneX);
  
      svg.append("path")
        .datum(extendedData)
        .attr("fill", "url(#temperature-gradient)")
        .attr("d", area);
  
      svg.append("defs").append("linearGradient")
        .attr("id", "temperature-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")
        .selectAll("stop")
        .data([
          { offset: "0%", color: "lightblue" },
          { offset: "100%", color: "lightsteelblue" }
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
  
      const minLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.MinTemp))
        .curve(d3.curveMonotoneX);
  
      const maxLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.MaxTemp))
        .curve(d3.curveMonotoneX);
  
      svg.append("path")
        .datum(extendedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", minLine);
  
      svg.append("path")
        .datum(extendedData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", maxLine);
  
      svg.selectAll(".min-temp-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "min-temp-point")
        .attr("cx", d => x(new Date(d.date)))
        .attr("cy", d => y(d.MinTemp))
        .attr("r", 3)
        .attr("fill", "steelblue");
  
      svg.selectAll(".max-temp-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "max-temp-point")
        .attr("cx", d => x(new Date(d.date)))
        .attr("cy", d => y(d.MaxTemp))
        .attr("r", 3)
        .attr("fill", "red");
  
      if (predictedMinTemp !== null) {
        svg.append("circle")
          .attr("cx", x(new Date(selectedDate)))
          .attr("cy", y(predictedMinTemp))
          .attr("r", 5)
          .attr("fill", "orange");
  
        svg.append("text")
          .attr("x", x(new Date(selectedDate)) - 75)
          .attr("y", y(predictedMinTemp) + 30)
          .text(`Pred Min: ${predictedMinTemp}°C`)
          .attr("font-size", "10px")
          .attr("fill", "orange");
      }
  
      if (predictedMaxTemp !== null) {
        svg.append("circle")
          .attr("cx", x(new Date(selectedDate)))
          .attr("cy", y(predictedMaxTemp))
          .attr("r", 5)
          .attr("fill", "purple");
  
        svg.append("text")
          .attr("x", x(new Date(selectedDate)) - 75)
          .attr("y", y(predictedMaxTemp) - 10)
          .text(`Pred Max: ${predictedMaxTemp}°C`)
          .attr("font-size", "10px")
          .attr("fill", "purple");
      }

      // Adding Legend
      const legend = svg.append("g")
        .attr("transform", `translate(0, ${height + margin.bottom - 300})`); // Bottom-left position

      const legendData = [
        { color: "steelblue", label: "Min Temperature" },
        { color: "red", label: "Max Temperature" },
        { color: "orange", label: "Pred Min Temp" },
        { color: "purple", label: "Pred Max Temp" }
      ];

      legend.selectAll("circle")
        .data(legendData)
        .enter()
        .append("circle")
        .attr("cx", 10)
        .attr("cy", (d, i) => i * 20)
        .attr("r", 5)
        .style("fill", d => d.color);

      legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 5)
        .text(d => d.label)
        .attr("font-size", "10px")
        .attr("alignment-baseline", "middle");
    };

    // Initial render and resize observer setup
    setTimeout(resizeChart, 100); // Delay to allow rendering
    const resizeObserver = new ResizeObserver(debounce(resizeChart, 100)); // Use debounce for resize
    resizeObserver.observe(chartRef.current);

    return () => {
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current);
      }
    };
  }, [data, predictedMinTemp, predictedMaxTemp, selectedDate]);

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  return (
    <div className="predict-container">
      <div className="predict-sidebar">
        <h1 className="predict-text">Weather Prediction</h1>
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
        {predictedMinTemp !== null && predictedMaxTemp !== null && (
          <p>
            Predicted Minimum Temperature for {selectedDate}: {predictedMinTemp}°C<br />
            Predicted Maximum Temperature for {selectedDate}: {predictedMaxTemp}°C
          </p>
        )}
      </div>
      <div className="chart-container" ref={chartRef}>
        {data.length === 0 && <p>Loading data...</p>}
      </div>
    </div>
  );
}

export default PredictTemp;
