import React, { useEffect, useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { ArcLayer, ScatterplotLayer } from "@deck.gl/layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import { Map } from "react-map-gl/maplibre";

const INITIAL_VIEW_STATE = {
  latitude: 55.9533,
  longitude: -3.1883,
  zoom: 11.3,
  pitch: 45,
  bearing: 15,
};

export default function EdinburghFlowMap() {
  const [flows, setFlows] = useState([]);
  const [time, setTime] = useState(0);

  // --------------------------------------------------
  // Load flows
  // --------------------------------------------------
  useEffect(() => {
    fetch("/rural_flows_edinburgh.json")
      .then((r) => r.json())
      .then(setFlows);
  }, []);

  // --------------------------------------------------
  // Animation for TripsLayer
  // --------------------------------------------------
  useEffect(() => {
    let frame;
    const loop = () => {
      setTime((t) => (t + 0.8) % 2000); // slow trips animation
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, []);

  // --------------------------------------------------
  // Trips data
  // --------------------------------------------------
  const tripsData = flows.map((d) => ({
    path: [
      [d.from.lon, d.from.lat],
      [d.to.lon, d.to.lat],
    ],
    weight: d.weight,
    timestamps: [0, 2000],
    color: [d.hue % 255, 100, 255], // we'll add alpha later
  }));

  // --------------------------------------------------
  // More transparent TripsLayer
  // --------------------------------------------------
  const tripsLayer = new TripsLayer({
    id: "trips",
    data: tripsData,
    getPath: (d) => d.path,
    getTimestamps: (d) => d.timestamps,

    // ⭐ Add alpha = softer line
    getColor: (d) => [d.color[0], d.color[1], d.color[2], 130],

    widthMinPixels: 2,
    trailLength: 300,
    currentTime: time,
    fadeTrail: true,
    opacity: 0.6, // ⭐ more transparent
  });

  // --------------------------------------------------
  // More transparent ArcLayer
  // --------------------------------------------------
  const arcLayer = new ArcLayer({
    id: "arc",
    data: flows,
    getSourcePosition: (d) => [d.from.lon, d.from.lat],
    getTargetPosition: (d) => [d.to.lon, d.to.lat],

    getSourceColor: [120, 120, 255, 35], // transparent
    getTargetColor: [255, 220, 120, 50], // transparent

    getWidth: (d) => Math.sqrt(d.weight) * 0.6,
    opacity: 0.15,
  });

  // --------------------------------------------------
  // Outer glow circle (large, faint yellow)
  // --------------------------------------------------
  const venueGlowOuter = new ScatterplotLayer({
    id: "venue-glow-outer",
    data: flows.map((d) => ({
      lon: d.to.lon,
      lat: d.to.lat,
      weight: d.weight,
    })),
    getPosition: (d) => [d.lon, d.lat],

    getFillColor: [255, 210, 70, 90], // faint yellow glow
    getRadius: (d) => 200 + Math.sqrt(d.weight) * 6, // ⭐ larger radius
    radiusMinPixels: 20,
    opacity: 1.0,
    pickable: false,
  });

  // --------------------------------------------------
  // Inner solid yellow point
  // --------------------------------------------------
  const venueGlowInner = new ScatterplotLayer({
    id: "venue-glow-inner",
    data: flows.map((d) => ({
      lon: d.to.lon,
      lat: d.to.lat,
      weight: d.weight,
    })),
    getPosition: (d) => [d.lon, d.lat],

    getFillColor: [255, 230, 0, 255], // bright yellow
    getRadius: 80, // ⭐ bigger solid circle
    radiusMinPixels: 12,

    opacity: 1.0,
    pickable: true,
  });

  // --------------------------------------------------
  // Tooltip
  // --------------------------------------------------
  const getTooltip = ({ object }) => {
    if (!object?.weight) return null;
    return {
      text: `🏟 Venue\n🎟 ${object.weight} tickets`,
      style: {
        fontSize: "14px",
        backgroundColor: "#333",
        color: "#fff",
        padding: "6px 10px",
        borderRadius: "6px",
      },
    };
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <DeckGL
      controller
      initialViewState={INITIAL_VIEW_STATE}
      layers={[
        arcLayer,
        tripsLayer,
        venueGlowOuter, // glow ring
        venueGlowInner, // solid yellow dot
      ]}
      getTooltip={getTooltip}
    >
      <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
    </DeckGL>
  );
}
