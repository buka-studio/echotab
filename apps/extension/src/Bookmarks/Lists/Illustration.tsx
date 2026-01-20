import { SVGProps } from "react";

import { randomInt } from "~/util";

export default function Illustration({ ...props }: SVGProps<SVGSVGElement>) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const dots = Array.from(svgRef.current.querySelectorAll(".animate-pulse"));

    for (const dot of dots) {
      (dot as HTMLElement).style.setProperty("--delay", `${randomInt(1, 3)}s`);
    }
  }, [svgRef.current]);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      width="192"
      height="120"
      fill="none"
      viewBox="0 0 192 120"
      {...props}>
      <circle
        cx="132.102"
        cy="60.472"
        r="49.292"
        fill="var(--background)"
        stroke="var(--foreground-muted)"
        transform="rotate(12.638 132.102 60.472)"
      />
      <path
        stroke="var(--foreground-muted)"
        d="M142.887 12.374c8.316 1.865 14.726 8.865 18.317 18.816 3.588 9.945 4.328 22.77 1.337 36.108-2.99 13.338-9.135 24.618-16.626 32.08-7.496 7.465-16.281 11.057-24.597 9.193-8.315-1.865-14.726-8.864-18.317-18.816-3.588-9.945-4.328-22.769-1.338-36.107s9.136-24.62 16.627-32.08c7.496-7.466 16.282-11.058 24.597-9.194Z"
      />
      <path
        stroke="var(--foreground-muted)"
        d="M142.887 12.374c1.445.325 2.697 1.817 3.623 4.576.915 2.726 1.456 6.53 1.596 11.155.279 9.245-1.045 21.661-4.046 35.049s-7.106 25.18-11.306 33.42c-2.102 4.124-4.215 7.332-6.206 9.406-2.016 2.1-3.785 2.915-5.23 2.591s-2.697-1.816-3.624-4.576c-.915-2.726-1.456-6.53-1.596-11.155-.279-9.245 1.045-21.66 4.047-35.048s7.106-25.18 11.305-33.421c2.102-4.124 4.215-7.332 6.207-9.406 2.016-2.1 3.785-2.915 5.23-2.59Z"
      />
      <path
        stroke="var(--foreground-muted)"
        d="M180.201 71.258c-1.865 8.315-8.865 14.725-18.816 18.316-9.945 3.588-22.77 4.328-36.108 1.338s-24.618-9.136-32.08-16.627C85.733 66.79 82.14 58.004 84.005 49.69s8.864-14.727 18.816-18.318c9.945-3.588 22.769-4.328 36.107-1.338s24.619 9.136 32.08 16.627c7.466 7.496 11.058 16.282 9.194 24.598Z"
      />
      <path
        stroke="var(--foreground-muted)"
        d="M180.2 71.258c-.324 1.444-1.816 2.696-4.575 3.622-2.727.916-6.53 1.457-11.156 1.596-9.245.28-21.661-1.044-35.049-4.046S104.24 65.324 96 61.124c-4.124-2.101-7.332-4.214-9.406-6.206-2.1-2.016-2.914-3.785-2.59-5.23.323-1.445 1.816-2.697 4.575-3.623 2.726-.916 6.53-1.457 11.156-1.596 9.244-.28 21.66 1.044 35.047 4.046 13.388 3.002 25.181 7.106 33.422 11.306 4.123 2.101 7.331 4.214 9.406 6.206 2.099 2.016 2.914 3.785 2.59 5.23Z"
      />

      <rect
        width="81.424"
        height="67.343"
        x="19.583"
        y="29.176"
        fill="var(--background)"
        stroke="var(--skeleton)"
        rx="5.5"
        transform="rotate(-13.518 19.583 29.176)"
      />
      <rect
        width="42.192"
        height="5.149"
        x="35.559"
        y="33.503"
        fill="var(--skeleton)"
        rx="2.574"
        transform="rotate(-13.518 35.559 33.503)"
      />
      <rect
        width="57.496"
        height="5.149"
        x="31.425"
        y="46.766"
        fill="var(--skeleton-muted)"
        rx="2.574"
        transform="rotate(-13.518 31.425 46.766)"
      />
      <rect
        width="49.467"
        height="5.149"
        x="34.365"
        y="58.329"
        fill="var(--skeleton-muted)"
        rx="2.574"
        transform="rotate(-13.518 34.365 58.329)"
      />
      <rect
        width="52.951"
        height="5.149"
        x="37.305"
        y="69.891"
        fill="var(--skeleton-muted)"
        rx="2.574"
        transform="rotate(-13.518 37.305 69.891)"
      />
      <rect
        width="62.804"
        height="5.149"
        x="40.245"
        y="81.454"
        fill="var(--skeleton-muted)"
        rx="2.574"
        transform="rotate(-13.518 40.245 81.454)"
      />
      <rect
        width="92.782"
        height="76.931"
        x="12.941"
        y="25.842"
        stroke="url(#a)"
        strokeDasharray="1 1"
        strokeWidth=".8"
        rx="9"
        transform="rotate(-13.518 12.94 25.842)"
      />
      <path
        stroke="url(#b)"
        strokeDasharray="1 1"
        strokeWidth=".8"
        d="m151.146-22.265-37.328 164.53"
      />
      <path
        fill="var(--foreground)"
        d="m139.101 54.221-3.951 4.21-1.67-5.528zM2.321 70.753l.489-.109c.182.811.892 1.579 2.295 2.248 1.393.664 3.376 1.183 5.912 1.546 5.064.726 12.205.81 20.922.275 17.426-1.071 41.057-4.612 66.756-10.375l.11.488.109.488C73.179 71.084 49.494 74.636 32 75.711c-8.742.537-15.962.457-21.125-.283-2.58-.37-4.676-.907-6.2-1.634-1.515-.722-2.56-1.678-2.841-2.931zm96.483-5.927-.11-.488c12.85-2.88 24.996-6.043 35.957-9.295l.142.48.143.479c-10.985 3.258-23.153 6.426-36.022 9.312zm45.056-12.1-.153-.475c13.917-4.464 25.381-8.986 33.199-13.083 3.913-2.05 6.887-3.981 8.797-5.729.956-.873 1.625-1.683 2.018-2.42.391-.734.495-1.367.372-1.919l.487-.11.488-.109c.191.85.004 1.73-.464 2.608-.466.874-1.224 1.772-2.226 2.688-2.004 1.833-5.065 3.81-9.007 5.876-7.892 4.136-19.417 8.678-33.358 13.15zm44.72-23.735-.487.11c-.158-.705-.712-1.375-1.78-1.98-1.066-.605-2.584-1.108-4.537-1.495-3.904-.775-9.426-1.068-16.248-.889l-.013-.5-.014-.5c6.85-.18 12.459.112 16.469.908 2.004.397 3.639.926 4.837 1.605 1.196.678 2.017 1.543 2.261 2.631zM25.941 54.58l.189.464c-7.72 3.14-13.813 6.162-17.856 8.888-2.023 1.365-3.507 2.638-4.425 3.793-.924 1.163-1.216 2.128-1.04 2.918l-.487.11-.488.109c-.274-1.22.228-2.495 1.232-3.759 1.01-1.27 2.588-2.61 4.65-4 4.126-2.783 10.293-5.836 18.037-8.986z"
      />

      <g>
        <rect
          className="animate-pulse"
          width="2.325"
          height="2.41"
          x="117.91"
          y="35.066"
          fill="var(--dot)"
          rx="1.162"
          transform="rotate(-13.518 117.91 35.066)"
        />
        <rect
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          width="3.868"
          height="4.009"
          x="116.973"
          y="34.468"
          fill="var(--dot)"
          rx="1.934"
          transform="rotate(-13.518 116.973 34.468)"
        />
        <rect
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          width="3.118"
          height="3.232"
          x="139.88"
          y="36.598"
          fill="var(--dot)"
          rx="1.559"
          transform="rotate(-13.518 139.88 36.598)"
        />
        <rect
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          width="3.118"
          height="3.232"
          x="162.012"
          y="56.308"
          fill="var(--dot)"
          rx="1.559"
          transform="rotate(-13.518 162.012 56.308)"
        />
        <rect
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          width="3.118"
          height="3.232"
          x="140.636"
          y="73.475"
          fill="var(--dot)"
          rx="1.559"
          transform="rotate(-13.518 140.636 73.475)"
        />
        <rect
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          width="3.118"
          height="3.232"
          x="104.518"
          y="88.79"
          fill="var(--dot)"
          rx="1.559"
          transform="rotate(-13.518 104.518 88.79)"
        />
        <rect
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          width="3.118"
          height="3.232"
          x="157.013"
          y="84.54"
          fill="var(--dot)"
          rx="1.559"
          transform="rotate(-13.518 157.013 84.54)"
        />
        <rect
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          width="3.118"
          height="3.232"
          x="117.429"
          y="19.364"
          fill="var(--dot)"
          rx="1.559"
          transform="rotate(-13.518 117.429 19.364)"
        />
        <path
          className="animate-pulse opacity-0 delay-(--delay,0s)"
          fill="var(--dot)"
          d="m122.215 35.418-.067-.28a2.942 2.942 0 0 0-5.719 1.375l.067.28a2.94 2.94 0 0 0 3.547 2.172l.234.972-.198.043a3.94 3.94 0 0 1-4.503-2.758l-.052-.195-.068-.28a3.94 3.94 0 0 1 2.911-4.754l.198-.042a3.94 3.94 0 0 1 4.555 2.953l.067.28.043.198a3.94 3.94 0 0 1-2.953 4.555l-.234-.972a2.94 2.94 0 0 0 2.172-3.547"
          opacity=".4"
        />
        <rect
          width="4.967"
          height="5.149"
          x="28.485"
          y="35.204"
          fill="var(--dot)"
          rx="2.484"
          transform="rotate(-13.518 28.485 35.204)"
        />
      </g>

      <defs>
        <linearGradient
          id="a"
          x1="-1.382"
          x2="84.003"
          y1="36.414"
          y2="81.349"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--foreground-muted)" />
          <stop offset=".859" stopColor="var(--foreground-muted)" />
          <stop offset="1" stopColor="var(--foreground)" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="b"
          x1="113.818"
          x2="151.146"
          y1="60"
          y2="60"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--foreground)" />
          <stop offset=".322" stopColor="var(--foreground-muted)" />
          <stop offset=".774" stopColor="var(--foreground-muted)" />
          <stop offset="1" stopColor="var(--foreground)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
