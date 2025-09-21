import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import 'http://localhost:3000/tracking.js';

declare global {
  interface Window {
    tracking?: {
      show: (name: string) => void;
      click: (name: string) => void;
    };
  }
}

const TrackedPage = () => {
  const [showBanner, setShowBanner] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showBanner || !bannerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (window.tracking) {
            window.tracking.show('ad');
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1 }, // Trigger when 10% of the banner is visible
    );

    observer.observe(bannerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [showBanner]);

  const handleBannerClick = () => {
    if (window.tracking) {
      window.tracking.click('ad');
    }
    alert('点击了广告');
  };

  const handleCloseBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.tracking) {
      window.tracking.click('close-ad');
    }
    setShowBanner(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>埋点页面</h1>
      <p>这是一个很长的页面，滚动到底部可以看到广告。</p>
      {Array.from({ length: 50 }).map((_, i) => (
        <p key={i}>这是页面内容的一部分... {i + 1}</p>
      ))}
      {showBanner && (
        <div
          ref={bannerRef}
          onClick={handleBannerClick}
          style={{
            width: '100%',
            height: '100px',
            backgroundColor: 'lightgreen',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <h2>这是一个横幅广告</h2>
          <button
            onClick={handleCloseBanner}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackedPage;
