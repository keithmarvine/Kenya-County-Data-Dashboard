const express = require("express");
const cors = require("cors");
const geojsonRoute = require("./routes/geojson");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API route
app.use("/api/geojson", geojsonRoute);

// Serve frontend if needed
app.use(express.static("../frontend")); 

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});