class Grid {
    static start(appState, markers, track, trackLine) {
        appState.clearMapListeners();

        appState.btnFinishTrack.style.display = 'inline-block';
        map.addListener('click', (event)=> {
            if(appState.gridCorners.length < 10){
                this.addCorner(appState, event.latLng, markers, track, trackLine);
            }else {
                alert('Maximum number of vertices reached (10).');
            }

        });
        map.addListener('rightclick', ()=> {
            this.finish(appState, markers, track, trackLine);
            appState.btnFinishTrack.style.display = 'none';
        });
        appState.btnFinishTrack.onclick = () => {
            this.finish(appState, markers, track, trackLine);
            appState.btnFinishTrack.style.display = 'none';
        }
        
        
    
    }

    //add a grid vertex
    static addCorner(appState, position, markers, track, trackLine) {
        const opacity = 0.5;
        const marker = new google.maps.Marker({
            position: position,
            draggable: true,
            zIndex: google.maps.Marker.MAX_ZINDEX-2,
            opacity: opacity,
            map: map
        });

        marker.addListener('mouseover', function (e) {
            this.setOpacity(1);
        });
        marker.addListener('mouseout', function (e) {
            this.setOpacity(opacity)
        });
        marker.addListener('dragend', (e)=> {

            if(track.size() || appState.redPolygon){
                console.log("track size: "+track.size());

                this.finish(appState, markers, track, trackLine);

            }
        });

        //show window with track align button on vertex click
        let infWindContent = '<b>#' + appState.gridCorners.length + '</b>' + "<br>";
        infWindContent +=
            "<button id='align-"+appState.gridCorners.length+"' class='infowindow-btn infowindow-align'>ALIGN GRID</button>";
        const infowindow = new google.maps.InfoWindow({
            content: infWindContent
        });
        const cornerIndex = appState.gridCorners.length;
        //Info window opened - part of the DOM now
        infowindow.addListener('domready', ()=>{
            const btnAlign = document.getElementById('align-'+cornerIndex);
            btnAlign.onclick = ()=>{
                appState.gridAlign = cornerIndex;
                if(appState.polygonConvex) {
                    this.fillGrid(appState, track, markers, trackLine);
                    GoogleMap.drawMarkers(appState, track, markers, trackLine);
                }else {
                    GoogleMap.clearMarkers(markers, trackLine);
                }


            }
        });

        marker.addListener('click',function (e) {
            if(track.size()){
                infowindow.open(map, marker);
            }
        });

        appState.gridCorners.push(marker);
        if(appState.gridCorners.length === 10){
            this.finish(event); //TODO event??
        }

    }

    //complete the polygon from vertices
    static finish(appState, markers, track, trackLine) {
        if(appState.gridCorners.length > 2){

            google.maps.event.clearListeners(map,'click');
            google.maps.event.clearListeners(map,'rightclick');
            this.checkConvex(appState);

            if(appState.polygonConvex) {
                this.fillGrid(appState, track, markers, trackLine);
                GoogleMap.drawMarkers(appState, track, markers, trackLine);
            }else {
                GoogleMap.clearMarkers(markers, trackLine);
            }

        }
    }

    //fill the polygon with track
    static fillGrid(appState, track, markers, trackLine) {
        if(appState.polygonConvex){
            track.createFromGridCorners(appState);

            if(appState.interpolate) {
                track.interspace(appState.interpStep);
            }

        }else{
            console.log("Trackline fill grid: "+trackLine);
            GoogleMap.clearMarkers(markers, trackLine);
        }

    }

