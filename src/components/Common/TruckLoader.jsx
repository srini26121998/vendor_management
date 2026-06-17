import React from 'react';
import './TruckLoader.css';

const TruckLoader = ({ message = "Delivering Excellence...", overlay = false }) => {
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
      <div className="truck-loader-text">{message}</div>
    </div>
  );
};



export default TruckLoader;
