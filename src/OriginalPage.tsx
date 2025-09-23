
import React, {
  useState,
} from "react";

const OriginalPage = () => {
  const [showBanner, setShowBanner] = useState(true);

  const handleBannerClick = () => {
    alert("点击了广告");
  };

  const handleCloseBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
  };

  return (
    <div style={{
      padding: "20px",
    }}
    >
      <h1>原始页面</h1>
      <p>这是一个很长的页面，滚动到底部可以看到广告。</p>
      {Array.from({
        length: 50,
      }).map((_, i) => (
        <p key={i}>这是页面内容的一部分... {i + 1}</p>
      ))}
      {showBanner && (
        <div
          onClick={handleBannerClick}
          style={{
            width: "100%",
            height: "100px",
            backgroundColor: "lightblue",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <h2>这是一个横幅广告</h2>
          <button
            onClick={handleCloseBanner}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              cursor: "pointer",
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};

export default OriginalPage;
