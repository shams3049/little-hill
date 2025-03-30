import { useState } from "react";

/* === Default Sectors from Provided Image === */
const DEFAULT_SECTORS = [
  { name: "Bewegung", icon: "bewegung.svg" },
  { name: "Ernährung & Genuss", icon: "ernaehrung-genuss.svg" },
  { name: "Stress & Erholung", icon: "stress-erholung.svg" },
  { name: "Geist & Emotion", icon: "geist-emotion.svg" },
  { name: "Lebenssinn & -qualität", icon: "lebenssinn-qualitaet.svg" },
  { name: "Umwelt & Soziales", icon: "umwelt-soziales.svg" },
];

type Sector = {
  name: string;
  icon: string;
};

type CartesianPoint = {
  x: number;
  y: number;
};

// New helper function to determine icon path from assets folder
function getIconPath(sector: Sector) {
  // if a file was uploaded, sector.icon starts with "data:"
  return sector.icon.startsWith("data:") ? sector.icon : `/assets/${sector.icon}`;
}

const App = () => {
  // Single radar state
  const [title, setTitle] = useState("Wellness Radar");
  const [sectors, setSectors] = useState<Sector[]>(DEFAULT_SECTORS);
  const [strengths, setStrengths] = useState(Array(DEFAULT_SECTORS.length).fill(5));
  const [previewStrengths, setPreviewStrengths] = useState(strengths);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

  // Single radar helper functions
  const handleSectorChange = (index: number, field: keyof Sector, value: string) => {
    const updated = sectors.map((sector, i) =>
      i === index ? { ...sector, [field]: value } : sector
    );
    setSectors(updated);
  };

  const handleIconUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => handleSectorChange(index, "icon", reader.result as string);
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-full mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl border">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <Radar sectors={sectors} strengths={strengths} />
          <button
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Controls
          </button>
          {isControlsExpanded && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <input
                className="text-xl font-semibold text-center border rounded p-2 w-full mb-4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="space-y-4">
                {sectors.map((sector, i) => (
                  <div key={i} className="flex flex-col space-y-1 p-2 border rounded">
                    <input
                      type="text"
                      value={sector.name}
                      onChange={(e) => handleSectorChange(i, "name", e.target.value)}
                      placeholder="Sector Name"
                      className="border rounded p-1"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files ? handleIconUpload(i, e.target.files[0]) : null
                      }
                      className="border p-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="9"
                      value={previewStrengths[i]}
                      onChange={(e) => {
                        const newStrengths = [...previewStrengths];
                        newStrengths[i] = Number(e.target.value);
                        setPreviewStrengths(newStrengths);
                        setTimeout(() => setStrengths(newStrengths), 100);
                      }}
                      className="w-full"
                    />
                    <div className="text-center text-sm">
                      {Math.round((previewStrengths[i] / 9) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

/* === Radar Component and Arc Utilities === */
function Radar({ sectors, strengths }: { sectors: Sector[]; strengths: number[] }) {
  const totalAnglePerSector = 360 / sectors.length;
  const baseVisualGap = 6;
  const minPerimeterGap = 8;

  const getGradientColor = (barIndex: number) => {
    const colors = [
      "#FF0000",
      "#FF4000",
      "#FF8000",
      "#FFBF00",
      "#BFFF00",
      "#80FF00",
      "#40FF00",
      "#20C000",
      "#006400",
    ];
    const index = Math.min(barIndex, colors.length - 1);
    return colors[index];
  };

  return (
    <div className="w-full aspect-square relative">
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        <circle cx="100" cy="100" r="6" fill="#B0B0B0" />
        {sectors.map((sector, sectorIndex) => {
          const strength = strengths[sectorIndex] || 0;
          const outerBarIndex = Math.max(strength - 1, 0);
          const baseAngle = -90 + sectorIndex * totalAnglePerSector;
          const labelAngle = baseAngle + totalAnglePerSector / 2;
          const iconPos: CartesianPoint = polarToCartesian(100, 100, 90, labelAngle);
          const textPos: CartesianPoint = polarToCartesian(100, 100, 102, labelAngle);
          const sectorColor = getGradientColor(outerBarIndex);

          return (
            <g key={sectorIndex}>
              {Array.from({ length: 9 }, (_, barIndex) => {
                const r = 14 + barIndex * 8;
                const perimeterGap = (360 * minPerimeterGap) / (2 * Math.PI * r);
                const effectiveGap = Math.max(baseVisualGap, perimeterGap);
                const sectorAngle = totalAnglePerSector - effectiveGap;
                const startAngle = baseAngle + effectiveGap / 2;
                const endAngle = startAngle + sectorAngle;
                const active = barIndex + 1 <= strength;
                return (
                  <path
                    key={barIndex}
                    d={describeArc(100, 100, r, startAngle, endAngle)}
                    stroke={active ? sectorColor : "#E0E0E0"}
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })}
              <image 
                href={getIconPath(sector)} 
                x={iconPos.x - 6} 
                y={iconPos.y - 6} 
                width={12} 
                height={12}
              >
                <title>{sector.icon}</title>
              </image>
              <text x={textPos.x} y={textPos.y - 4} textAnchor="middle" fontSize="6">
                {sector.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start: CartesianPoint = polarToCartesian(cx, cy, r, endAngle);
  const end: CartesianPoint = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number): CartesianPoint {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}
