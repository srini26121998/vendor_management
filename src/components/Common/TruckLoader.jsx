import React, { useState, useEffect } from 'react';
import './TruckLoader.css';

const getMessages = (initialMessage) => {
  if (!initialMessage) return ["Delivering Excellence..."];
  
  const msg = initialMessage.toLowerCase();
  if (msg.includes('vendor') || msg.includes('supplier')) {
    return [
      initialMessage,
      "Establishing secure gateway...",
      "Syncing supplier catalog indexes...",
      "Validating partner credentials...",
      "Optimizing registry database view...",
      "Finalizing vendor interface..."
    ];
  }
  if (msg.includes('booking') || msg.includes('entry') || msg.includes('logistics') || msg.includes('gate') || msg.includes('verify')) {
    return [
      initialMessage,
      "Verifying bay allocation schedule...",
      "Authenticating digital driver pass...",
      "Connecting cold-chain temperature telemetry...",
      "Checking yard occupancy matrix...",
      "Opening gate sensors..."
    ];
  }
  if (msg.includes('po') || msg.includes('order') || msg.includes('grn') || msg.includes('invoice') || msg.includes('pay')) {
    return [
      initialMessage,
      "Fetching purchase order items...",
      "Initiating 3-way invoice matching...",
      "Analyzing compliance parameters...",
      "Securing financial ledger channel...",
      "Confirming transfer ledger entries..."
    ];
  }
  if (msg.includes('warehouse') || msg.includes('stock') || msg.includes('inventory') || msg.includes('map') || msg.includes('expiry')) {
    return [
      initialMessage,
      "Synthesizing 3D warehouse coordinate map...",
      "Evaluating warehouse capacity loads...",
      "Calculating inventory replenishment signals...",
      "Retrieving smart batch codes...",
      "Recalibrating bin location grid..."
    ];
  }
  return [
    initialMessage,
    "Firing up clean-diesel engines...",
    "Securing pallet containment straps...",
    "Plotting optimal route path via GPS...",
    "Synchronizing transit dispatch system...",
    "Approaching unloading dock...",
    "Arriving at target destination..."
  ];
};

const TruckLoader = ({ message = "Delivering Excellence...", overlay = false }) => {
  const messages = getMessages(message);
  const [msgIndex, setMsgIndex] = useState(0);
  const [currentMsg, setCurrentMsg] = useState(messages[0]);
  const [fadeState, setFadeState] = useState('fade-in');
  const [speed, setSpeed] = useState(62);
  const [progress, setProgress] = useState(12);
  const [latitude, setLatitude] = useState(13.0827);
  const [longitude, setLongitude] = useState(80.2707);

  // Cycle messages
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const interval = setInterval(() => {
      setFadeState('fade-out');
      
      setTimeout(() => {
        setMsgIndex((prev) => {
          const next = (prev + 1) % messages.length;
          setCurrentMsg(messages[next]);
          return next;
        });
        setFadeState('fade-in');
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, [message]);

  // Fluctuating Speedometer & Coordinates Simulation
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      // Simulate real truck deceleration/acceleration
      setSpeed((prev) => {
        const change = Math.floor(Math.random() * 9) - 4; // -4 to +4
        const newSpeed = prev + change;
        return Math.max(45, Math.min(78, newSpeed));
      });

      // Shift coordinates slightly to show a moving route
      setLatitude((prev) => prev + (Math.random() * 0.0006 - 0.0003));
      setLongitude((prev) => prev + (Math.random() * 0.0006 - 0.0003));
    }, 1200);

    return () => clearInterval(telemetryInterval);
  }, []);

  // Progress bar logic
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          return 5; // Reset back to a low number to loop smoothly
        }
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(98, prev + step);
      });
    }, 900);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className={`truck-loader-container ${overlay ? 'loader-overlay' : ''}`}>
      <div className="truck-wrapper">
        {/* Exhaust Smoke */}
        <div className="exhaust-smoke">
          <div className="smoke-bubble s1"></div>
          <div className="smoke-bubble s2"></div>
          <div className="smoke-bubble s3"></div>
        </div>

        <div className="truck-body">
          <div className="truck-cabin">
            <div className="truck-window"></div>
            <div className="truck-headlight"></div>
          </div>
          <div className="truck-container">
            <div className="truck-logo">📦</div>
          </div>
          <div className="truck-wheel wheel-1">
            <div className="wheel-spoke"></div>
          </div>
          <div className="truck-wheel wheel-2">
            <div className="wheel-spoke"></div>
          </div>
        </div>

        <div className="truck-shadow"></div>

        <div className="truck-road">
          <div className="road-line"></div>
          <div className="road-line"></div>
          <div className="road-line"></div>
          <div className="road-line"></div>
          <div className="road-line"></div>
        </div>
      </div>

      {/* Advanced, Attractive Telemetry HUD */}
      <div className="truck-hud-panel">
        <div className="hud-header">
          <span className="hud-badge">IN TRANSIT</span>
          <span className="hud-speed">⚡ {speed} km/h</span>
        </div>

        <div className={`truck-loader-text ${fadeState}`}>
          {currentMsg}
        </div>

        <div className="hud-progress-container">
          <div className="hud-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="hud-footer">
          <span className="hud-coordinates">
            GPS: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
          </span>
          <span className="hud-percentage">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default TruckLoader;
