import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure';
import '../components/styles.css';

const PredictTemperature = ({ selectedDate, selectedLocation }) => {
  const [data, setData] = useState([]);
  const [predictedMinTemp, setPredictedMinTemp] = useState(null);
  const [predictedMaxTemp, setPredictedMaxTemp] = useState(null);
  const [selectedModel, setSelectedModel] = useState("linear"); // Default to linear
  const chartRef = useRef();

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
      setPredictedMinTemp(predictionResponse.data.Result.MinTemp);
      setPredictedMaxTemp(predictionResponse.data.Result.MaxTemp);
    } catch (error) {
      console.error("Error fetching temperature prediction:", error.response ? error.response.data : error);
    }
  };

  useEffect(() => {
    fetchData(selectedDate, selectedLocation);
  }, [selectedDate, selectedLocation, selectedModel]); // Fetch data when model changes

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
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const extendedData = [
      ...data.map(d => ({
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
      .attr("width", 150)
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
    
        // Calculate box position based on cursor position
        const boxWidth = 150; // Width of the box
        const boxHeight = 50; // Height of the box
        const boxX = xPos - boxWidth - 10; // Default position to the left of the line
        const boxY = height - 50; // Position the box above the x-axis
    
        // Check if the box fits to the left
        const fitsLeft = boxX >= 0;
    
        // If it doesn't fit, position to the right
        const finalBoxX = fitsLeft ? boxX : xPos + 10; // Shift to the right if no space
    
        // Transition for box position
        tempBox.transition()
          .duration(20)
          .attr("transform", `translate(${finalBoxX},${boxY})`)
          .on("end", function() {
            d3.select(this).attr("opacity", 1);
          });
    
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
        .attr("fill", "green");

      svg.append("text")
        .attr("x", x(new Date(selectedDate)) - 100)
        .attr("y", y(predictedMinTemp) + 30)
        .text(`Pred Min: ${predictedMinTemp}°C`)
        .attr("font-size", "12px")
        .attr("fill", "green");
    }

    if (predictedMaxTemp !== null) {
      svg.append("circle")
        .attr("cx", x(new Date(selectedDate)))
        .attr("cy", y(predictedMaxTemp))
        .attr("r", 5)
        .attr("fill", "purple");

      svg.append("text")
        .attr("x", x(new Date(selectedDate)) - 100)
        .attr("y", y(predictedMaxTemp) - 15)
        .text(`Pred Max: ${predictedMaxTemp}°C`)
        .attr("font-size", "12px")
        .attr("fill", "purple");
    }

    // Legend for temperature areas
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 200}, ${height - 450})`); // Adjust position as needed

    legend.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "lightblue");

    legend.append("text")
      .attr("x", 15)
      .attr("y", 10)
      .text("Min Temp Area")
      .attr("font-size", "12px")
      .attr("alignment-baseline", "middle");

    legend.append("rect")
      .attr("y", 20)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "lightcoral");

    legend.append("text")
      .attr("x", 15)
      .attr("y", 30)
      .text("Max Temp Area")
      .attr("font-size", "12px")
      .attr("alignment-baseline", "middle");
      
  }, [data, predictedMinTemp, predictedMaxTemp, selectedDate]);

  return (
    <div className="predict-container">
      <h2 style={{ textAlign: 'center' }}></h2>
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
