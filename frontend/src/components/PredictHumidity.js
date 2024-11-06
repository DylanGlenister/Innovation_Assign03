import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure';
import '../components/styles.css';

const PredictHumidity = ({ selectedDate, selectedLocation }) => {
  const [data, setData] = useState([]);
  const [predictedHumidity9am, setPredictedHumidity9am] = useState(null);
  const [predictedHumidity3pm, setPredictedHumidity3pm] = useState(null);
  const [selectedModel, setSelectedModel] = useState("linear"); // Default to linear
  const chartRef = useRef();

  const fetchData = async (date, location) => {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() - 1); 
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 13); 

    const dataResponse = await d3.csv("http://localhost:8000/data/weatherAUS_processed.csv");

    const filteredData = dataResponse.filter((row) => {
      const rowDate = new Date(`${row.Year}-${row.Month}-${row.Day}`);
      return (
        row.Location === location &&
        rowDate >= startDate &&
        rowDate <= endDate
      );
    });

    const parsedData = parseCsvData(filteredData);
    setData(parsedData);

    const payload = buildPredictPayload(parsedData);

    try {
      const predictionResponse = await axios.post(
        `http://localhost:8000/api/v1/endpoints/models/${selectedModel}/predict`, 
        payload
      );
      setPredictedHumidity9am(predictionResponse.data.Result.Humidity9am);
      setPredictedHumidity3pm(predictionResponse.data.Result.Humidity3pm);
    } catch (error) {
      console.error("Error fetching predicted humidity:", error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedLocation);
  }, [selectedDate, selectedLocation, selectedModel]); // Update when model changes

  useEffect(() => {
    const margin = { top: 60, right: 100, bottom: 80, left: 80 };
    const width = 600;
    const height = 400;

    if (!chartRef.current) return;

    d3.select(chartRef.current).select("svg").remove();

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const parsedData = data.map(d => ({
      date: new Date(d.date),
      Humidity9am: isNaN(d.Humidity9am) ? null : +d.Humidity9am,
      Humidity3pm: isNaN(d.Humidity3pm) ? null : +d.Humidity3pm,
    })).filter(d => d.Humidity9am !== null && d.Humidity3pm !== null);

    const extendedData = [
      ...parsedData,
      ...(predictedHumidity9am !== null && predictedHumidity3pm !== null
        ? [{ date: new Date(selectedDate), Humidity9am: predictedHumidity9am, Humidity3pm: predictedHumidity3pm }]
        : [])
    ];

    const x = d3.scaleTime()
      .domain(d3.extent(extendedData, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    const line9am = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.Humidity9am))
      .curve(d3.curveMonotoneX);

    const line3pm = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.Humidity3pm))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(extendedData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line9am);

    svg.append("path")
      .datum(extendedData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("d", line3pm);

    if (predictedHumidity9am !== null && predictedHumidity3pm !== null) {
      const predictionDate = new Date(selectedDate);

      svg.append("circle")
        .attr("cx", x(predictionDate))
        .attr("cy", y(predictedHumidity9am))
        .attr("r", 5)
        .attr("fill", "orange");

      svg.append("text")
        .attr("x", x(predictionDate) + 5)
        .attr("y", y(predictedHumidity9am) - 10)
        .text(`Predicted 9 am Humidity: ${predictedHumidity9am}%`)
        .attr("font-size", "12px")
        .attr("fill", "orange");

      svg.append("circle")
        .attr("cx", x(predictionDate))
        .attr("cy", y(predictedHumidity3pm))
        .attr("r", 5)
        .attr("fill", "purple");

      svg.append("text")
        .attr("x", x(predictionDate) + 5)
        .attr("y", y(predictedHumidity3pm) - 10)
        .text(`Predicted 3 pm Humidity: ${predictedHumidity3pm}%`)
        .attr("font-size", "12px")
        .attr("fill", "purple");
    }

    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150},${20})`);

    legend.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).style("fill", "steelblue");
    legend.append("text").attr("x", 10).attr("y", 0).text("Humidity 9 am").style("font-size", "12px").attr("alignment-baseline", "middle");

    legend.append("circle").attr("cx", 0).attr("cy", 20).attr("r", 5).style("fill", "red");
    legend.append("text").attr("x", 10).attr("y", 20).text("Humidity 3 pm").style("font-size", "12px").attr("alignment-baseline", "middle");

  }, [data, predictedHumidity9am, predictedHumidity3pm, selectedDate]);

  return (
    <div className="predict-container">
      <h2>Humidity Prediction</h2>
      <div>
        <label>Select a Model: </label>
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          <option value="linear">Linear</option>
          <option value="ridge">Ridge</option>
          <option value="lasso">Lasso</option>
        </select>
      </div>
      <div className="chart-container" ref={chartRef}>
        {data.length === 0 && <p>Loading data...</p>}
      </div>
      {predictedHumidity9am !== null && predictedHumidity3pm !== null && (
        <div className="prediction-results" style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Predicted 9 am Humidity for {selectedDate} at {selectedLocation}: {predictedHumidity9am}%</p>
          <p>Predicted 3 pm Humidity for {selectedDate} at {selectedLocation}: {predictedHumidity3pm}%</p>
        </div>
      )}
    </div>
  );
};

export default PredictHumidity;
