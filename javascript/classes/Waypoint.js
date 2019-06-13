class Waypoint {
    constructor(latitude, longitude, groundElevation, heightAboveGroundLevel,
        elevationResolution, speed, origin){
    this._latitude = latitude;
    this._longitude = longitude;
    this._groundElevation = groundElevation;
    this._heightAboveGroundLevel = heightAboveGroundLevel;
    this._elevationResolution = elevationResolution;
    this._speed = speed;
    this._origin = origin;
    this._moved = false;
    }

    getLat(){
        return this._latitude;
    }

    setLat(lat){
        this._latitude = lat;
        this._groundElevation = 0;
    }
    
    getLng(){
        return this._longitude;
    }

    setLng(lng){
        this._longitude = lng;
        this._groundElevation = 0;
    }

    getOrigin(){
        return this._origin;
    }

    getMoved(){
        return this._moved;
    }

    setMoved(){
        this._moved = true;
    }

    latRad(){
        return Math.PI * this._latitude / 180;
    }
    lonRad(){
        return Math.PI * this._longitude / 180;
    }

    //distance to another point
    groundDistance(target){
        const R = 6371009;
        let dLon = target.lonRad() - this.lonRad();
        let dLat = target.latRad() - this.latRad();
        let dLonm = Math.cos((this.latRad() + target.latRad()) / 2) * dLon;

        return R * Math.sqrt(dLat * dLat + dLonm*dLonm);
    }

    //create interpolated points
    sectionPoints(target, sectionCount){
        let df = (target._latitude - this._latitude) / sectionCount;
        let dl = (target._longitude - this._longitude) / sectionCount;
        let maxEres = Math.max(target._elevationResolution, this._elevationResolution);
        let interPoints = [];
        for(let i=0; i<= sectionCount; i++) {
            if(i > 0 && i < sectionCount) {
                interPoints.push(new Waypoint(this._latitude + df*i,
                    this._longitude + dl*i,
                    0,
                    0,
                    maxEres,
                    0,
                    'INTERPOLATED'));
            }
        }
        return interPoints;
    }

    getGroundElevation(){
        return this._groundElevation;
    }

    setGroundElevation(gele){
        this._groundElevation = gele;
    }

    getHeightAboveGroundLevel(){
        return this._heightAboveGroundLevel;
    }

    setHeightAboveGroundLevel(agl){
        this._heightAboveGroundLevel = agl;
    }

    getElevationResolution(){
        return this._elevationResolution;
    }

    setElevationResolution(eres){
        this._elevationResolution = eres;
    }

    getSpeed(){
        return this._speed;
    }

    setSpeed(speed){
        this._speed = speed;
    }


}