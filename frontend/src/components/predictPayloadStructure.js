// Function to parse and format each row of the CSV data
export const parseCsvData = (csvData) => {
    return csvData.map(row => {
      const rowDate = new Date(row.Year, row.Month - 1, row.Day); // Note Month - 1 for JavaScript Date object
  
      return {
        MinTemp: parseFloat(row.MinTemp),
        MaxTemp: parseFloat(row.MaxTemp),
        Rainfall: parseFloat(row.Rainfall),
        WindGustSpeed: parseFloat(row.WindGustSpeed),
        WindSpeed9am: parseFloat(row.WindSpeed9am),
        WindSpeed3pm: parseFloat(row.WindSpeed3pm),
        Humidity9am: parseFloat(row.Humidity9am),
        Humidity3pm: parseFloat(row.Humidity3pm),
        Pressure9am: parseFloat(row.Pressure9am),
        Pressure3pm: parseFloat(row.Pressure3pm),
        Cloud9am: parseFloat(row.Cloud9am),
        Cloud3pm: parseFloat(row.Cloud3pm),
        Temp9am: parseFloat(row.Temp9am),
        Temp3pm: parseFloat(row.Temp3pm),
        DayIndex: row.DayIndex,
        Year: row.Year,
        Month: row.Month,
        Location: row.Location,
        date: rowDate // Store as a Date object
      };
    });
  };
  
  
  
  // Function to build the payload structure for the prediction request
  export const buildPredictPayload = (csvData) => {
    let payload = {};
  
    csvData.forEach((dayData, index) => {
      payload[`Day${index}`] = {
        MinTemp: dayData.MinTemp,
        MaxTemp: dayData.MaxTemp,
        Rainfall: dayData.Rainfall,
        WindGustSpeed: dayData.WindGustSpeed,
        WindSpeed9am: dayData.WindSpeed9am,
        WindSpeed3pm: dayData.WindSpeed3pm,
        Humidity9am: dayData.Humidity9am,
        Humidity3pm: dayData.Humidity3pm,
        Pressure9am: dayData.Pressure9am,
        Pressure3pm: dayData.Pressure3pm,
        Cloud9am: dayData.Cloud9am,
        Cloud3pm: dayData.Cloud3pm,
        Temp9am: dayData.Temp9am,
        Temp3pm: dayData.Temp3pm,
        DayIndex: dayData.DayIndex,
        Year: dayData.Year,
        Month: dayData.Month,
        Location: dayData.Location
      };
    });
  
    return payload;
  };
  