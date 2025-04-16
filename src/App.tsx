import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Typography, Box, TextField, Slider } from "@mui/material";

const SECTION_KEYS = [
  "bewegung",
  "ernaehrung_genuss",
  "stress_erholung",
  "geist_emotion",
  "lebenssinn_qualitaet",
  "umwelt_soziales",
];

const SECTION_LABELS: Record<string, string> = {
  bewegung: "Bewegung",
  ernaehrung_genuss: "Ernährung & Genuss",
  stress_erholung: "Stress & Erholung",
  geist_emotion: "Geist & Emotion",
  lebenssinn_qualitaet: "Lebenssinn & -qualität",
  umwelt_soziales: "Umwelt & Soziales",
};

const SECTION_ICONS: Record<string, string> = {
  bewegung: "korperundbewegung.svg",
  ernaehrung_genuss: "ErnahrungundGenuss.svg",
  stress_erholung: "StressundErholung .svg",
  geist_emotion: "GeistundEmotionen.svg",
  lebenssinn_qualitaet: "Lebenssinnundqualitat.svg",
  umwelt_soziales: "UmweltundSoziales.svg",
};

type Sector = { name: string; icon: string };
type CartesianPoint = { x: number; y: number };

function getIconPath(sector: Sector) {
  return sector.icon.startsWith("data:") ? sector.icon : `/assets/${sector.icon}`;
}

