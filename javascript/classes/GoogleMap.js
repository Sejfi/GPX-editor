class GoogleMap {
    static init(map) {

        //SEARCHBOX
        // Create the search box and link it to the UI element.
        const input = document.getElementById('pac-input');
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        const searchBox = new google.maps.places.SearchBox(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
            searchBox.setBounds(map.getBounds());
        });

        searchBox.addListener('places_changed', function() {
            const places = searchBox.getPlaces();

            if (places.length == 0) {
                return;
            }
            // For each place, get the icon, name and location.
            const bounds = new google.maps.LatLngBounds();
            places.forEach(function(place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });

        map.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('finGridWrap'));
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('finLaneWrap'));

        //Finish buttons
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('finish-track'));

        //LEGEND
        const legend = document.getElementById('legend');
        const iconBase = 'markers/';
        const icons = {
            green: {
                name: 'start',
                icon: iconBase + 'green.png'
            },
            red: {
                name: 'original',
                icon: iconBase + 'red.png'
            },
            blue: {
                name: 'interpolated',
                icon: iconBase + 'blue.png'
            },
            yellow: {
                name: 'moved',
                icon: iconBase + 'yellow.png'
            }
        };

        for (let key in icons) {
            const type = icons[key];
            const name = type.name;
            const icon = type.icon;
            const div = document.createElement('div');
            div.innerHTML = '<img src="' + icon + '"> ' + name;
            legend.appendChild(div);
        }

        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    }

    static resetTrack(appState, markers, track, trackLine) {
        track.clearPoints();
        this.clearMarkers(markers, trackLine);
        this.clearGridCorners(appState.gridCorners);

        if(appState.redPolygon){
            appState.redPolygon.setMap(null);
        }
        appState.redPolygon = null;
        appState.ele = false;

        appState.btnFinishTrack.style.display = 'none';
    }
    
    static drawMarkers(appState, track, markers, trackLine) {
        if(appState.interpolate){
            track.deleteInterpoints();
            track.interspace(appState.interpStep);
        }
        this.clearMarkers(markers, trackLine);        
        for(let i = 0; i<track.size(); i++){
            this.drawMarker(appState, track, i, markers, trackLine);
        }
        this.drawLine(track.getPoints(), trackLine);
        appState.ele = false;
        appState.updateStats(track);
        appState.elePlot.style.display = "none";
        appState.eleLoading.style.display = "none";
        appState.eleNoEle.style.display = "block";
    }

    static drawMarker(appState, track, pointIndex, markers, trackLine) {
        const point = track.getPoint(pointIndex);
        const latLng = new google.maps.LatLng(point.getLat(), point.getLng());
        let iconPath;
        let dragable = true;

        if(point.getOrigin()==='INTERPOLATED'){
            iconPath = 'markers/blue.png';
            dragable = false;
        }else{
            if(point.getOrigin()==='ORIGINAL' && pointIndex !== 0){
                dragable = true;
                point.getMoved() ? iconPath = 'markers/yellow.png' : iconPath = 'markers/red.png';
            }else{
                iconPath = 'markers/green.png'
            }
        }
        if(appState.grid){
            dragable = false;
        }

        //label+icon
        const icon = {
            url: iconPath,
            labelOrigin: {x:15,y:10}
        };
        let labelFontSize = "12px";
        if(pointIndex >= 100)
            labelFontSize = "10px";
        const marker = new google.maps.Marker({
            position: latLng,
            label: {fontSize: labelFontSize, text:pointIndex.toString()},
            map: map,
            draggable: dragable,
            optimized: true,
            icon: icon
        });

        //infowindow - btn add / delete, + point._origin.toLowerCase()
        let infWindContent = '<b>#' + pointIndex + '</b>'  + "<br>";
        if(point.getOrigin() === 'ORIGINAL' && !appState.grid){
        // if(point.getOrigin() === 'ORIGINAL' && true){
            infWindContent +=
                // "<div class='infoWindow_button infoWindow_add' onclick=addMarker("+pointIndex+")>+</div>"+
                "<button id='add-"+pointIndex+"' class='infowindow-btn infowindow-add'>+ ADD NEW POINT</button><br>"+
                "<button id='del-"+pointIndex+"' class='infowindow-btn infowindow-del'>X DELETE POINT</button>";
        }

        const infowindow = new google.maps.InfoWindow({
            content: infWindContent
        });

        //Info window opened - part of the DOM now
        infowindow.addListener('domready', ()=>{
            //add point to track
            const btnAddPoint = document.getElementById('add-'+pointIndex);
            btnAddPoint.onclick = ()=>{
                track.addPoint(pointIndex);
                GoogleMap.clearMarkers(markers, trackLine);
                GoogleMap.drawMarkers(appState, track, markers, trackLine);
            };
            //delete point from track
            const btnDelPoint= document.getElementById('del-'+pointIndex);
            btnDelPoint.onclick = ()=>{
                if(track.size()>2){
                    track.delPoint(pointIndex);
                    GoogleMap.clearMarkers(markers, trackLine);
                    GoogleMap.drawMarkers(appState, track, markers, trackLine);
                }
            };
        });
        marker.addListener('click', function () {
            infowindow.open(map, marker);
        });

        //drag marker - change coordinates
        marker.addListener('dragend',function (e) {
            if(pointIndex)
                this.icon.url = 'markers/yellow.png';
            
            point.setMoved();
            point.setLat(e.latLng.lat());
            point.setLng(e.latLng.lng());

            GoogleMap.clearMarkers(markers, trackLine);
            GoogleMap.drawMarkers(appState, track, markers, trackLine);

        });

        markers.push(marker);
    }

    /**
     * clear all markers from the map (including the connecting line)
     * @param {array} markers
     * @param trackLine
     */
    static clearMarkers(markers, trackLine) {        
        markers.forEach(function(marker){
            marker.setMap(null);            
        });
        
        markers.length = 0;
        this.clearLine(trackLine);
        
    }

    /**
     * draw a polyline across all waypoints, connecting them into track
     * @param {array} waypoints 
     * @param {google.maps.Polyline} trackLine polyline connecting waypoints into one track
     */
    static drawLine(waypoints, trackLine) {
        this.clearLine(trackLine);
        let lineCoords = [];
        waypoints.forEach(function (marker) {
            if(marker.getOrigin() === 'ORIGINAL'){
                lineCoords.push({lat: marker.getLat(), lng: marker.getLng()});
            }
        });

        trackLine.setPath(lineCoords);
        trackLine.setMap(map);
    }

    /**
     * clear the polyline connecting waypoints into track off the map
     * @param {google.maps.Polyline} trackLine 
     */
    static clearLine(trackLine) {
        if(trackLine){ trackLine.setMap(null); }        
    }

    static clearGridCorners(corners) {
        corners.forEach(function(corner){
            corner.setMap(null);            
        });
        
        corners.length = 0;        
    }

}