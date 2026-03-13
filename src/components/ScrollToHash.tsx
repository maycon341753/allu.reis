import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      let tries = 0;
      const maxTries = 10;
      const interval = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          clearInterval(interval);
        }
        tries += 1;
        if (tries >= maxTries) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [location.hash]);
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname, location.search]);
  return null;
}
