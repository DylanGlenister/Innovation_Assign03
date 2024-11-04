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

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const extendedData = [
      ...data.map(d => ({
        ...d,
        date: new Date(d.date),
        MinTemp: isNaN(d.MinTemp) ? 0 : +d.MinTemp,
        MaxTemp: isNaN(d.MaxTemp) ? 0 : +d.MaxTemp,
      })),
      ...(predictedMinTemp !== null && predictedMaxTemp !== null
        ? [{ date: new Date(selectedDate), MinTemp: predictedMinTemp, MaxTemp: predictedMaxTemp }]
        : [])
    ];

    const x = d3.scaleTime()
      .domain(d3.extent(extendedData, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(extendedData, d => Math.max(d.MinTemp, d.MaxTemp))])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m/%Y")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}°C`));

    const areaMin = d3.area()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.MinTemp))
      .curve(d3.curveMonotoneX);

    const areaMax = d3.area()
      .x(d => x(d.date))
      .y0(d => y(d.MinTemp))
      .y1(d => y(d.MaxTemp))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(extendedData)
      .attr("fill", "lightblue")
      .attr("d", areaMin);

    svg.append("path")
      .datum(extendedData)
      .attr("fill", "lightcoral")
      .attr("d", areaMax);

    // Temperature display box
    const tempBox = svg.append("g")
      .attr("class", "temp-box")
      .attr("opacity", 0); // Start hidden

    tempBox.append("rect")
      .attr("width", 120)
      .attr("height", 50)
      .attr("fill", "white")
      .attr("stroke", "black");

    tempBox.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("fill", "black")
      .attr("font-size", "12px");

    // Line that follows the cursor
    const cursorLine = svg.append("line")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("opacity", 0); // Start hidden

    // Show temperature data on mouse move
    const showTempData = (xPos) => {
      const dateAtPos = x.invert(xPos);
      const dataAtDate = extendedData.find(d => d.date.toDateString() === dateAtPos.toDateString());

      if (dataAtDate) {
        const minTemp = dataAtDate.MinTemp;
        const maxTemp = dataAtDate.MaxTemp;

        // Position the box based on cursor position
        if (xPos > width - 120) { // If near the right edge
          tempBox.transition()
            .duration(200) // Smooth transition duration
            .attr("transform", `translate(${xPos - 130},${y(maxTemp) - 60})`) // Move left
            .on("end", function() {
              d3.select(this).attr("opacity", 1);
            });
        } else { // Default position to the right of cursor
          tempBox.transition()
            .duration(20) // Smooth transition duration
            .attr("transform", `translate(${xPos + 10},${y(maxTemp) - 60})`) // Move right
            .on("end", function() {
              d3.select(this).attr("opacity", 1);
            });
        }

        // Update the text inside the box
        tempBox.select("text")
          .text(`Min: ${minTemp.toFixed(1)}°C Max: ${maxTemp.toFixed(1)}°C`);

        cursorLine.attr("opacity", 1).attr("x1", xPos).attr("x2", xPos); // Show the cursor line
      } else {
        tempBox.attr("opacity", 0); // Hide the box if no data
        cursorLine.attr("opacity", 0); // Hide the cursor line
      }
    };

    // Show temperature data and line on mouse move
    chartRef.current.addEventListener("mousemove", (event) => {
      const [mouseX] = d3.pointer(event);
      showTempData(mouseX - margin.left); // Show temperature data based on mouse position
    });

    chartRef.current.addEventListener("mouseleave", () => {
      tempBox.attr("opacity", 0); // Hide temperature box when mouse leaves
      cursorLine.attr("opacity", 0); // Hide cursor line when mouse leaves
    });

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
