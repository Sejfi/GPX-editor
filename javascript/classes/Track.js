class Track {
    constructor(){
        this._waypoints = [];
    }

    getPoints() {
        return this._waypoints;
    }

    getPoint(i){
        return this._waypoints[i];
    }

    size(){
        return this._waypoints.length;
    }

    appendWaypoint(wp){
        this._waypoints.push(wp);
    }

    clearPoints() {
        this._waypoints.length = 0;
    }

    //load Track object from GPX (XML format)
    createFromGPX(gpxTrack){
        let pointNodes = $("trkpt", gpxTrack);

        $.each(pointNodes, (i, curPoint)=> {
            let trkpt;
            const exki = "http://ki.ujep.cz/ns/gpx_extension";
            let lat = parseFloat($(curPoint).attr("lat").toString());
            let lon = parseFloat($(curPoint).attr("lon").toString());
            let ele = parseFloat($("ele", curPoint).text());

            let origin = curPoint.getAttributeNS(exki,'origin') || 'ORIGINAL';
            let agl = parseFloat($("agl", curPoint).text() || 0 );
            let eres = parseFloat($("eres", curPoint).text() || 0);
            let speed = parseFloat($("speed", curPoint).text() || 0);

            trkpt = new Waypoint(lat, lon, ele, agl, eres, speed, origin);
            this.appendWaypoint(trkpt);
        });

    }


    //Make Track object (polyline) from points
    createFromPolylinePoints(points){

        points.forEach((point)=> {
           this.appendWaypoint(new Waypoint(point.position.lat(), point.position.lng(), 0, 0, 0, 0, 'ORIGINAL'));
        });

    }

    //Make Track object from polygon vertices
    createFromGridCorners(appState){
        this.clearPoints();
        const cornerCount = appState.gridCorners.length;

        //get lines from polygon vertices
        let borderLines = Line.borderLines(appState.gridCorners, appState.polygonClockwise);

        //track will be parallel to one of the edges of the polygon
        let pIndex = appState.gridAlign;     //INPUT, default 0

        let p = Line.from2points(appState.gridCorners[pIndex].position, appState.gridCorners[(pIndex+1) % cornerCount].position, appState.polygonClockwise);

        let left = true;
        let last = 0;
        let distancesL = [];
        let distancesR = [];
        //go around the polygon, from chosen point to the left, until the furthest point, then right side
        for(let k=1; k<cornerCount-1; k++){
            let dist;
            //left side
            if(left){
                dist = Line.pointLineDistance(p,appState.gridCorners[(cornerCount+pIndex+1+k)%cornerCount].position);
                if(dist > last){
                    distancesL.push(dist);
                    last = dist;
                }else{
                    left = false; //reached the furthest point
                    last = 0;
                }
            }
            //right side
            if(!left){
                dist = Line.pointLineDistance(p,appState.gridCorners[(pIndex-k+distancesL.length+cornerCount)%cornerCount].position);
                distancesR.push(dist);
            }
        }
        distancesL.reverse();
        distancesR.reverse();


        const normal = Line.normalVector(appState.gridCorners[pIndex].position, appState.gridCorners[(pIndex+1)%cornerCount].position, appState.polygonClockwise);
        const endPointDist = distancesL[0];
        let nextLeft = distancesL.pop();
        let nextRight = distancesR.pop();
        let leftIndex = (pIndex+1) % cornerCount;
        let rightIndex = (pIndex-1 + cornerCount) % cornerCount;

        const paraSpacing = Grid.getParallelSpacing(appState.speed, appState.altitude, appState.photoInterval);

        let side = true;
        let n = 0;
        let pDistance = 0;
        //move line p into the polygon and find the intersections (trackpoints)
        while(pDistance < endPointDist){
            //https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
            p = Line.move(appState.gridCorners[pIndex].position, appState.gridCorners[(pIndex+1)%cornerCount].position, normal, paraSpacing, n, appState.polygonClockwise);
            pDistance = Line.pointLineDistance(p,appState.gridCorners[pIndex].position);
            if(pDistance > endPointDist){
                break;
            }
            //set the correct lines to search intersection with line p
            if(pDistance > nextLeft){
                nextLeft = distancesL.pop();
                leftIndex = (leftIndex+1) % cornerCount;
            }
            if(pDistance > nextRight){
                nextRight = distancesR.pop();
                rightIndex = (rightIndex-1+cornerCount) % cornerCount;
            }
            //find the intersection and create a trackpoint
            const A = Line.intersection(p, borderLines[leftIndex]);
            const B = Line.intersection(p, borderLines[rightIndex]);
            const trkptA = new Waypoint(A.lat(), A.lng(), 0, 0, 0, 0, 'ORIGINAL');
            const trkptB = new Waypoint(B.lat(), B.lng(), 0, 0, 0, 0, 'ORIGINAL');
            if(side){
                this.appendWaypoint(trkptA);
                this.appendWaypoint(trkptB);
            }else{
                this.appendWaypoint(trkptB);
                this.appendWaypoint(trkptA);
            }
            side = n % 2 !== 0;
            n++;
        }

    }

    saveToXML(xmlDoc){
        const GPX_NS = 'http://www.topografix.com/GPX/1/1';
        const EXKI_NS = 'http://ki.ujep.cz/ns/gpx_extension';

        //GPX
        let node_gpx = document.createElementNS(GPX_NS,'gpx');
        node_gpx.setAttribute('version','1.1');
        node_gpx.setAttribute('creator','Taitale');
        xmlDoc.documentElement.appendChild(node_gpx);

        //track
        let node_trk = document.createElementNS(GPX_NS,'trk');
        node_gpx.appendChild(node_trk);
        let node_trkseg = document.createElementNS(GPX_NS,'trkseg');
        node_trk.appendChild(node_trkseg);

        //trackpoints
        // let originalCount=0;
        for(let i = 0; i<this._waypoints.length; i++){
            let node_trkpt = document.createElementNS(GPX_NS, 'trkpt');
            node_trkpt.setAttribute('lat',this._waypoints[i]._latitude);
            node_trkpt.setAttribute('lon',this._waypoints[i]._longitude);
            node_trkpt.setAttributeNS(EXKI_NS,'origin',this._waypoints[i]._origin);
            //ele
            let node_ele = document.createElementNS(GPX_NS,'ele');
            node_ele.appendChild(document.createTextNode(this._waypoints[i]._groundElevation.toString()));
            node_trkpt.appendChild(node_ele);
            //agl
            let node_agl = document.createElementNS(EXKI_NS,'agl');
            node_agl.appendChild(document.createTextNode(this._waypoints[i]._heightAboveGroundLevel.toString()));
            node_trkpt.appendChild(node_agl);
            //eres
            let node_eres = document.createElementNS(EXKI_NS,'eres');
            node_eres.appendChild(document.createTextNode(this._waypoints[i]._elevationResolution.toString()));
            node_trkpt.appendChild(node_eres);
            //speed
            let node_speed = document.createElementNS(EXKI_NS,'speed');
            node_speed.appendChild(document.createTextNode(this._waypoints[i]._speed.toString()));
            node_trkpt.appendChild(node_speed);

            node_trkseg.appendChild(node_trkpt);


        }

        return xmlDoc;
    }


    //track interpolation - always called on clean track (without interpolated points)
    interspace(maxDist){
        for(let i=this.size()-1; i>0; i--){
            const dist = this.getPoint(i).groundDistance(this.getPoint(i-1));

            //calculate the amount of needed points
            let sections;
            sections = Math.ceil(dist / maxDist);

            //create new points
            let interPoints = this.getPoint(i).sectionPoints(this.getPoint(i-1),sections);
            interPoints.forEach(function (point) {
                this._waypoints.splice(i, 0, point);
            }, this);
        }

    }

    deleteInterpoints() {
        let i=this.size()-1;
        for(;i>=0;i--){
            if(this.getPoint(i).getOrigin() !== 'ORIGINAL'){
                this.delPoint(i);
            }
        }
    }

    //add new point in the middle of a segment (user input)
    addPoint(i){
        const prevPoint = this.getPoint(i);
        let nextPoint;
        let last = false;
        if(i === this.size()-1){
            nextPoint = this.getPoint(i-1);
            last = true;
        }
        else
            nextPoint = this.getPoint(i+1);

        const newLat = (prevPoint.getLat() + nextPoint.getLat() )/2;
        const newLng = (prevPoint.getLng() + nextPoint.getLng() )/2;
        const newGrEle = (prevPoint.getGroundElevation() + nextPoint.getGroundElevation() )/2;
        const newHAGL = (prevPoint.getHeightAboveGroundLevel() + nextPoint.getHeightAboveGroundLevel() )/2;
        const newERES = Math.max(prevPoint.getElevationResolution(), nextPoint.getElevationResolution());
        const newSpeed = (prevPoint.getSpeed());
        const newPoint = new Waypoint(newLat, newLng, newGrEle, newHAGL, newERES, newSpeed, 'ORIGINAL');

        if(!last)
            this._waypoints.splice(i+1, 0, newPoint);
        else
            this._waypoints.splice(i, 0, newPoint);

    }

    delPoint(i){
        this._waypoints.splice(i,1);
    }

    //calculate the length of the track (ground level)
    mapLength(){
        let length = 0;
        let A = this.getPoint(0);
        for(let i = 1; i<this.size(); i++){
            if(this.getPoint(i).getOrigin() === 'ORIGINAL'){
                let B = this.getPoint(i);
                length += B.groundDistance(A);
                A = B;
            }
        }
        return Math.round(length*10)/10;
    }

    //calculate the length of the track (including elevation changes)
    realLength(){
        let length = 0;
        let A = this.getPoint(0);
        for(let i = 1; i<this.size(); i++){
            const B = this.getPoint(i);
            if(B.getGroundElevation() === 0){
                return 0;
            }
            const dEle = A.getGroundElevation()-B.getGroundElevation();
            length +=Math.sqrt(Math.pow(B.groundDistance(A),2) + Math.pow(dEle,2));
            A = B;

        }
        return Math.round(length*10)/10;
    }

    //find the lowest point
    minEle(){
        let minElevation = this.getPoint(0).getGroundElevation();
        for(let i=1; i<this.size(); i++){
            if(this.getPoint(i).getGroundElevation() < minElevation){
                minElevation = this.getPoint(i).getGroundElevation();
            }
        }
        return Math.round(minElevation);
    }

    //find the highest point
    maxEle(){
        let maxElevation = this.getPoint(0).getGroundElevation();
        for(let i=1; i<this.size(); i++){
            if(this.getPoint(i).getGroundElevation() > maxElevation){
                maxElevation = this.getPoint(i).getGroundElevation();
            }
        }
        return Math.round(maxElevation);
    }

    //Google elevation service
    getGoogleElevation(appState) {
            appState.sectionEleShow('loading');
            const elevator = new google.maps.ElevationService;
            //max 512 points per request
            const requests = Math.ceil((this.size()-1)/512);
            let respCount = 0;
            //max 512 waypoints per request
            for(let j=0; j <= Math.floor((this.size()-1)/512); j++){       //1030: 0,  1,  2
                let locations = [];
                for(let i = j*512; i<this.size() && i<(j+1)*512; i++){     //1030: 0-511, 512-1023, 1024-1030
                    const curPoint = this.getPoint(i);
                    locations[i-j*512] = new google.maps.LatLng(curPoint.getLat(), curPoint.getLng());
                }

                //request
                elevator.getElevationForLocations(
                    {'locations': locations},
                    (results, status)=>{
                        if(status === 'OK'){
                            if(results){
                                //set received elevation to trackpoints
                                respCount++;
                                for(let i=0; i<results.length; i++){
                                    // console.log(results);
                                    const point = this.getPoint(i+j*512);
                                    point.setGroundElevation(results[i].elevation);
                                    point.setElevationResolution(results[i].resolution);
                                }

                                //all requests finished - show elevation profile (plot)
                                if(respCount === requests){
                                    this.showElePlot();
                                    appState.sectionEleShow('plot');
                                    appState.ele = true;
                                    appState.updateStats(this);
                                }
                            }else{
                                alert('no results found!');
                            }
                        }else{
                            alert('Failed, status: '+status);
                        }
                    }
                );
            }

    }

    //configuration of Google Chart
    showElePlot(version, packages) {
        google.charts.load('current', packages);

        google.charts.setOnLoadCallback(()=> {
            let data = new google.visualization.DataTable();
            //prepare columns of data table
            data.addColumn('string', 'Waypoint');
            data.addColumn('number', 'Elevation');

            //fill the datatable
            for(let i=0; i<this.size(); i++){
                data.addRow([i.toString(),this.getPoint(i).getGroundElevation()]);
            }

            // define the chart using setters:
            const plotWrap = new google.visualization.ChartWrapper();

            plotWrap.setChartType('AreaChart');
            plotWrap.setDataTable(data);
            plotWrap.setContainerId('elevationPlot');

            plotWrap.setOptions({
                title:'Track Elevation (m)',
                legend:'none',
                // width: 400,
                height: 190,
                vAxis:{
                    viewWindowMode:'maximized'
                },
                chartArea:{width: '85%'}
            });
            plotWrap.draw();
        });

    }

    setGlobalSpeedAltitude(speed, altitude){
        this._waypoints.forEach((point)=> {
            point.setSpeed(speed);
            point.setHeightAboveGroundLevel(altitude);
        })
    }


}