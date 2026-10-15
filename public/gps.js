"use strict";
(() => {
  const limit=2000;
  const validPoint=p=>p && Number.isFinite(p.lat) && Math.abs(p.lat)<=90 && Number.isFinite(p.lng) && Math.abs(p.lng)<=180 && Number.isFinite(p.accuracy) && p.accuracy>=0 && p.accuracy<=50 && Number.isFinite(p.at) && p.at>=0 && p.at<=Date.now()+60000 && Number.isInteger(p.segment) && p.segment>=0;
  const valid=points=>points===undefined || (Array.isArray(points) && points.length<=limit && points.every((p,i)=>validPoint(p) && (!i || (p.at>points[i-1].at && p.segment>=points[i-1].segment))));
  function distance(a,b) {
    const rad=Math.PI/180, dl=(b.lat-a.lat)*rad, dn=(b.lng-a.lng)*rad;
    const h=Math.sin(dl/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dn/2)**2;
    return 6371000*2*Math.asin(Math.sqrt(Math.min(1,h)));
  }
  const metres=points=>(points||[]).reduce((sum,p,i)=>sum+(i && p.segment===points[i-1].segment ? distance(points[i-1],p) : 0),0);
  function route(points) {
    if(!points?.length)return '<p class="muted">Ingen GPS-punkter lagret.</p>';
    const lat=points[0].lat*Math.PI/180;
    const xy=points.map(p=>({x:(p.lng-points[0].lng)*Math.cos(lat),y:-(p.lat-points[0].lat),segment:p.segment}));
    const xs=xy.map(p=>p.x),ys=xy.map(p=>p.y), minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
    const scale=260/Math.max(maxX-minX,maxY-minY,0.0001), dx=(300-(maxX-minX)*scale)/2,dy=(300-(maxY-minY)*scale)/2;
    const coords=xy.map(p=>({...p,x:(dx+(p.x-minX)*scale).toFixed(2),y:(dy+(p.y-minY)*scale).toFixed(2)}));
    const paths=[];let group=[];
    coords.forEach((p,i)=>{if(i&&p.segment!==coords[i-1].segment){paths.push(group);group=[];}group.push(p);});paths.push(group);
    return `<figure class="gps-route"><svg viewBox="0 0 300 300" role="img" aria-label="Registrerte GPS-punkter, uten bakgrunnskart">${paths.map(g=>g.length>1?`<polyline points="${g.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`:`<circle cx="${g[0].x}" cy="${g[0].y}" r="4" fill="currentColor"/>`).join('')}</svg><figcaption>GPS-rute uten bakgrunnskart · ca. ${Math.round(metres(points))} m · ${points.length} punkter. Pauser er ikke koblet sammen.</figcaption></figure>`;
  }
  function recorder({geolocation,onPoint,onStatus,now=()=>Date.now()}) {
    let watch=null,epoch=0,points=null,segment=0,status='GPS er av.',gap=false;
    function tell(message){status=message;onStatus(message);}
    function stop(message='GPS er satt på pause. Trykk «Slå på GPS» for å fortsette.') {
      epoch++;
      if(watch!==null)geolocation?.clearWatch(watch);
      watch=null;points=null;tell(message);
    }
    function start(target) {
      if(watch!==null)return;
      if(!geolocation){tell('Denne nettleseren støtter ikke GPS. Turen kan registreres uten.');return;}
      if(target.length>=limit){tell('Grensen på 2 000 GPS-punkter er nådd. Turtiden fortsetter.');return;}
      points=target;segment=target.length?target.at(-1).segment+1:0;gap=false;
      const active=++epoch; tell('Venter på posisjon og tillatelse …');
      try {
        watch=geolocation.watchPosition(position=>{
          if(active!==epoch||!points)return;
          const c=position.coords, p={lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,at:position.timestamp,segment};
          if(!validPoint(p)||p.at<now()-30000){gap=true;tell('Venter på en mer presis posisjon. Turtiden fortsetter.');return;}
          const last=points.at(-1);
          if(last && (p.at<=last.at || p.at-last.at<5000))return;
          if(last && (gap || p.at-last.at>60000)){segment++;p.segment=segment;gap=false;}
          if(last && p.segment===last.segment && distance(last,p)<3)return;
          points.push(p);onPoint();tell('GPS er aktiv mens Nika er synlig.');
          if(points?.length>=limit)stop('Grensen på 2 000 GPS-punkter er nådd. Turtiden fortsetter.');
        },error=>{
          if(active!==epoch)return;
          if(error.code===1)stop('Posisjon er ikke tillatt. Du kan endre tillatelsen i nettleseren. Turen fortsetter uten GPS.');
          else {gap=true;tell('GPS-signalet er utilgjengelig. Venter på nytt signal.');}
        },{enableHighAccuracy:true,maximumAge:0,timeout:15000});
      }catch{stop('GPS kunne ikke startes. Turen fortsetter uten GPS.');}
    }
    return {start,stop,get active(){return watch!==null;},get status(){return status;}};
  }
  window.NikaGPS={valid,metres,route,recorder};
})();
