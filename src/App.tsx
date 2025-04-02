// === Imports and Dependencies ===
import { useState } from "react";

// === Default Sectors and Types ===
/* === Default Sectors from Provided Image === */
const DEFAULT_SECTORS = [
  { name: "Bewegung", icon: "korperundbewegung.svg" },
  { name: "Ernährung & Genuss", icon: "ErnahrungundGenuss.svg" },
  { name: "Stress & Erholung", icon: "StressundErholung .svg" },
  { name: "Geist & Emotion", icon: "GeistundEmotionen.svg" },
  { name: "Lebenssinn & -qualität", icon: "Lebenssinnundqualitat.svg" },
  { name: "Umwelt & Soziales", icon: "UmweltundSoziales.svg" },
];

type Sector = {
  name: string;
  icon: string;
};

type CartesianPoint = {
  x: number;
  y: number;
};

// === Helper Functions ===
function getIconPath(sector: Sector) {
  // Return data url if uploaded, otherwise use a static asset path.
  return sector.icon.startsWith("data:") ? sector.icon : `/assets/${sector.icon}`;
}

// === Main App Component ===
const App = () => {
  // --- State Declarations ---
  const [title, setTitle] = useState("Wellness Radar");
  const [sectors, setSectors] = useState<Sector[]>(DEFAULT_SECTORS);
  const [strengths, setStrengths] = useState(Array(DEFAULT_SECTORS.length).fill(5));
  const [previewStrengths, setPreviewStrengths] = useState(strengths);

  // --- Event Handlers ---
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

  // --- Render UI ---
  return (
    <div className="min-h-screen h-screen w-screen flex flex-col bg-gray-100 p-4 overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 max-w-7xl mx-auto w-full">
        {/* === Radar Display Section === */}
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg border-2 border-gray-300 w-full md:w-1/2 flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">{title}</h2>
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="w-full max-w-full max-h-[60vh] aspect-square">
              <Radar sectors={sectors} strengths={strengths} />
            </div>
          </div>
        </div>

        {/* === Editing Controls Section === */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-300 w-full md:w-1/2 max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-100 p-4 border-b">
            <h3 className="text-xl font-bold text-gray-800 text-center">Edit Radar</h3>
          </div>
          <div className="p-6">
            <input
              className="text-xl font-semibold text-center border rounded-lg p-3 w-full mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="space-y-6">
              {sectors.map((sector, i) => (
                <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg">
                  {/* --- Sector Name Input --- */}
                  <input
                    type="text"
                    value={sector.name}
                    onChange={(e) => handleSectorChange(i, "name", e.target.value)}
                    placeholder="Sector Name"
                    className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {/* --- Icon Upload Input --- */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files ? handleIconUpload(i, e.target.files[0]) : null
                    }
                    className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {/* --- Strength Range Input --- */}
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
                    className="w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="text-center text-sm text-gray-600">
                    {Math.round((previewStrengths[i] / 9) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

// === Radar Component and Supporting Utilities ===
function Radar({ sectors, strengths }: { sectors: Sector[]; strengths: number[] }) {
  const totalAnglePerSector = 360 / sectors.length;
  const baseVisualGap = 6;
  const minPerimeterGap = 8;

  // --- Gradient Color Helper ---
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
        {/* --- Center Marker --- */}
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
              {/* --- Sector Icon --- */}
              <image 
                href={getIconPath(sector)} 
                x={iconPos.x - 6} 
                y={iconPos.y - 6} 
                width={12} 
                height={12}
              >
                <title>{sector.icon}</title>
              </image>
              {/* --- Sector Name Label --- */}
              <text x={textPos.x} y={textPos.y - 4} textAnchor="middle" fontSize="6" fill="#333">
                {sector.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --- Arc Description and Polar Conversion Helpers ---
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