const App = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [strengths, setStrengths] = useState<number[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(400);

  useLayoutEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize(Math.min(rect.width, rect.height));
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    async function fetchSheetData() {
      try {
        // Updated to fetch CSV from Google Sheets
        const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSd_OtpNKFWcpfgy2ac7GYehjQHf8MveVOSLKTU6G9hLbWR3BpGwA7yC8TiT7epRE9xIOhkha1H2Y6U/pub?gid=0&single=true&output=csv");
        const csvText = await res.text();
        // Parse CSV: expects headers 'section,value' and rows like 'bewegung,7'
        const lines = csvText.trim().split(/\r?\n/);
        const headers = lines[0].split(",").map(h => h.trim());
        const valuesBySection: Record<string, number> = {};
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",");
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => rowObj[h] = row[idx]);
          if (rowObj.section && rowObj.value !== undefined) {
            valuesBySection[rowObj.section] = Number(rowObj.value);
          }
        }
        setSectors(
          SECTION_KEYS.map(key => ({
            name: SECTION_LABELS[key],
            icon: SECTION_ICONS[key],
          }))
        );
        setStrengths(
          SECTION_KEYS.map(key => valuesBySection[key] ?? 0)
        );
      } catch (e) {
        // fallback to default if error
      }
    }
    fetchSheetData();
  }, []);

  const handleSectorChange = (index: number, field: keyof Sector, value: string) => {
    setSectors(sectors => sectors.map((sector, i) =>
      i === index ? { ...sector, [field]: value } : sector
    ));
  };

  const handleStrengthChange = (index: number, value: number) => {
    setStrengths(strengths => strengths.map((s, i) => (i === index ? value : s)));
  };

  const handleIconUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => handleSectorChange(index, "icon", reader.result as string);
    if (file) reader.readAsDataURL(file);
  };

  const totalAnglePerSector = 360 / sectors.length;
  const radarBoxSize = containerSize;
  const radarCenter = radarBoxSize / 2;
  const radarPadding = radarBoxSize * 0.06;

  return (
    <Box sx={{
      width: '100vw', height: '100vh', bgcolor: 'grey.100', m: 0, p: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <Box ref={containerRef} sx={{
        width: '90vw', height: '90vh', maxWidth: 700, maxHeight: 700, minWidth: 320, minHeight: 320,
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', borderRadius: 4,
      }}>
        <Radar sectors={sectors} strengths={strengths} size={radarBoxSize - 2 * radarPadding} padding={radarPadding} />
        {sectors.map((sector, sectorIndex) => {
          const baseAngle = -90 + sectorIndex * totalAnglePerSector;
          const labelAngle = baseAngle + totalAnglePerSector / 2;
          const scale = (radarBoxSize - 2 * radarPadding) / 400;
          const centerCircleRadius = 28 * scale;
          const barThickness = 8 * scale;
          const barStartRadius = centerCircleRadius + barThickness + 4 * scale;
          const maxBarRadius = barStartRadius + (9 - 1) * (barThickness + 2 * scale);
          const iconBoxWidth = Math.max(64, radarBoxSize * 0.18);
          const iconBoxHeight = Math.max(48, radarBoxSize * 0.13);
          const iconSize = Math.max(24, radarBoxSize * 0.07);
          const margin = radarBoxSize * 0.03;
          const iconRadius = maxBarRadius + (Math.max(iconBoxWidth, iconBoxHeight) / 2) + margin;
          const pos = polarToCartesian(radarCenter, radarCenter, iconRadius, labelAngle);
          const isEditing = editingIndex === sectorIndex;
          return (
            <Box key={sectorIndex} sx={{
              position: 'absolute',
              left: pos.x - iconBoxWidth / 2,
              top: pos.y - iconBoxHeight / 2,
              width: iconBoxWidth,
              minHeight: iconBoxHeight,
              maxWidth: 160,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              bgcolor: isEditing ? '#e3f2fd' : 'white', boxShadow: 3, zIndex: 10,
              borderRadius: 2, p: 1,
              cursor: isEditing ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }} onClick={() => !isEditing && setEditingIndex(sectorIndex)}>
              {isEditing ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id={`icon-upload-${sectorIndex}`}
                      type="file"
                      onChange={(e) => e.target.files ? handleIconUpload(sectorIndex, e.target.files[0]) : null}
                    />
                    <label htmlFor={`icon-upload-${sectorIndex}`}>
                      <img src={getIconPath(sector)} alt={sector.name} style={{ width: iconSize, height: iconSize, cursor: 'pointer' }} />
                    </label>
                    <TextField
                      value={sector.name}
                      onChange={e => handleSectorChange(sectorIndex, 'name', e.target.value)}
                      size="small"
                      variant="standard"
                      sx={{ ml: 1, width: iconBoxWidth - iconSize - 16 }}
                      inputProps={{ style: { fontSize: Math.max(10, radarBoxSize * 0.025), textAlign: 'center' } }}
                    />
                  </Box>
                  <Slider
                    min={0}
                    max={9}
                    value={strengths[sectorIndex]}
                    onChange={(_, value) => handleStrengthChange(sectorIndex, Number(value))}
                    valueLabelDisplay="auto"
                    sx={{ width: iconBoxWidth - 8, mt: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontSize: Math.max(10, radarBoxSize * 0.025) }} onClick={e => { e.stopPropagation(); setEditingIndex(null); }}>
                      Done
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <img src={getIconPath(sector)} alt={sector.name} style={{ width: iconSize, height: iconSize, marginBottom: 4 }} />
                  <Typography variant="caption" align="center" sx={{ fontSize: Math.max(10, radarBoxSize * 0.025), fontWeight: 500 }}>
                    {sector.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: Math.max(10, radarBoxSize * 0.025) }}>
                    {Math.round((strengths[sectorIndex] / 9) * 100)}%
                  </Typography>
                </>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default App;

function Radar({ sectors, strengths, size, padding }: { sectors: Sector[]; strengths: number[]; size: number; padding: number }) {
  const totalAnglePerSector = 360 / sectors.length;
  const baseVisualGap = 8;
  const minPerimeterGap = 10;
  const barThickness = 8 * (size / 400);
  const centerCircleRadius = 28 * (size / 400);
  const barStartRadius = centerCircleRadius + barThickness + 4 * (size / 400);
  const maxBarRadius = barStartRadius + (9 - 1) * (barThickness + 2 * (size / 400));
  const getGradientColor = (barIndex: number) => {
    const colors = [
      "#FF0000", "#FF4000", "#FF8000", "#FFBF00", "#BFFF00", "#80FF00", "#40FF00", "#20C000", "#006400",
    ];
    return colors[Math.min(barIndex, colors.length - 1)];
  };
  const maxStrength = 9;
  const avg = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  const avgPercent = Math.round((avg / maxStrength) * 100);
  const avgColor = `rgb(${255 - Math.round(2.55 * avgPercent)},${Math.round(2.55 * avgPercent)},0)`;
  return (
    <div style={{ width: '100%', height: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
      <svg viewBox={`0 0 ${200 + (padding * 2) / (size / 400)} ${200 + (padding * 2) / (size / 400)}`}
        style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform={`translate(${padding / (size / 400)},${padding / (size / 400)})`}>
          <circle cx="100" cy="100" r={centerCircleRadius} fill="#B0B0B0" />
          <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill={avgColor}>
            {avgPercent}%
          </text>
          {sectors.map((sector, sectorIndex) => {
            const strength = strengths[sectorIndex] || 0;
            const outerBarIndex = Math.max(strength - 1, 0);
            const baseAngle = -90 + sectorIndex * totalAnglePerSector;
            const sectorColor = getGradientColor(outerBarIndex);
            return (
              <g key={sectorIndex}>
                {Array.from({ length: 9 }, (_, barIndex) => {
                  const r = barStartRadius + barIndex * (barThickness + 2 * (size / 400));
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
                      strokeWidth={barThickness}
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
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
