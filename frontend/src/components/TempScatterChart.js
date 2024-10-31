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
    const width = 928;
    const height = 600;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    const x = d3.scaleUtc()
      .domain(d3.extent(data, d => d.date))
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.minTemp)]).nice()
      .range([height - marginBottom, marginTop]);

    const color = d3.scaleSequential()
      .domain([d3.min(data, d => d.minTemp), d3.max(data, d => d.minTemp)])
      .interpolator(d3.interpolateRdBu);

    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickFormat(d3.timeFormat("%Y")));

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null))
      .call(g => g.selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke", "#ddd"))
      .call(g => g.append("text")
        .attr("fill", "#000")
        .attr("x", 5)
        .attr("y", marginTop)
        .attr("dy", "0.32em")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Temperature (°C)"));

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#f4f4f4")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    svg.append("g")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.2)
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.minTemp))
      .attr("fill", d => color(d.minTemp))
      .attr("r", 2.5)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>Temp: ${d.minTemp}°C`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));
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
