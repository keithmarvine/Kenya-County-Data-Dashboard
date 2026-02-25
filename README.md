# Kenya-County-Data-Dashboard

An interactive full-stack web GIS application for exploring Kenya’s 2019 census data across all 47 counties.

This project was built from scratch to demonstrate spatial database design, REST API development, and interactive web mapping using modern geospatial technologies.

# Overview

The dashboard enables users to:

1. Visualize counties using a dynamic choropleth map

2. Compare population statistics interactively

3. Rank counties by key metrics

4. Search and zoom to any county instantly

5. View detailed county statistics including gender distribution and population change (2009 → 2019)

The application integrates spatial queries from PostGIS with dynamic frontend rendering using Leaflet and Chart.js.

# Tech Stack

# A. Frontend

1. HTML

2. CSS

3. JavaScript

4. Leaflet.js

5. Chart.js

# B. Backend

1. Node.js

2. Express.js

# C. Database

1. PostgreSQL

2. PostGIS (spatial extensions)

# Data Source

Kenya National Census 2019

# Key Features
1. Interactive Choropleth Map

Switch between area, total population, and population density

Dynamic color scaling based on selected metric

2. National Statistics Bar

Displays aggregated totals across all counties

3. County Detail Sidebar

Detailed statistics

Gender breakdown donut chart

Population growth indicator (2009 → 2019)

4. County Rankings Drawer

Sort all 47 counties by:

1. Population

2. Area

3. Density

   

5.Search Functionality

Instantly zoom to any county

6. County Comparison Tool

Select two counties and view statistics side-by-side

# Database Design

County geometries stored in PostGIS

Census attributes linked per county

Spatial indexing enabled for performance

REST API endpoints serve GeoJSON responses



