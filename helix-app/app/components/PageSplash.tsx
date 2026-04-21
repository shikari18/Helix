'use client';

import { useEffect, useState } from 'react';

export default function PageSplash() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`page-splash ${fadeOut ? 'fade-out' : ''}`}>
      <div className="page-splash-spinner"></div>
    </div>
  );
}
