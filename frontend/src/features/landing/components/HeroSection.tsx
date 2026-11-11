import React, { useRef } from "react";
import { Button } from "antd";
import { ArrowDownOutlined } from "@ant-design/icons";
import { motion, useScroll, useTransform } from "motion/react";

export const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Chỉ giữ lại hiệu ứng mờ dần và trượt lên cho khối chữ khi cuộn
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const scrollToFirstShelf = () => {
    const el = document.getElementById("shelf-track");
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div
      ref={heroRef}
      className="hero-fullscreen-section"
      style={{
        position: "relative",
        height: "calc(100vh - 64px)",
        minHeight: 620,
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", // Căn giữa nội dung theo chiều dọc
        boxSizing: "border-box",
        /* --- NỀN ẢNH THƯ VIỆN --- */
        // Thay url(...) bằng link ảnh hoặc đường dẫn ảnh thực tế của bạn
        backgroundImage: `
          linear-gradient(rgba(31, 58, 46, 0.65), rgba(20, 10, 4, 0.85)), 
          url("https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Khối Nội Dung Trung Tâm */}
      <motion.div
        className="hero-main-content"
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px",
          width: "100%",
          boxSizing: "border-box",
          y: titleY,
          opacity: titleOpacity,
        }}
      >
        {/* Tiêu đề chính */}
        <h1
          className="hero-title-massive"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.2rem, 7vw, 6.7rem)",
            fontWeight: 700,
            color: "#FBF7EC", // Đổi sang màu kem sáng để nổi bật trên nền tối
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: "0 0 36px",
            textShadow: "0 4px 12px rgba(0,0,0,0.3)", // Đổ bóng chữ nhẹ
          }}
        >
          DOMUS LIBRI
        </h1>

        {/* Đoạn giới thiệu */}
        <p
          style={{
            fontSize: "clamp(15px, 1.5vw, 18px)",
            color: "#EAE0C9", // Màu be nhạt
            lineHeight: 1.6,
            maxWidth: 680,
            margin: "0 auto 36px",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          Where Every Story Begins.
        </p>

        {/* Nút hành động */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            type="primary"
            size="large"
            icon={<ArrowDownOutlined />}
            onClick={scrollToFirstShelf}
            style={{
              background: "#B08D3C", // Đổi nút sang màu vàng đồng cho hợp với không gian sang trọng
              borderColor: "#9A7A32",
              color: "#1F1108",
              fontWeight: 700,
              height: 48,
              padding: "0 28px",
              fontSize: 16,
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
          >
            Đi dọc kệ sách
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
