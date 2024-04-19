const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the 'dist/acrylic-app' directory
app.use(express.static(path.join(__dirname, 'dist', 'acrylic-app', 'browser')));

// For any other route, serve the 'index.html' file
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'acrylic-app', 'browser', 'index.html'));
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