    //check whether the polygon is convex
    static checkConvex(appState) {
        if(!this.checkPolygonCross(appState.gridCorners)){
            //https://math.stackexchange.com/questions/1743995/determine-whether-a-polygon-is-convex-based-on-its-vertices
            //autor odpoved pozdeji smazal a napsal jinou
            //algoritmus prevzat z prvni revize https://math.stackexchange.com/revisions/1745427/1
            let results = [];
            const n = appState.gridCorners.length;
            for(let i=0; i<appState.gridCorners.length; i++){
                let r = (appState.gridCorners[i].position.lng() - appState.gridCorners[(n+i-1) % n].position.lng())*(appState.gridCorners[(i+1) % n].position.lat() - appState.gridCorners[i].position.lat()) -
                    (appState.gridCorners[i].position.lat() - appState.gridCorners[(n+i-1) % n].position.lat())*(appState.gridCorners[(i+1) % n].position.lng() - appState.gridCorners[i].position.lng());
                results.push(r);
            }

            let positive = true;
            let negative = true;
            results.forEach(function (result) {
                if(result < 0){
                    positive = false;
                }
                if(result > 0){
                    negative = false;
                }
            });

            appState.polygonConvex = (positive || negative);
            if(negative){
                appState.polygonClockwise = true;
            }
            if(positive){
                appState.polygonClockwise = false;
            }
        }else{
            appState.polygonConvex = false;
        }


        if (appState.redPolygon) {
            appState.redPolygon.setMap(null);
        }
        //if the polygon is unfit - fill it with red color
        if(!appState.polygonConvex) {
            let paths = [];
            appState.gridCorners.forEach(function (vertex) {
                paths.push(vertex.position);
            });
            appState.redPolygon = new google.maps.Polygon({
                paths: paths,
                strokeColor: '#000000',
                strokeOpacity: 0.8,
                strokeWeight: 3,
                fillColor: '#FF0000',
                fillOpacity: 0.35
            });
            appState.redPolygon.setMap(map);
        }
    }

    //check wheter any edge of the polygon crosses another edge
    static checkPolygonCross(arr) {
        const count = arr.length;
        if(count > 3){
            for(let i=0; i<count-1; i++){
                const A = arr[i].position;
                const B = arr[i+1].position;
                const p = Line.from2points(A,B);
                for(let j=i+2; j<count && ((j-i)%count)>1 && ((j+1)%count)!==i; j++){
                    //console.log('i:'+i+',j:'+j);
                    const C = arr[j].position;
                    const D = arr[(j+1)%count].position;
                    const q = Line.from2points(C,D);
                    const P = Line.intersection(p,q);
                    if((P.lat()<A.lat() && P.lat()>B.lat()) || (P.lat()>A.lat() && P.lat()<B.lat())){
                        if((P.lat()<C.lat() && P.lat()>D.lat()) || (P.lat()>C.lat() && P.lat()<D.lat())){
                            return true;
                        }

                    }
                }
            }
        }

        return false;
    }

    static getOverlay(speed, elevation, timeInterval) {
        const FOV = 94;    // diagonalni Field Of View (uhel "ve spicce" jehlanu) ve stupnich
        const c = 2 * elevation * Math.tan(Math.PI * (FOV / 2) / 180);   // velikost uhlopricky v podstave jehlanu (bylo treba prevest stupne na radiany)

        //const a = 4 * c / 5;  // delsi strana fotky (ve formatu 4:3) - sirka
        const b = 3 * c / 5;  // kratsi strana fotky (ve formatu 4:3) - vyska
        const overlay = 1 - (timeInterval * speed / b);

        return (overlay * 100);   // prevedeme procenta
    }

    //spocita presah pro Grid trasu, kde zalezi i na presahu mezi paralelnimi segmenty
    static getParallelSpacing(speed, elevation, timeInterval) {

        const FOV = 94;    // diagonalni Field Of View (uhel "ve spicce" jehlanu) ve stupnich
        const c = 2 * elevation * Math.tan(Math.PI * (FOV / 2) / 180);   // velikost uhlopricky v podstave jehlanu (Bylo treba prevest stupne na radiany)

        const a = 4 * c / 5;  // Delsi strana fotky (ve formatu 4:3) - sirka
        const b = 3 * c / 5;  // Kratsi strana fotky (ve formatu 4:3) - vyska

        let overlay = timeInterval * speed / b;

        return overlay * a;
    }

    //load polygon vertices from XML
    static loadCorners(appState, gridNode, markers, track, trackLine) {
        appState.grid = true;

        appState.gridAlign = parseInt(gridNode.attr("align").toString());
        const vertices = $("vertex", gridNode);
        $.each(vertices, (i, node)=> {
            let lat = parseFloat($(node).attr("lat").toString());
            let lon = parseFloat($(node).attr("lon").toString());
            const event = {latLng: new google.maps.LatLng(lat,lon)};
            this.addCorner(appState, event.latLng, markers, track, trackLine);
        });

        this.checkConvex(appState);

    }


}