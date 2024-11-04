import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure';
import '../components/styles.css';

const PredictRainfall = ({ selectedDate, selectedLocation }) => {
  const [data, setData] = useState([]);
  const [predictedRainfall, setPredictedRainfall] = useState(null);
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

    const parsedData = parseCsvData(filteredData);
    setData(parsedData);

    const payload = buildPredictPayload(parsedData);

    try {
      const predictionResponse = await axios.post("http://localhost:8000/api/v1/endpoints/models/linear/predict", payload);
      setPredictedRainfall(predictionResponse.data.Result.Rainfall);
    } catch (error) {
      console.error("Error fetching rainfall prediction:", error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedLocation);
  }, [selectedDate, selectedLocation]); // Ensure that fetchData is re-triggered when selectedDate or selectedLocation changes

  useEffect(() => {
    const margin = { top: 60, right: 100, bottom: 80, left: 80 };
    const width = 600;
    const height = 400;

    if (!chartRef.current) return;

    d3.select(chartRef.current).select("svg").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const extendedData = [
      ...data.map(d => ({
        ...d,
        date: new Date(d.date),
        Rainfall: isNaN(d.Rainfall) ? null : +d.Rainfall,
      })),
      ...(predictedRainfall !== null
        ? [{ date: new Date(selectedDate), Rainfall: predictedRainfall }]
        : [])
    ];

    const x = d3.scaleBand()
      .domain(extendedData.map(d => d.date))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(extendedData, d => d.Rainfall || 0)])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m/%Y")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d} mm`));

    svg.selectAll(".bar")
      .data(extendedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.date))
      .attr("y", d => y(d.Rainfall))
      .attr("width", x.bandwidth())
      .attr("height", d => Math.max(0, height - y(d.Rainfall))) // Ensures non-negative height
      .attr("fill", d => d.date.getTime() === new Date(selectedDate).getTime() ? "orange" : "blue");

    if (predictedRainfall !== null) {
      svg.append("text")
        .attr("x", x(new Date(selectedDate)) - 20)
        .attr("y", y(predictedRainfall) - 10)
        .text(`Predicted: ${predictedRainfall} mm`)
        .attr("font-size", "10px")
        .attr("fill", "orange");
    }
  }, [data, predictedRainfall, selectedDate]); // Re-render the chart when data, predictedRainfall, or selectedDate changes

  return (
    <div className="predict-container">
      <h2>Rainfall Prediction</h2>
      <div className="chart-container" ref={chartRef}>
        {data.length === 0 && <p>Loading data...</p>}
      </div>
      {predictedRainfall !== null && (
        <p>Predicted Rainfall for {selectedDate} at {selectedLocation}: {predictedRainfall} mm</p>
      )}
    </div>
  );
};

export default PredictRainfall;
