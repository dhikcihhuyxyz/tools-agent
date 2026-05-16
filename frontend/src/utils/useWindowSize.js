import { useState, useEffect } from "react";

function getWindowSize() {
  if (typeof window === "undefined") {
    return {
      width: 1024,
      height: 768,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export default function useWindowSize() {
  const [size, setSize] = useState(getWindowSize);

  useEffect(() => {
    const handler = () => setSize(getWindowSize());

    handler();

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    ...size,
    isMobile: size.width <= 768,
    isTablet: size.width > 768 && size.width <= 1024,
    isDesktop: size.width > 1024,
  };
}