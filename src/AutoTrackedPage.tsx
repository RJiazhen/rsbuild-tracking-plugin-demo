import React, {
  useState,
} from "react";

const AutoTrackedPage = () => {
  const [showBanner, setShowBanner] = useState(true);

  const handleBannerClick = () => {
    alert("点击了广告"); // 故意使用单引号
  };

  const handleCloseBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
  }; // 添加一个格式问题：缺少分号

  return (
    <div
      style={{
        padding: "20px",
      }}
    >
      <h1>自动埋点页面</h1>
      <p>这是一个很长的页面，滚动到底部可以看到广告。</p>
      {Array.from({
        length: 50,
      }).map((_, i) => (
        <p key={i}>这是页面内容的一部分... {i + 1}</p>
      ))}
      {showBanner && (
        <div
          onClick={handleBannerClick}
          data-track-show="ad"
          data-track-click="ad"
          style={{
            width: "100%",
            height: "100px",
            backgroundColor: "lightcoral",
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
            data-track-click="close-ad"
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

export default AutoTrackedPage;
