import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure';
import '../components/styles.css';

const PredictWindGustSpeed = ({ selectedDate, selectedLocation }) => {
  const [data, setData] = useState([]);
  const [predictedWindGustSpeed, setPredictedWindGustSpeed] = useState(null);
  const [selectedModel, setSelectedModel] = useState("linear"); // Default to linear
  const chartRef = useRef();
  const tooltipRef = useRef();

  const fetchData = async (date, location) => {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 14);

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
      setPredictedWindGustSpeed(predictionResponse.data.Result.WindGustSpeed);
    } catch (error) {
      console.error("Error fetching wind gust speed prediction:", error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedLocation);
  }, [selectedDate, selectedLocation, selectedModel]);

  // Handle model selection change
  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };

  useEffect(() => {
    const margin = { top: 60, right: 100, bottom: 80, left: 80 };
    const width = 600;
    const height = 400;

    if (!chartRef.current) return;

    d3.select(chartRef.current).select("svg").remove();

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 60)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const extendedData = [
      ...data.map(d => ({
        date: new Date(d.date),
        WindGustSpeed: isNaN(d.WindGustSpeed) ? null : +d.WindGustSpeed,
      })).filter(d => d.WindGustSpeed !== null),
      ...(predictedWindGustSpeed !== null
        ? [{ date: new Date(selectedDate), WindGustSpeed: predictedWindGustSpeed }]
        : [])
    ];

    const x = d3.scaleBand()
      .domain(extendedData.map(d => d.date))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(extendedData, d => d.WindGustSpeed) || 100])
      .range([height, 0]);

    // Define a color scale based on WindGustSpeed values
    const colorScale = d3.scaleLinear()
      .domain([0, d3.max(extendedData, d => d.WindGustSpeed || 0)])
      .range(["lightblue", "darkblue"]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m/%Y")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d} km/h`));

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("border-radius", "4px");

    svg.selectAll(".bar")
      .data(extendedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.date))
      .attr("y", d => y(d.WindGustSpeed))
      .attr("width", x.bandwidth())
      .attr("height", d => Math.max(0, height - y(d.WindGustSpeed)))
      .attr("fill", d => d.date.getTime() === new Date(selectedDate).getTime() ? "Green" : colorScale(d.WindGustSpeed))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`Wind Gust Speed: ${d.WindGustSpeed} km/h`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    if (predictedWindGustSpeed !== null) {
      svg.append("text")
        .attr("x", x(new Date(selectedDate)) - 20)
        .attr("y", y(predictedWindGustSpeed) - 10)
        .text(`Predicted: ${predictedWindGustSpeed} km/h`)
        .attr("font-size", "10px")
        .attr("fill", "Green");
    }

    // Add legend for intensity
    const legendWidth = 200;
    const legendHeight = 10;
    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(extendedData, d => d.WindGustSpeed || 0)])
      .range([0, legendWidth]);

    const legend = svg.append("g")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 50})`);

    legend.append("defs")
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .selectAll("stop")
      .data([
        { offset: "0%", color: "lightblue" },
        { offset: "100%", color: "darkblue" }
      ])
      .enter()
      .append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => `${Math.round(d)} km/h`);

    legend.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("font-size", "10px");

  }, [data, predictedWindGustSpeed, selectedDate]);

  return (
    <div className="predict-container">
      <div>
        <label>Select a Model: </label>
        <select value={selectedModel} onChange={handleModelChange}>
          <option value="linear">Linear</option>
          <option value="ridge">Ridge</option>
          <option value="lasso">Lasso</option>
        </select>
      </div>
      <div className="chart-container" ref={chartRef}>
        {data.length === 0 && <p>Loading data...</p>}
      </div>
      {predictedWindGustSpeed !== null && (
        <div className="prediction-results" style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Predicted Wind Gust Speed for {selectedDate} at {selectedLocation}: {predictedWindGustSpeed} km/h</p>
        </div>
      )}
    </div>
  );
};

export default PredictWindGustSpeed;
