class Polyline {
    //start the process of creating polyline track - user can add and move points
    static start(appState, markers, track, trackLine) {
        appState.clearMapListeners();

        appState.grid = false;
        appState.btnFinishTrack.style.display = 'inline-block';
        map.addListener('click', (event)=>{            
            this.addPoint(event.latLng, markers);
        });
        map.addListener('rightclick', ()=>{
            this.finish(appState, markers, track, trackLine);
            appState.btnFinishTrack.style.display = 'none';
        });
        appState.btnFinishTrack.onclick = () => {
            this.finish(appState, markers, track, trackLine);
            appState.btnFinishTrack.style.display = 'none';
        }
        
        
    }

    //handles the click event during polyline creation proces
    static addPoint(position, markers) {        
        const marker = new google.maps.Marker({
            position: position,
            draggable: true,
            map: map
        });    
        markers.push(marker);
    }

    //handles the right-click event during polyline creation proces
    //creates polyline track from points
    static finish(appState, markers, track, trackLine) {
        if(markers.length > 1){
            google.maps.event.clearListeners(map,'click');
            google.maps.event.clearListeners(map,'rightclick');
            track.createFromPolylinePoints(markers);
            GoogleMap.drawMarkers(appState, track, markers, trackLine);
        }

    }

    //process of polyline creation interrupted, remove listenners
    static clearMapListeners() {
        google.maps.event.clearListeners(map,'click');
        google.maps.event.clearListeners(map,'rightclick');
    }
}