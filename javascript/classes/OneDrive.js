class Onedrive {
    //launches OneDrive file picker
    //the result of the picker is path of the chosen file
    //the file is downloaded on file picker success
    static launchOneDrivePicker(appState, markers, track, trackLine){
        const odOptions = {
            clientId: 'aabba888-de13-40f6-8548-636ea836a47a',   //APP ID
            action: "download",
            multiSelect: false,
            advanced: {
                filter: ['.taitale','.gpx']
            },
            success: function(files) {
                let selectedFile = files.value[0];
                let downloadLink = selectedFile["@microsoft.graph.downloadUrl"];

                $.ajax(downloadLink, {
                    success: function (data, status, xhr) {
                        const myblob = new Blob([xhr.responseText], {
                            type: 'text/plain'
                        });

                        appState.readFile(myblob, markers, track, trackLine);
                    },
                    error: function(xhr, status, err) {
                        console.log('err: ' + err);
                    }
                });

            },
            cancel: function() { /* cancel handler */ },
            error: function(e) {
                alert('Error: ' + e);
            }
        };
        OneDrive.open(odOptions);
    }

    //launches OneDrive picker
    //the result is a path where to store the file
    //the file is uploaded on succes event from the picker
    static launchSaveToOneDrive(fileContent, filename){
        const odOptions = {
            clientId: 'aabba888-de13-40f6-8548-636ea836a47a',   //APP ID
            action: "query",
            advanced: {
                // Request additional parameters when we save the file
                queryParameters: "select=id,name,parentReference"
            },
            success: function(selection) {
                let folder = selection.value[0];
                let newFile = {
                    id: null,
                    name: filename+'.taitale',
                    parentReference: {
                        driveId: folder.parentReference.driveId,
                        id: folder.id
                    }
                };
                let accessToken = selection.accessToken;
                const url = Onedrive.generateGraphUrl(newFile, true, ":/content");

                $.ajax(url, {
                    method: "PUT",
                    contentType: "application/octet-stream",
                    data: fileContent,
                    processData: false,
                    headers: { Authorization: "Bearer " + accessToken },
                    success: function(data, status, xhr) {
                        if (data && data.name && data.parentReference) {
                            const saveDialogBackground = document.getElementById('save-dialog-background');
                            const saveDialogContainer = document.getElementById('save-dialog-container');
                            saveDialogBackground.style.display = 'none';
                            saveDialogContainer.style.display = 'none';
                            alert('File was saved.');
                        }
                    },
                    error: function(xhr, status, err) {
                        alert('Err: ' + err);
                    }
                });
            },
            progress: function(p) { /* progress handler */ },
            cancel: function() { /* cancel handler */ },
            error: function(e) {
                console.log(e);
                alert('Error: ' + e);
            }
        };
        OneDrive.save(odOptions);
    }

    static generateGraphUrl(driveItem, targetParentFolder, itemRelativeApiPath) {
        let url = "https://graph.microsoft.com/v1.0/"; //microsoft Graph API Root
        if (targetParentFolder)
        {

            //https://graph.microsoft.com/v1.0/drives/66298d2319bf5c55/items/66298D2319BF5C55!105/children/newFile.taitale/content
            //url += "drives/" + driveItem.parentReference.driveId + "/items/" +driveItem.parentReference.id + "/children/" + driveItem.name;
            //PUT                               /drives/{drive-id}/items/{parent-id}:/{filename}:/content
            url += "drives/" + driveItem.parentReference.driveId + "/items/" +driveItem.parentReference.id + ":/" + driveItem.name;

        } else {
            url += "drives/" + driveItem.parentReference.driveId + "/items/" + driveItem.id;
        }

        if (itemRelativeApiPath) {
            url += itemRelativeApiPath;
        }
        url += "?@name.conflictBehavior=rename";    //doesnt overwrite if file already exists
        console.log(url);
        return url;
    }
}

