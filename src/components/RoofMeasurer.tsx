import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
// Ensure L is on window for Leaflet plugins
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import 'leaflet-geometryutil';
import { cn } from '@/src/lib/utils';
import { Roof } from '@/src/types';
import { MapPin, Save, Info, Trash2, MousePointer2, CheckCircle2 } from 'lucide-react';

interface RoofMeasurerProps {
  onSave: (roof: Roof) => void;
  savedRoofs: Roof[];
}

export default function RoofMeasurer({ onSave, savedRoofs }: RoofMeasurerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [buildingName, setBuildingName] = useState('');
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const [tempPolygon, setTempPolygon] = useState<L.Polygon | null>(null);
  const [guideLine, setGuideLine] = useState<L.Polyline | null>(null);
  const [tempMarkers, setTempMarkers] = useState<L.Marker[]>([]);
  const [estimatedArea, setEstimatedArea] = useState(0);
  const [error, setError] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const draggingRef = useRef<number | null>(null);

  // Nottingham Road, KwaZulu Natal, South Africa
  const INITIAL_CENTER: [number, number] = [-29.358, 29.992];
  const INITIAL_ZOOM = 16;

  useEffect(() => {
    if (!mapRef.current || map) return;

    const m = L.map(mapRef.current, {
      maxZoom: 22
    }).setView(INITIAL_CENTER, INITIAL_ZOOM);
    
    L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases">CyclOSM</a>',
      maxZoom: 22,
      maxNativeZoom: 19
    }).addTo(m);

    setMap(m);

    return () => {
      m.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;
      
      // Check if clicking near the first point to close
      if (points.length > 2) {
        const firstPoint = points[0];
        const pixelDist = map.latLngToContainerPoint(e.latlng).distanceTo(map.latLngToContainerPoint(firstPoint));
        if (pixelDist < 25) {
          finishDrawing();
          return;
        }
      }
      
      setPoints(prev => [...prev, e.latlng]);
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || points.length === 0) return;
      // No guide line as requested
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [map, points, isDrawing, guideLine]);

  useEffect(() => {
    if (!map) return;

    // Clear old temp layers
    if (tempPolygon) tempPolygon.remove();
    tempMarkers.forEach(m => m.remove());

    if (points.length > 0) {
      const poly = L.polygon(points, { color: '#3b82f6', weight: 3, fillOpacity: 0 }).addTo(map);
      setTempPolygon(poly);

      const markers = points.map((p, i) => {
        const markerIcon = L.divIcon({
          html: `<div style="width: 12px; height: 12px; background: white; border: 3px solid #ef4444; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: move;"></div>`,
          className: '',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        const marker = L.marker(p, { 
          icon: markerIcon,
          draggable: true,
          zIndexOffset: 1000
        }).addTo(map);
        
        marker.on('dragstart', () => {
          draggingRef.current = i;
        });

        marker.on('drag', (e) => {
          const newLatLng = e.target.getLatLng();
          // Update polygon visually during drag
          if (poly) {
            const currentPoints = [...points];
            currentPoints[i] = newLatLng;
            poly.setLatLngs([currentPoints]);
          }
        });

        marker.on('dragend', (e) => {
          const newLatLng = e.target.getLatLng();
          draggingRef.current = null;
          setPoints(prev => {
            const next = [...prev];
            next[i] = newLatLng;
            return next;
          });
        });

        if (i === 0 && points.length > 2) {
          marker.bindTooltip("Click to Close Shape", { permanent: false, direction: 'top' });
          marker.on('click', (e) => {
            // Only close if we weren't just dragging
            if (draggingRef.current === null) {
              L.DomEvent.stopPropagation(e);
              finishDrawing();
            }
          });
        }
        return marker;
      });
      setTempMarkers(markers);

      // Calculate Area
      if (points.length > 2) {
        let area = 0;
        try {
          // Attempt to use plugin
          area = (L.GeometryUtil as any).geodesicArea(points);
        } catch (e) {
          // Fallback to planar approximation (very accurate for small areas like roofs)
          const first = points[0];
          const projectedPoints = points.map(p => {
            const y = (p.lat - first.lat) * 111320;
            const x = (p.lng - first.lng) * 111320 * Math.cos(first.lat * Math.PI / 180);
            return { x, y };
          });
          
          let shoelace = 0;
          for (let i = 0; i < projectedPoints.length; i++) {
            const j = (i + 1) % projectedPoints.length;
            shoelace += projectedPoints[i].x * projectedPoints[j].y;
            shoelace -= projectedPoints[j].x * projectedPoints[i].y;
          }
          area = Math.abs(shoelace) / 2;
        }
        setEstimatedArea(Math.round(area));
      } else {
        setEstimatedArea(0);
      }
    }
  }, [points]);

  const tidyPoints = (pts: L.LatLng[]) => {
    if (pts.length < 3) return pts;
    
    // 1. Project to a local Cartesian system (meters) to avoid lat/lng distortion
    const p0 = pts[0];
    const latFactor = 111320;
    const lngFactor = 111320 * Math.cos(p0.lat * Math.PI / 180);
    
    const projected = pts.map(p => ({
      x: (p.lng - p0.lng) * lngFactor,
      y: (p.lat - p0.lat) * latFactor
    }));
    
    // 2. Determine principal angle from the longest segment in meter-space
    let maxDistSq = 0;
    let principalAngle = 0;
    for (let i = 0; i < projected.length; i++) {
      const pA = projected[i];
      const pB = projected[(i + 1) % projected.length];
      const dx = pB.x - pA.x;
      const dy = pB.y - pA.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > maxDistSq) {
        maxDistSq = d2;
        principalAngle = Math.atan2(dy, dx);
      }
    }
    
    const cosF = Math.cos(-principalAngle);
    const sinF = Math.sin(-principalAngle);
    const cosB = Math.cos(principalAngle);
    const sinB = Math.sin(principalAngle);

    const getRot = (p: {x: number, y: number}) => {
      return {
        x: p.x * cosF - p.y * sinF,
        y: p.x * sinF + p.y * cosF
      };
    };

    const fromRot = (r: {x: number, y: number}) => {
      const x = r.x * cosB - r.y * sinB;
      const y = r.x * sinB + r.y * cosB;
      return L.latLng(
        p0.lat + y / latFactor,
        p0.lng + x / lngFactor
      );
    };
    
    const rotated = projected.map(p => getRot(p));
    const tidiedRotated: {x: number, y: number}[] = [rotated[0]];
    let lastRot = rotated[0];

    for (let i = 1; i < rotated.length; i++) {
      const currRot = rotated[i];
      const dx = currRot.x - lastRot.x;
      const dy = currRot.y - lastRot.y;
      
      const angle = Math.atan2(dy, dx);
      // Normalized angle to [0, PI/2) to check closeness to orthogonal axes
      const normalizedAngle = Math.abs(((angle + Math.PI / 4) % (Math.PI / 2)) - Math.PI / 4);
      const snapThreshold = 20 * Math.PI / 180; // 20 degrees tolerance for squaring
      
      let nextRot;
      if (normalizedAngle < snapThreshold) {
        // Snap to the closest orthogonal axis in the rotated coordinate system
        if (Math.abs(dx) > Math.abs(dy)) {
          nextRot = { x: currRot.x, y: lastRot.y };
        } else {
          nextRot = { x: lastRot.x, y: currRot.y };
        }
      } else {
        // Preserve original angle if it's a "large angular change"
        nextRot = currRot;
      }
      
      // Avoid adding redundant points (threshold in meters)
      if (Math.abs(nextRot.x - lastRot.x) > 0.1 || Math.abs(nextRot.y - lastRot.y) > 0.1) {
        tidiedRotated.push(nextRot);
        lastRot = nextRot;
      }
    }

    // Close the loop orthogonally to the first point ONLY if the last segment was orthogonal
    const firstRot = tidiedRotated[0];
    const finalRot = tidiedRotated[tidiedRotated.length - 1];
    const prevRot = tidiedRotated[tidiedRotated.length - 2] || firstRot;
    
    const lastAngle = Math.atan2(finalRot.y - prevRot.y, finalRot.x - prevRot.x);
    const lastNormalizedAngle = Math.abs(((lastAngle + Math.PI / 4) % (Math.PI / 2)) - Math.PI / 4);
    const snapThreshold = 20 * Math.PI / 180;

    if (lastNormalizedAngle < snapThreshold && (Math.abs(finalRot.x - firstRot.x) > 0.5 || Math.abs(finalRot.y - firstRot.y) > 0.5)) {
      const wasX = Math.abs(finalRot.x - prevRot.x) > Math.abs(finalRot.y - prevRot.y);
      const interRot = wasX ? { x: finalRot.x, y: firstRot.y } : { x: firstRot.x, y: finalRot.y };
      
      // Only add if it's not redundant
      if (Math.abs(interRot.x - finalRot.x) > 0.1 || Math.abs(interRot.y - finalRot.y) > 0.1) {
        tidiedRotated.push(interRot);
      }
    }
    
    return tidiedRotated.map(p => fromRot(p));
  };

  const finishDrawing = () => {
    setPoints(prev => tidyPoints(prev));
    setIsDrawing(false);
    if (guideLine) guideLine.remove();
    setGuideLine(null);
  };

  const resetDrawing = () => {
    setPoints([]);
    setEstimatedArea(0);
    setIsDrawing(false);
    if (tempPolygon) tempPolygon.remove();
    if (guideLine) guideLine.remove();
    setGuideLine(null);
    tempMarkers.forEach(m => m.remove());
  };

  const handleSave = () => {
    if (!buildingName.trim()) {
      setError(true);
      setTimeout(() => setError(false), 3000);
      return;
    }

    if (points.length < 3) return;

    onSave({
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name: buildingName,
      area: estimatedArea,
      shape: 'rectangle' // Defaulting to rectangle as it's squared
    });

    // Add permanent polygon to map
    if (map) {
      L.polygon(points, { color: '#22c55e', weight: 2, fillOpacity: 0.2 }).addTo(map)
        .bindPopup(`<b>${buildingName}</b><br/>Area: ${estimatedArea} m²`);
    }

    setBuildingName('');
    resetDrawing();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Controls - Smaller */}
      <div className="w-full lg:w-1/4 bg-orange-50 p-5 rounded-3xl border-2 border-orange-200 flex flex-col gap-4 shadow-sm">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
          <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2 mb-1">
            <Info className="w-4 h-4" /> How to Measure
          </h2>
          <p className="text-xs text-slate-600 leading-tight">
            1. Click <b>"Start New Roof"</b> to begin.<br />
            2. Trace the outline by clicking corners.<br />
            3. Click the <b>first point</b> to close and tidy up!
          </p>
        </div>

        <div className="space-y-3">
          {!isDrawing && points.length === 0 && (
            <button 
              onClick={() => setIsDrawing(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm shadow-lg flex items-center justify-center gap-2"
            >
              <MousePointer2 className="w-4 h-4" /> Start New Roof
            </button>
          )}
          <div>
            <label className="block font-bold text-slate-700 text-sm mb-1">Building Name:</label>
            <input 
              type="text" 
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="e.g. Main Hall..." 
              className={cn(
                "w-full p-2.5 rounded-xl border-2 transition-all focus:outline-none text-sm",
                error ? "border-red-400 bg-red-50" : "border-orange-200 focus:border-orange-500"
              )}
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={resetDrawing}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Reset
            </button>
            {points.length > 2 && isDrawing && (
              <button 
                onClick={finishDrawing}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Finish
              </button>
            )}
          </div>
        </div>

        <div className="bg-orange-600 text-white p-4 rounded-2xl text-center shadow-inner mt-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Estimated Area</p>
          <p className="text-3xl font-black">{estimatedArea} <span className="text-sm">m²</span></p>
        </div>

        <button 
          onClick={handleSave}
          disabled={points.length < 3 || isDrawing}
          className={cn(
            "w-full font-bold py-3 rounded-xl text-lg shadow-lg transition-all transform flex items-center justify-center gap-2",
            (points.length < 3 || isDrawing) 
              ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
              : "bg-green-500 hover:bg-green-600 text-white hover:scale-[1.02] active:scale-95"
          )}
        >
          <Save className="w-5 h-5" /> Save Roof
        </button>
      </div>

      {/* Map Area - Bigger */}
      <div className="w-full lg:w-3/4 relative">
        <div ref={mapRef} className="h-[65vh] w-full rounded-3xl overflow-hidden border-4 border-blue-400 shadow-xl relative z-0 cursor-crosshair" />
        
        {isDrawing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg z-10 border-2 border-blue-400 flex items-center gap-2 pointer-events-none">
            <MousePointer2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold text-slate-700">
              {points.length === 0 ? "Click map to place first corner" : "Trace the outline (will tidy up at the end)"}
            </span>
          </div>
        )}

        {/* Saved Roofs List Overlay */}
        {savedRoofs.length > 0 && (
          <div className="absolute bottom-6 left-6 bg-white/95 p-3 rounded-2xl shadow-xl z-20 border-2 border-green-400 max-h-40 overflow-y-auto w-56">
            <h3 className="font-bold text-green-700 text-xs flex items-center gap-1 mb-1 border-b pb-1">
              <MapPin className="w-3 h-3" /> Saved Roofs
            </h3>
            <ul className="space-y-1">
              {savedRoofs.map(r => (
                <li key={r.id} className="text-[10px] text-slate-700 flex justify-between items-center bg-green-50/50 p-1.5 rounded-lg">
                  <span className="font-medium truncate mr-1">{r.name}</span>
                  <span className="font-bold text-green-600 whitespace-nowrap">{r.area} m²</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
