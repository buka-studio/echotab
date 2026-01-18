import { CSSProperties } from "react";
import PCVisual from "./PCVisual";




export default function Page() {
  return <div className="text-center outlined-bottom pb-5 flex flex-col items-center justify-center gap-10" style={{
    "--screen": "var(--background-base)",
    "--edges": "color-mix(in srgb, var(--muted-foreground) 30%, transparent)",
    "--case": "var(--card)",
    "--splash": "var(--surface-2)",
    "--visual": "var(--foreground)",
  } as CSSProperties}>
    <PCVisual />
    <div>
      <h1 className="text-base">List not found.</h1>
      <p className="text-muted-foreground ">The list you are looking for does not exist.</p>
    </div>
  </div>;
}
