import { useState, useEffect } from 'react';

export function SplineBackground() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Radial gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 60% at 50% 50%, rgba(0,245,212,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 40% 45% at 80% 10%, rgba(192,132,252,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 35% 40% at 10% 90%, rgba(0,245,212,0.05) 0%, transparent 60%),
            #07080a
          `
        }}
      />
      {/* 3D Spline scene */}
      <div
        className="spline-scene"
        style={{
          opacity: loaded ? 0.85 : 0,
          transition: 'opacity 1.5s ease-in-out',
        }}
      >
        <iframe
          src="https://my.spline.design/radialglass-FCxdUgnCPmlILSXsuajGGPf0/"
          title="3D Scene"
          onLoad={() => setLoaded(true)}
          allow="autoplay"
        />
      </div>
      {/* Overlay effects */}
      <div className="spline-vignette" />
      <div className="spline-edge-top" />
      <div className="spline-edge-bottom" />
      <div className="spline-grain" />
    </div>
  );
}
