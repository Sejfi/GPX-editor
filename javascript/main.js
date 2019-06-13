function initMap() {
    map = new google.maps.Map(
        document.getElementById('map'), 
        {
            center: {lat: 50.0958211, lng: 14.4156313},
            zoom: 18

        }
    );
    GoogleMap.init(map);

    gpxEditor();
}

function gpxEditor(){
    const appState = new AppState();
    let markers = [];
    let track = new Track();
        
    let trackLine = new google.maps.Polyline({
        geodesic: true,
        strokeColor: 'black',
        strokeOpacity: 1.0,
        strokeWeight: 6
    });
    // let gridCorners = [];
    const chbxInterpolation = document.getElementById("chbx-interpolation");

    //btn load fires click on the hidden file input
    //(due to easier styling)
    const btnLoadLocal = document.getElementById("btn-l-local");
    const fileInput = document.getElementById("file-input");
    btnLoadLocal.onclick = ()=> {
        fileInput.click();
    };

    fileInput.onchange = ()=> {
        let ext = fileInput.value.match(/\.([^\.]+)$/)[1];
        if (ext === 'gpx' || ext === 'taitale') {
            //reset environment
            resetEnvironment();

            let file = fileInput.files[0];
            //read track data from file, create the track object
            //and setup the control panel
            appState.readFile(file, markers, track, trackLine);

        } else {
            alert('File type is not supported!');
            fileInput.value = '';
        }

    };

    function resetEnvironment() {
        appState.grid = false;
        if(appState.interpolate){
            chbxInterpolation.checked = false;
            appState.interpolate = false;
        }
        GoogleMap.resetTrack(appState, markers, track, trackLine);
        appState.updateStats(track);
        appState.sectionEleShow('nodata');
    }

    
    const btnPolyline = document.getElementById("poly-line");

    btnPolyline.onclick = ()=> {
        appState.grid = false;
        if(appState.interpolate){
            chbxInterpolation.checked = false;
            appState.interpolate = false;
        }
        GoogleMap.resetTrack(appState, markers, track, trackLine);
        appState.updateStats(track);
        appState.sectionEleShow('nodata');
        Polyline.start(appState, markers, track, trackLine);
    };

    const btnGrid = document.getElementById("grid");
    btnGrid.onclick = ()=> {
        appState.grid = true;
        if(appState.interpolate){
            chbxInterpolation.checked = false;
            appState.interpolate = false;
        }
        GoogleMap.resetTrack(appState, markers, track, trackLine);
        appState.updateStats(track);
        appState.sectionEleShow('nodata');
        Grid.start(appState, markers, track, trackLine);
    };


    const sliderAltitude = document.getElementById("altitude");
    const sliderSpeed = document.getElementById("speed");
    const sliderPhotoInterval = document.getElementById("photo-interval");
    const valAltitude = document.getElementById("altitude-val");
    const valSpeedKmh = document.getElementById("speed-val-km");
    const valSpeedMs = document.getElementById("speed-val-m");
    const valPhotoPercent = document.getElementById("photo-val-percent");
    const valPhotoSec = document.getElementById("photo-val-sec");
    sliderAltitude.value = appState.altitude;
    sliderSpeed.value = appState.speed;
    sliderPhotoInterval.value = appState.photoInterval;
    appState.altitude = sliderAltitude.value;
    appState.speed = sliderSpeed.value;
    appState.photoInterval = sliderPhotoInterval.value;

    //update displayed values during drag event
    sliderAltitude.oninput = ()=> {
        valAltitude.innerText = sliderAltitude.value;
        appState.altitude = sliderAltitude.value;
        valPhotoPercent.innerText =
            Math.round(Grid.getOverlay(appState.speed, appState.altitude, appState.photoInterval)).toString();
    };

    sliderSpeed.oninput = ()=> {
        valSpeedMs.innerText = sliderSpeed.value;
        valSpeedKmh.innerText = Math.round(sliderSpeed.value/1000*60*60).toString();
        appState.speed = sliderSpeed.value;
        valPhotoPercent.innerText =
            Math.round(Grid.getOverlay(appState.speed, appState.altitude, appState.photoInterval)).toString();

        if(track.getPoints()) {
            if (appState.interpolate) {
                track.deleteInterpoints();
                track.interspace(appState.interpStep);

            }
            // drawGridBorder();
            if (appState.polygonConvex && appState.grid) {
                GoogleMap.clearMarkers(markers, trackLine);
                Grid.fillGrid(appState, track, markers, trackLine);
                GoogleMap.drawMarkers(appState, track, markers, trackLine);
            } else {

            }
        }
    };

    sliderPhotoInterval.oninput = ()=> {
        valPhotoSec.innerText = sliderPhotoInterval.value;
        appState.photoInterval = sliderPhotoInterval.value;
        valPhotoPercent.innerText =
            Math.round(Grid.getOverlay(appState.speed, appState.altitude, appState.photoInterval)).toString();

        if(track.getPoints()){
            if(appState.interpolate){
                track.deleteInterpoints();
                track.interspace(appState.interpStep);

            }

            if(appState.polygonConvex && appState.grid) {
                GoogleMap.clearMarkers(markers, trackLine);
                Grid.fillGrid(appState, track, markers, trackLine);
                GoogleMap.drawMarkers(appState, track, markers, trackLine);
            }else {

            }

        }

    };



    const sliderInterpolation = document.getElementById("interpolation");
    const valInterp = document.getElementById("interp-val");
    sliderInterpolation.value = appState.interpStep;
    valInterp.innerText = sliderInterpolation.value;
    //fires during a drag event
    sliderInterpolation.oninput = ()=> {
        valInterp.innerText = sliderInterpolation.value;
    };
    //fires on final change (drag release)
    sliderInterpolation.onchange = ()=> {
        appState.interpStep = sliderInterpolation.value;
        if(appState.interpolate){
            track.deleteInterpoints();
            track.interspace(appState.interpStep);
            GoogleMap.clearMarkers(markers, trackLine);
            GoogleMap.drawMarkers(appState, track, markers, trackLine);
        }

    };

    chbxInterpolation.onchange = ()=>{
        appState.interpolate = chbxInterpolation.checked;
        if(appState.interpolate){
            track.interspace(appState.interpStep);
        }else{
            track.deleteInterpoints();
        }
        GoogleMap.clearMarkers(markers, trackLine);
        GoogleMap.drawMarkers(appState, track, markers, trackLine);
    };

    const btnGetElevation = document.getElementById('get-elevation');
    btnGetElevation.onclick = ()=> {
        if(track.size()){
            track.getGoogleElevation(appState);

        }else{
            alert('No Track - Create or load a track first.');
        }
    };

    const btnSaveDialog = document.getElementById('btn-savedialog');
    const saveDialogBackground = document.getElementById('save-dialog-background');
    const saveDialogContainer = document.getElementById('save-dialog-container');
    const closeSaveDialog = document.getElementById('close-save-dialog');
    btnSaveDialog.onclick = ()=> {
        saveDialogBackground.style.display = 'block';
        saveDialogContainer.style.display = 'block';
    };
    saveDialogBackground.onclick = ()=> {
        saveDialogBackground.style.display = 'none';
        saveDialogContainer.style.display = 'none';
    };
    closeSaveDialog.onclick = ()=> {
        saveDialogBackground.style.display = 'none';
        saveDialogContainer.style.display = 'none';
    };

    const btnSaveLocal = document.getElementById('btn-save-local');
    const saveErrors = document.getElementById('save-errors');
    btnSaveLocal.onclick = ()=> {
        const errors = appState.validateParams(track);
        if(!errors) {
            saveErrors.innerText = "";
            //set creationTime to now, format: 2017-11-29T18:43:35
            const now = new Date();
            appState.creationTime = now.getFullYear() +'-'+ (now.getMonth()+1).toString() +'-'+
                now.getDate() +'T'+ now.getHours() +':'+ now.getMinutes() +':'+ now.getSeconds();
            track.setGlobalSpeedAltitude(appState.speed, appState.altitude);
            //save
            let blob = Mission.saveToXML(appState, track);
            saveAs(blob, appState.name+".taitale");
        }else {
            saveErrors.innerText = errors;
        }
    };

    const btnLoadOneDrive = document.getElementById('btn-l-onedrive');
    btnLoadOneDrive.onclick = ()=> {
        resetEnvironment();
        Onedrive.launchOneDrivePicker(appState, markers, track, trackLine);
    };

    const btnSaveOneDrive = document.getElementById('btn-save-onedrive');
    btnSaveOneDrive.onclick = ()=> {
        const errors = appState.validateParams(track);
        if(!errors) {
            saveErrors.innerText = "";
            //set creationTime to now, format: 2017-11-29T18:43:35
            const now = new Date();
            appState.creationTime = now.getFullYear() +'-'+ (now.getMonth()+1).toString() +'-'+
                now.getDate() +'T'+ now.getHours() +':'+ now.getMinutes() +':'+ now.getSeconds();
            track.setGlobalSpeedAltitude(appState.speed, appState.altitude);
            //save
            let blob = Mission.saveToXML(appState, track);
            Onedrive.launchSaveToOneDrive(blob, appState.name); //ONEDRIVE
        }else {
            saveErrors.innerText = errors;
        }

    };


    //tooltips
    const tooltips = document.getElementsByClassName('tooltip');
    document.addEventListener('mousemove',(event)=>{
        for(let i = 0; i<tooltips.length; i++){
            tooltips[i].style.left = event.pageX + 'px';
            tooltips[i].style.top = event.pageY + 'px';
        }

    });


}





