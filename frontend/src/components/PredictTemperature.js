import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure';
import '../components/styles.css';

const PredictTemperature = ({ selectedDate, selectedLocation }) => {
  const [data, setData] = useState([]);
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

    const parsedData = parseCsvData(filteredData);
    setData(parsedData);

    const payload = buildPredictPayload(parsedData);

    try {
      const predictionResponse = await axios.post("http://localhost:8000/api/v1/endpoints/models/linear/predict", payload);
      setPredictedMinTemp(predictionResponse.data.Result.MinTemp);
      setPredictedMaxTemp(predictionResponse.data.Result.MaxTemp);
    } catch (error) {
      console.error("Error fetching temperature prediction:", error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedLocation);
  }, [selectedDate, selectedLocation]);

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
        MinTemp: isNaN(d.MinTemp) ? null : +d.MinTemp,
        MaxTemp: isNaN(d.MaxTemp) ? null : +d.MaxTemp,
      })),
      ...(predictedMinTemp !== null && predictedMaxTemp !== null
        ? [{ date: new Date(selectedDate), MinTemp: predictedMinTemp, MaxTemp: predictedMaxTemp }]
        : [])
    ];

    const x = d3.scaleTime()
      .domain(d3.extent(extendedData, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(extendedData, d => Math.max(d.MinTemp || 0, d.MaxTemp || 0))])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m/%Y")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}°C`));

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
  }, [data, predictedMinTemp, predictedMaxTemp, selectedDate]);

  return (
    <div className="predict-container">
      <h2>Temperature Prediction</h2>
      <div className="chart-container" ref={chartRef}>
        {data.length === 0 && <p>Loading data...</p>}
      </div>
      {predictedMinTemp !== null && predictedMaxTemp !== null && (
        <p>
          Predicted Minimum Temperature for {selectedDate}: {predictedMinTemp}°C<br />
          Predicted Maximum Temperature for {selectedDate}: {predictedMaxTemp}°C
        </p>
      )}
    </div>
  );
};

export default PredictTemperature;
