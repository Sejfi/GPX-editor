# GPX-editor
Allows you to create flight path for a drone, in order to accurately take pictures along the path (for later processing and creating 
3D models).

This application was part of a project during my bachelor's degree and was created to work alongside an Android drone control application
that was able to autonomously control and fly the drone through created flightpath and accurattely take pictures of terrain underneath.

#### Features
* Load .gpx file containing GPS data and use them to create the track
* Create new track, placing points one by one on the map
* Cover whole area by selecting verticies of a polygon, which will be filled by track in parallel lines
* Set parameters of the flight (height, speed, overlap of the photographs)
* Download terrain elevation data from Google Elevation Service (and draw elevation profile)
* Interspace sections of the track by more waypoints, in order to get finer elevation profile
* Download created track locally or upload it to cloud storage (OneDrive)
* Edit previously created tracks
* Final output of the application is XML file containing track in GPX format and flight parameters

Example of a basic line track
Example of a "grid" track
In order to properly fill polygon by parallel track, the editor supports only convex polygons
