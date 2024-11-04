import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import axios from 'axios';
import { parseCsvData, buildPredictPayload } from '../components/predictPayloadStructure';
import '../components/styles.css';

const PredictHumidity = ({ selectedDate, selectedLocation }) => {
  const [data, setData] = useState([]);
  const [predictedHumidity, setPredictedHumidity] = useState(null);
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
          rowDate <= endDate
        );
      });

    const parsedData = parseCsvData(filteredData);
    setData(parsedData);

    // Build the payload for prediction
    const payload = buildPredictPayload(parsedData);

    try {
      // Request predicted humidity
      const predictionResponse = await axios.post("http://localhost:8000/api/v1/endpoints/models/linear/predict", payload);
      setPredictedHumidity(predictionResponse.data.Result.Humidity); // Assuming the API returns 'Humidity' in 'Result'
    } catch (error) {
      console.error("Error fetching predicted humidity:", error.response ? error.response.data : error);
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

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.Humidity9am || 0, d.Humidity3pm || 0))])
      .range([height, 0]);

    // Define area for Humidity9am
    const area9am = d3.area()
      .x(d => x(new Date(d.date)))
      .y0(height)
      .y1(d => y(d.Humidity9am))
      .curve(d3.curveMonotoneX);

    // Define area for Humidity3pm
    const area3pm = d3.area()
      .x(d => x(new Date(d.date)))
      .y0(height)
      .y1(d => y(d.Humidity3pm))
      .curve(d3.curveMonotoneX);

    // Append 9am humidity area
    svg.append("path")
      .datum(data)
      .attr("fill", "lightblue")
      .attr("d", area9am);

    // Append 3pm humidity area
    svg.append("path")
      .datum(data)
      .attr("fill", "steelblue")
      .attr("d", area3pm);

    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m")));

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    // Add predicted humidity point and label if available
    if (predictedHumidity !== null) {
      svg.append("circle")
        .attr("cx", x(new Date(selectedDate)))
        .attr("cy", y(predictedHumidity))
        .attr("r", 5)
        .attr("fill", "orange");

      svg.append("text")
        .attr("x", x(new Date(selectedDate)) - 40)
        .attr("y", y(predictedHumidity) - 10)
        .text(`Pred Humidity: ${predictedHumidity}%`)
        .attr("font-size", "12px")
        .attr("fill", "orange");
    }

    // Add legend
    svg.append("circle").attr("cx", width - 100).attr("cy", 10).attr("r", 5).style("fill", "lightblue");
    svg.append("text").attr("x", width - 90).attr("y", 10).text("Humidity 9am").style("font-size", "12px").attr("alignment-baseline", "middle");

    svg.append("circle").attr("cx", width - 100).attr("cy", 30).attr("r", 5).style("fill", "steelblue");
    svg.append("text").attr("x", width - 90).attr("y", 30).text("Humidity 3pm").style("font-size", "12px").attr("alignment-baseline", "middle");

  }, [data, predictedHumidity, selectedDate]);

  return (
    <div className="predict-container">
      <h2>Humidity Prediction</h2>
      <div className="chart-container" ref={chartRef}>
        {data.length === 0 && <p>Loading data...</p>}
      </div>
      {predictedHumidity !== null && (
        <div className="prediction-results" style={{ marginTop: "20px", textAlign: "center" }}>
          <p>
            Predicted Humidity for {selectedDate} at {selectedLocation}: {predictedHumidity}%
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictHumidity;
