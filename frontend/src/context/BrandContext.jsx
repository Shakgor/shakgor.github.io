import { createContext, useContext, useEffect, useState } from "react";

const BrandContext = createContext({});

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState({
    name: "GymBros",
    logo_url: "",
    primary_color: "#FF3B30",
    secondary_color: "#007AFF",
    background_color: "#0A0A0A",
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--gb-primary", brand.primary_color);
    root.style.setProperty("--gb-secondary", brand.secondary_color);
    root.style.setProperty("--gb-bg", brand.background_color);
  }, [brand]);

  return <BrandContext.Provider value={{ brand, setBrand }}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);
