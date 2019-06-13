//funkce pro praci s primkami ve 2D prostoru
class Line{

    //koeficienty rovnice primky v obecnem tvaru ze dvou bodu
    static from2points(A, B, side){
        const n = this.normalVector(A,B,side);
        const c = -n.x*A.lng() - n.y*A.lat();
        return {a:n.x, b:n.y, c};
    }

    //posun primky po vektoru
    static move(A, B, normal, dist, step, clockwise){
        //dist velikost vektoru, rozpocitat podle normaloveho na x a y slozku
        //a pak prepocitat z m na lat lng
        const dy = dist*normal.y/111111; //m to deg
        const dx = dist*normal.x/(111111*Math.cos(A.lat()*Math.PI/180));

        const x1 = A.lng()+step*dx;
        const y1 = A.lat()+step*dy;
        const x2 = B.lng()+step*dx;
        const y2 = B.lat()+step*dy;

        const latLngA = new google.maps.LatLng(y1, x1);
        const latLngB = new google.maps.LatLng(y2, x2);

        return Line.from2points(latLngA, latLngB, clockwise);
    }

    //vrati primky hran polygonu z vrcholu polygonu
    static borderLines(corners, clockwise){
        let lines = [];
        for(let i =0; i<corners.length-1; i++){
            lines.push(Line.from2points(corners[i].position, corners[i+1].position, clockwise));
        }
        //last line (last and first corner)
        lines.push(Line.from2points(corners[corners.length-1].position, corners[0].position, clockwise));

        return lines;
    }

    //najde prusecik primek p a q
    //(dve rovnice o dvou neznamych)
    static intersection(p,q){
        const x = (p.b*q.c - p.c*q.b)/(p.a*q.b - q.a*p.b);
        let y;
        if(p.b !== 0){
            y = (-p.a*x - p.c)/p.b;
        }else{
            y = (q.a*x+q.c)/(-q.b);
        }

        return new google.maps.LatLng(y,x);
    }

    //vrati jednotkovy normalovy vektor primky definovane dvema body
    static normalVector(A,B, side=true){
        const direction = {x:B.lng()-A.lng(), y:B.lat()-A.lat()};
        let normalDirection;

        //vektor bude smerovat smerem DO polygonu
        if(side){
            normalDirection ={x: direction.y, y: -direction.x};
        }else{
            normalDirection ={x: -direction.y, y: direction.x};
        }

        const nSize = Math.sqrt((direction.x*direction.x + direction.y*direction.y));
        //jednotkovy vektor
        normalDirection.x /= nSize;
        normalDirection.y /= nSize;
        return normalDirection;
    }

    static pointsToVector(A,B){
        const x = B.lng()-A.lng();
        const y = B.lat()-A.lat();
        return new google.maps.LatLng(x,y);
    }

    //vzdalenost bodu A od primky p
    static pointLineDistance(p,A){
        //https://matematika.cz/vzdalenost-bod-primka
        const numerator = Math.abs(p.a*A.lng() + p.b*A.lat() + p.c);
        const denominator = Math.sqrt(p.a*p.a + p.b*p.b);
        return numerator / denominator;
    }


}