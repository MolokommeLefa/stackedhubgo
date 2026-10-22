import { useEffect, useState } from "react";

type IosNavigator = Navigator & { standalone?: boolean };

function isStandalonePwa() {
  const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator && (navigator as IosNavigator).standalone === true;
  return displayModeStandalone || iosStandalone;
}

/** False during SSR and the first client render so the public homepage can hydrate. */
export function useStandalonePwa() {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () => setStandalone(isStandalonePwa());
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return standalone;
}
