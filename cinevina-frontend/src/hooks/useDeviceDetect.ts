import { useState, useEffect } from 'react';

export const useDeviceDetect = () => {
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    // Detect Smart TV / Android TV / WebOS / Tizen / Set-top boxes
    const userAgent = navigator.userAgent.toLowerCase();
    const tvKeywords = [
      'tv', 'smart-tv', 'smarttv', 'android tv', 'androidtv', 
      'webos', 'tizen', 'roku', 'appletv', 'bravia', 'viera', 'netcast'
    ];
    
    // TVs and Android Boxes typically do not have touch screens
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    const isLandscape = window.innerWidth > window.innerHeight;
    const isLargeScreen = window.innerWidth >= 800; // CSS pixels, TVs are 960+ usually

    const isTvDetected = tvKeywords.some(keyword => userAgent.includes(keyword)) || 
                         userAgent.includes('large screen') || 
                         (userAgent.includes('android') && isLandscape && isLargeScreen) ||
                         (userAgent.includes('android') && !userAgent.includes('mobile') && !hasTouch) ||
                         (userAgent.includes('android') && !hasTouch); // Any Android without touch is definitely a TV/Box

    if (isTvDetected) {
      setIsTV(true);
      document.body.classList.add('is-tv');
    } else {
      setIsTV(false);
      document.body.classList.remove('is-tv');
    }

    // Cleanup
    return () => {
      document.body.classList.remove('is-tv');
    };
  }, []);

  return { isTV };
};
