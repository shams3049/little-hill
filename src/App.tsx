import { useState } from "react";
import { motion } from "framer-motion";

/* === Default Sectors from Provided Image === */
const DEFAULT_SECTORS = [
  { name: "Bewegung", icon: "🏃" },
  { name: "Ernährung & Genuss", icon: "🍽️" },
  { name: "Stress & Erholung", icon: "🛀" },
  { name: "Geist & Emotion", icon: "🧠" },
  { name: "Lebenssinn & -qualität", icon: "💡" },
  { name: "Umwelt & Soziales", icon: "🌿" },
];

type Sector = {
  name: string;
  icon: string;
};

type CartesianPoint = {
  x: number;
  y: number;
};

export default function EditableRadarPage() {
  const [title, setTitle] = useState("Editable Radar");
  const [sectors, setSectors] = useState<Sector[]>(DEFAULT_SECTORS);
  const [strengths, setStrengths] = useState(Array(sectors.length).fill(5));

  const handleSectorChange = (index: number, field: keyof Sector, value: string) => {
    const updated: Sector[] = sectors.map((sector, i) => {
      if (i === index) {
        return { ...sector, [field]: value };
      }
      return sector;
    });
    setSectors(updated);
  };

  const handleIconUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => handleSectorChange(index, "icon", reader.result as string);
    if(file){ reader.readAsDataURL(file)};
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8 space-y-6 box-border">
      {/* Editable Title */}
      <input
        className="text-2xl font-semibold text-center border rounded p-2 w-64"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Radar */}
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-xl border">
        <Radar sectors={sectors} strengths={strengths} />

        {/* Editable Sectors with Image Upload */}
        <div className="space-y-4 mt-6">
          {sectors.map((sector, i) => (
            <div key={i} className="flex flex-col space-y-1 p-2 border rounded bg-gray-50">
              <input
                type="text"
                value={sector.name}
                onChange={(e) => handleSectorChange(i, "name", e.target.value)}
                placeholder="Sector Name"
                className="border rounded p-1"
              />

              {/* Icon/Image Upload */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files? handleIconUpload(i, e.target.files[0]): null}
                className="border p-1"
              />

              {/* Strength Slider */}
              <input
                type="range"
                min="0"
                max="9"
                value={strengths[i]}
                onChange={(e) => {
                  const newStrengths = [...strengths];
                  newStrengths[i] = Number(e.target.value);
                  setStrengths(newStrengths);
                }}
              />

              <div className="text-center text-sm">
                {Math.round((strengths[i] / 9) * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* === Radar Component and Arc Utilities === */
function Radar({ sectors, strengths }: { sectors: Sector[]; strengths: number[] }) {
  const totalAnglePerSector = 360 / sectors.length;
  const baseVisualGap = 6;
  const minPerimeterGap = 8;

  const getGradientColor = (barIndex: number) => {
    const colors = ["#FF0000", "#FF4000", "#FF8000", "#FFBF00", "#BFFF00", "#80FF00", "#40FF00", "#20C000", "#006400"];
    const index = Math.min(barIndex, colors.length -1)
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
                  <motion.path
                    
                    key={barIndex}
                    d={describeArc(100, 100, r, startAngle, endAngle)}
                    stroke={active ? sectorColor : "#E0E0E0"}
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                );
              })}
              <image href={sector.icon} x={iconPos.x-6} y={iconPos.y-6} width={12} height={12} />
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
