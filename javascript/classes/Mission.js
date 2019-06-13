class Mission {
    static load(appState, xml){
        //load panel params
        $("#input_name").val($(xml).find("name").text());
        $("#input_description").val($(xml).find("description").text());

        const alt = $(xml).find("altitude").text();
        $("#input_altitude").val(alt);
        appState.setParamAltitude(parseInt(alt));

        const speed = $(xml).find("speed").text()[0];
        $("#input_speed").val(speed);
        appState.setParamSpeed(parseInt(speed));

        const photoTI = $(xml).find("photoTimeInterval").text();
        $("#input_photoTimeInterval").val(photoTI);
        appState.setParamPhotoInterval(parseInt(photoTI));

        $("#input_photoOverlap").val($(xml).find("overlay").text());
    }

    static saveToXML(appState, track){
        const MISSION_NS = 'http://ki.ujep.cz/ns/taitale/mission';

        let xmlDoc = document.implementation.createDocument(MISSION_NS, 'mission', null);
        xmlDoc.prepend(document.createProcessingInstruction('xml',"version='1.0' encoding='UTF-8' standalone='no'"));
        //name
        let node_name = document.createElementNS(MISSION_NS,'name');
        node_name.appendChild(document.createTextNode(appState.name));
        xmlDoc.documentElement.appendChild(node_name);
        //description
        let node_description = document.createElementNS(MISSION_NS,'description');
        node_description.appendChild(document.createTextNode(appState.description));
        xmlDoc.documentElement.appendChild(node_description);
        //creationTime
        let node_creationTime = document.createElementNS(MISSION_NS,'creationTime');
        node_creationTime.appendChild(document.createTextNode(appState.creationTime));
        xmlDoc.documentElement.appendChild(node_creationTime);
        //altitude
        let node_altitude = document.createElementNS(MISSION_NS,'altitude');
        node_altitude.appendChild(document.createTextNode(appState.altitude.toString()));
        xmlDoc.documentElement.appendChild(node_altitude);
        //speed
        let node_speed = document.createElementNS(MISSION_NS,'speed');
        node_speed.appendChild(document.createTextNode(appState.speed.toString()));
        xmlDoc.documentElement.appendChild(node_speed);
        //photoTimeInterval
        let node_photoTimeInterval = document.createElementNS(MISSION_NS,'photoTimeInterval');
        node_photoTimeInterval.appendChild(document.createTextNode(appState.photoInterval));
        xmlDoc.documentElement.appendChild(node_photoTimeInterval);
        //photoOverlay
        let node_overlay = document.createElementNS(MISSION_NS,'overlay');
        node_overlay.appendChild(document.createTextNode(appState.overlay));
        xmlDoc.documentElement.appendChild(node_overlay);

        //interpolation
        let interpVal;
        if(appState.interpolate){
            // interpVal = vue_interpoints.distance;
            interpVal = appState.interpStep;
        }else{
            interpVal = 0;
        }
        let node_interpolation = document.createElementNS(MISSION_NS,'interpolation');
        node_interpolation.appendChild(document.createTextNode(interpVal));
        xmlDoc.documentElement.appendChild(node_interpolation);

        //grid
        if(appState.grid){
            let node_grid = document.createElementNS(MISSION_NS,'grid');
            node_grid.setAttribute('align', appState.gridAlign);
            for(let i=0; i<appState.gridCorners.length; i++){
                let node_vertex = document.createElementNS(MISSION_NS, 'vertex');
                node_vertex.setAttribute('lat',appState.gridCorners[i].position.lat());
                node_vertex.setAttribute('lon',appState.gridCorners[i].position.lng());
                node_grid.appendChild(node_vertex);
            }
            xmlDoc.documentElement.appendChild(node_grid);
        }

        //track

        xmlDoc = track.saveToXML(xmlDoc);
        const xmlDocSerial = new XMLSerializer().serializeToString(xmlDoc);

        let blob = new Blob([vkbeautify.xml(xmlDocSerial)], {
            type: "application/xml;charset=utf-8;"
        });

        return blob;
    }


}