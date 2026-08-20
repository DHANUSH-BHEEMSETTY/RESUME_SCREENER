import React, { useState, useEffect } from 'react';

export const SplineBackground: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className={`scene absolute inset-0 transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        <iframe
          src="https://my.spline.design/radialglass-FCxdUgnCPmlILSXsuajGGPf0/"
          title="radial 3D scene"
          loading="eager"
          allow="autoplay; fullscreen"
          className="block w-full h-full border-0 transform scale-75 origin-center spline-mask"
          onLoad={() => setIsReady(true)}
        ></iframe>
      </div>
      <div className="fx absolute inset-0 pointer-events-none fx-mask">
        <div className="ringfield absolute inset-[-12%]"></div>
        <div className="sheen absolute left-1/2 top-1/2 w-[160vmax] h-[160vmax] -ml-[80vmax] -mt-[80vmax] opacity-55 animate-sheenspin"></div>
        <div className="sheen2 absolute left-1/2 top-1/2 w-[160vmax] h-[160vmax] -ml-[80vmax] -mt-[80vmax] opacity-30 animate-sheenspin-reverse"></div>
      </div>
      <div className="vignette absolute inset-0 pointer-events-none"></div>
      <div className="grain absolute inset-0 pointer-events-none opacity-[0.055]"></div>
    </>
  );
};
