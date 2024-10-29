const express = require('express');
const cors = require('cors');  
const path = require('path');
const app = express();

// Enable CORS for requests from localhost:3000
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Serve static files from the 'app/models' directory
app.get('/data/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'models', fileName); // Adjusted path

    // Check if the file exists and is a CSV file
    if (path.extname(filePath) === '.csv' && filePath.includes('models')) {
        res.sendFile(filePath, (err) => {
            if (err) {
                res.status(404).send({ error: "File not found" });
            }
        });
    } else {
        res.status(400).send({ error: "Invalid file type" });
    }
});

// Start the server on port 8000
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
