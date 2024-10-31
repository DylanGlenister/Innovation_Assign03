import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import cityStateMapping from '../components/cityStateMapping';

export default function TemperatureAnomalyChart() {
  const chartRef = useRef();
  const [data, setData] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Melbourne");

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('http://localhost:8000/data/weatherAUS.csv');
      const csvText = await response.text();
      const parsedData = Papa.parse(csvText, { header: true }).data;

      const cityData = parsedData
        .filter(row => row.Location === selectedCity && row.MinTemp !== "NA")
        .map(row => ({
          date: new Date(row.Date),
          minTemp: parseFloat(row.MinTemp),
        }))
        .filter(d => !isNaN(d.date) && !isNaN(d.minTemp) && d.date instanceof Date);

      setData(cityData);
    }

    fetchData();
  }, [selectedCity]);

  useEffect(() => {
    if (data.length > 0) renderChart(data);
  }, [data]);

  function renderChart(data) {
    // Chart dimensions and margins
    const width = 928;
    const height = 600;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    // X-axis scale (Time scale based on date)
    const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date)) // Set domain to the date range
        .range([marginLeft, width - marginRight]); // Range fits within the chart's width, accounting for margins

    // Y-axis scale (Temperature scale)
    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.minTemp)]).nice() // Set domain to min and max temperatures
        .range([height - marginBottom, marginTop]); // Invert range so lower values are at the bottom

    // Color scale for temperatures, using a red-blue color interpolator
    const color = d3.scaleSequential()
        .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.minTemp)]) // Maps temperature range to color range
        .interpolator(d3.interpolateRdBu); // Red for lower values, blue for higher values

    // Clear previous chart elements to avoid overlap
    d3.select(chartRef.current).selectAll("*").remove();

    // Create the SVG element to contain the chart
    const svg = d3.select(chartRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // Draw the X-axis with year ticks at the bottom of the chart
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickFormat(d3.timeFormat("%Y"))); // Format ticks to display years only

    // Draw the Y-axis with temperature ticks on the left of the chart
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(null)) // Set default ticks
        .call(g => g.selectAll(".tick line") // Create grid lines for better readability
            .clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke", "#ddd"))
        .call(g => g.append("text") // Y-axis label
            .attr("fill", "#000")
            .attr("x", 5)
            .attr("y", marginTop + 10)
            .attr("dy", "0.32em")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Temperature (°C)"));

    // Tooltip for displaying date and temperature information
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#f4f4f4")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none");

    // Append circles to represent each data point and animate their appearance
    const circles = svg.append("g")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.2)
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.date)) // Position each circle on the X-axis based on date
        .attr("cy", d => y(d.minTemp)) // Position each circle on the Y-axis based on temperature
        .attr("fill", d => color(d.minTemp)) // Color each circle based on temperature
        .attr("r", 5) // Circle radius
        .attr("opacity", 0) // Start with opacity 0 for fade-in effect
        .transition() // Add a transition to animate the points
        .delay((d, i) => i * 3) // sweep animation delay
        .duration(500)
        .attr("opacity", 1); // Fade-in to full opacity

    // Attach mouse event listeners to each circle using native event listeners
    circles.each(function (d) {
        this.addEventListener("mouseenter", (event) => {
            tooltip.transition().duration(100).style("opacity", 0.9); // Show tooltip
            tooltip.html(`Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>Temp: ${d.minTemp}°C`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px");
        });
        this.addEventListener("mouseleave", () => {
            tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip
        });
    });
}


  
  return (
    <div>
      <h1>Temperature Trend by Location</h1>

      <label>Location: </label>
      <select onChange={(e) => setSelectedCity(e.target.value)} value={selectedCity}>
        {Object.entries(cityStateMapping).map(([state, cities]) => (
          <optgroup label={`---${state}---`} key={state}>
            {cities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div ref={chartRef}></div>
    </div>
  );
}
