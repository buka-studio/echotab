import { CSSProperties } from "react";

import "./PulseLogo.css";

function PulseLogo() {
  return (
    <div className="relative">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={
            {
              "--pulse-delay": `${i * 0.5 + 10}s`,
            } as CSSProperties
          }
          className="bg-primary z-1 logo-pulse absolute mx-1 h-4 w-4 rounded-full"
        />
      ))}
      <div className="bg-primary z-1 relative mx-1 h-4 w-4 rounded-full" />
    </div>
  );
}

export default PulseLogo;
