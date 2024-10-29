const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// List of cities in Victoria
const victoriaCities = [
  'Ballarat', 'Bendigo', 'Sale', 'MelbourneAirport', 
  'Melbourne', 'Mildura', 'Nhil', 'Portland', 
  'Watsonia', 'Dartmoor'
];

// Set up CSV writer to write to `app/models/victoria_weather.csv`
const csvWriter = createCsvWriter({
  path: 'app/models/victoria_weather.csv',
  header: [
    {id: 'Date', title: 'Date'},
    {id: 'Location', title: 'Location'},
    {id: 'MinTemp', title: 'MinTemp'},
    {id: 'MaxTemp', title: 'MaxTemp'},
    {id: 'Rainfall', title: 'Rainfall'},
    {id: 'Evaporation', title: 'Evaporation'},
    {id: 'Sunshine', title: 'Sunshine'},
    {id: 'WindGustDir', title: 'WindGustDir'},
    {id: 'WindGustSpeed', title: 'WindGustSpeed'},
    {id: 'WindDir9am', title: 'WindDir9am'},
    {id: 'WindDir3pm', title: 'WindDir3pm'},
    {id: 'WindSpeed9am', title: 'WindSpeed9am'},
    {id: 'WindSpeed3pm', title: 'WindSpeed3pm'},
    {id: 'Humidity9am', title: 'Humidity9am'},
    {id: 'Humidity3pm', title: 'Humidity3pm'},
    {id: 'Pressure9am', title: 'Pressure9am'},
    {id: 'Pressure3pm', title: 'Pressure3pm'},
    {id: 'Cloud9am', title: 'Cloud9am'},
    {id: 'Cloud3pm', title: 'Cloud3pm'},
    {id: 'Temp9am', title: 'Temp9am'},
    {id: 'Temp3pm', title: 'Temp3pm'},
    {id: 'RainToday', title: 'RainToday'},
    {id: 'RainTomorrow', title: 'RainTomorrow'}
  ]
});

// Read and filter the data
const victoriaData = [];

fs.createReadStream('app/models/weatherAUS.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (victoriaCities.includes(row.Location)) {
      victoriaData.push(row);
    }
  })
  .on('end', () => {
    // Write the filtered data to a new CSV file
    csvWriter.writeRecords(victoriaData)
      .then(() => console.log('Victoria weather data has been written to app/models/victoria_weather.csv'));
  });
