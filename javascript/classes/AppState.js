class AppState {
    constructor() {
        this.grid = false;
        this.gridCorners = [];
        this.gridAlign = 0;
        this.polygonConvex = true;
        this.polygonClockwise = true;
        this.redPolygon = null;
        this.interpolate = false;
        this.interpStep = 20;

        this.altitude = 20;
        this.speed = 5;
        this.photoInterval = 2;

        this.ele = false;

        //statistics
        this.statTrackpoints = document.getElementById("stat-trackpoints");
        this.statLowest = document.getElementById("stat-lowest");
        this.statHighest = document.getElementById("stat-highest");
        this.statMapLenght = document.getElementById("stat-map-length");
        this.statRealLenght = document.getElementById("stat-real-length");
        this.statFlightTime = document.getElementById("stat-flight-time");

        //elevation profile
        this.eleNoEle = document.getElementById("no-ele");
        this.elePlot = document.getElementById("elevationPlot");
        this.eleLoading = document.getElementById("loading");

        //save info
        this.name = "";
        this.description = "";
        this.creationTime = "";
        this.overlay = 0;

        this.btnFinishTrack = document.getElementById('finish-track');

    }

    setParamAltitude(val) {
        this.altitude = val;
        document.getElementById('altitude').value = val;
    }

    setParamSpeed(val) {
        this.speed = val;
        document.getElementById('speed').value = val;
    }

    setParamPhotoInterval(val) {
        this.photoInterval = val;
        document.getElementById('photo-interval').value = val;
    }

    setParamInterpolation(val) {
        this.interpolate = true;
        this.interpStep = val;
        document.getElementById('chbx-interpolation').checked = true;
        document.getElementById('interpolation').value = val;
        document.getElementById('interp-val').innerText = val;
    }

    updateStats(track) {
        this.statTrackpoints.innerText = track.size();
        this.statMapLenght.innerText = track.mapLength()+"m";

        if(this.ele){
            this.statLowest.innerText = track.minEle();
            this.statHighest.innerText = track.maxEle();

            const realLength = track.realLength();
            this.statRealLenght.innerText = realLength;

            let flightTimeM = Math.floor((realLength / this.speed) / 60);
            let flightTimeS = Math.round((realLength / this.speed) % 60);
            this.statFlightTime.innerText = flightTimeM +'m '+ flightTimeS + 's';
        }else{
            this.statLowest.innerText = "n/a";
            this.statHighest.innerText = "n/a";
            this.statRealLenght.innerText = "n/a";
            this.statFlightTime.innerText = "n/a";


        }
    }

    /**
     * Display suitable element in elevation section (no data prompt, loading animation, elevation plot)
     * @param option - accepted values: 'nodata', 'loading', 'plot'
     */
    sectionEleShow(option) {
        this.eleNoEle.style.display = "none";
        this.eleLoading.style.display = "none";
        this.elePlot.style.display = "none";

        switch (option) {
            case 'nodata': this.eleNoEle.style.display = "block";
            break;
            case 'loading': this.eleLoading.style.display = "block";
            break;
            case 'plot': this.elePlot.style.display = "block";
            break;
        }
    }

    clearMapListeners() {
        google.maps.event.clearListeners(map,'click');
        google.maps.event.clearListeners(map,'rightclick');
    }

    readFile(file, markers, track, trackLine) {
        let reader = new FileReader();
        reader.onload = ()=> {
            let text = reader.result;
            text = $.parseXML(text);

            //if <mission>, load mission params
            if($("mission",text).length){
                Mission.load(this, text);
            }

            //load grid
            const gridNode = $("grid", text);
            if(gridNode.length){
                Grid.loadCorners(this, gridNode, markers, track, trackLine);
            }

            //load track
            track.createFromGPX(text);
            map.panTo(new google.maps.LatLng(track.getPoint(0).getLat(), track.getPoint(0).getLng()));
            map.setZoom(18);

            GoogleMap.drawMarkers(this, track, markers, trackLine);

            const interp = parseInt($(text).find("interpolation").text());
            if(interp){
                this.setParamInterpolation(interp);
            }

            if($("mission",text).length){
                this.ele = true;
            }

            if(this.ele){
                track.showElePlot();
                this.sectionEleShow('plot');
            }
        };

        reader.readAsText(file);

        return track;
    }

    validateParams(track) {
        let err = "";
        if(track.size()){
            this.name = document.getElementById("mission-name").value;
            this.description = document.getElementById("mission-description").value;

            //overlay
            this.overlay = Math.round(Grid.getOverlay(this.speed, this.altitude, this.photoInterval));
            if(this.overlay < 0){
                err += 'Cannot save - Photo overlap less than 0!\n';
            }

            //name -> filename
            const namePattern = /^[0-9a-zA-Z^&'@{}\[\],$=!\-#().%+~_ ]+$/;
            if(!namePattern.test(this.name)){
                err += 'Unsupported character(s) in Mission name (filename).\n';
            }

            //elevation
            for(let i=0; i<track.size(); i++){
                const point = track.getPoint(i);
                if(!point.getGroundElevation()){
                    err+= 'Point(s) without elevation!\n';
                    break;
                }
            }
        }else {
            err += 'No track created or loaded!';
        }

        return err;
    }
}