import { useEffect, useState } from "react";

let phaseNum = 0;
const phases = ["🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔"];

export const Moon = () => {
  const [moon, setMoon] = useState("🌕");
  useEffect(() => {
    const interval = setInterval(() => {
      phaseNum++;
      if (phaseNum >= phases.length) phaseNum = 0;
      setMoon(phases[phaseNum]);
    }, 150);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return <span>{moon}</span>;
};
