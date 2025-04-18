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

// --- DESIGN & LAYOUT VARIABLES (Adjust here for easy tuning) ---
const DESIGN = {
  // Sizing factors
  containerDefault: 300, // default container size (px)
  marginIncreaseFactor: 0.01, // extra margin around radar chart
  basePaddingFactor: 0.1, // padding as % of container
  iconMarginFactor: 0.27, // icon distance from radar
  // Icon & label sizes
  iconBoxWidthMin: 34,
  iconBoxHeightMin: 18,
  iconBoxWidthFactor: 0.18, // as % of radarBoxSize
  iconBoxHeightFactor: 0.13, // as % of radarBoxSize
  iconSizeMin: 24,
  iconSizeFactor: 0.07, // as % of radarBoxSize
  // Radar chart
  centerCircleRadius: 28, // base radius (scaled)
  barThickness: 9, // base thickness (scaled)
  barGap: 1, // gap between bars (scaled)
  barStartGap: 0, // gap after center (scaled)
  maxStrength: 9, // number of bars per sector
  // Colors
  barColors: [
    "#FF0000", "#FF4000", "#FF8000", "#FFBF00", "#BFFF00", "#80FF00", "#40FF00", "#20C000", "#006400",
  ],
  barInactive: "#E0E0E0",
  centerCircle: "#B0B0B0",
  // Gaps
  baseVisualGap: 8,
  minPerimeterGap: 10,
};

const App = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [strengths, setStrengths] = useState<number[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(DESIGN.containerDefault);
  const [loading, setLoading] = useState(false);

  // Helper to fetch sheet data and update state
  const fetchSheetData = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSd_OtpNKFWcpfgy2ac7GYehjQHf8MveVOSLKTU6G9hLbWR3BpGwA7yC8TiT7epRE9xIOhkha1H2Y6U/pub?gid=0&single=true&output=csv");
      const csvText = await res.text();
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
        SECTION_KEYS.map(key => valuesBySection[key] ?? 2)
      );
    } catch (e) {
      // fallback to default if error
      setSectors(
        SECTION_KEYS.map(key => ({
          name: SECTION_LABELS[key],
          icon: SECTION_ICONS[key],
        }))
      );
      setStrengths(SECTION_KEYS.map(() => 2));
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize(Math.min(rect.width, rect.height));
      }
    }
    updateSize(); // size fixed after initial render; no resize listener
  }, []);

  useEffect(() => {
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

  // Layout calculations based on DESIGN variables
  const totalAnglePerSector = 360 / sectors.length;
  const basePadding = containerSize * DESIGN.basePaddingFactor;
  const chartSize = containerSize - 2 * basePadding;
  const radarBoxSize = containerSize + containerSize * DESIGN.marginIncreaseFactor;
  const radarCenter = radarBoxSize / 2;
  const radarPadding = basePadding;

  return (
    <Box sx={{
      width: '100vw', height: '100vh', bgcolor: 'white', m: 0, p: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <Box ref={containerRef} sx={{
        width: radarBoxSize,
        height: radarBoxSize,
        position: "relative",
        background: "#fff",
        borderRadius: 4,
      }}>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Radar
            sectors={sectors}
            strengths={strengths}
            size={chartSize}
            padding={radarPadding}
            onInnerCircleClick={fetchSheetData}
            loading={loading}
          />
        </Box>
        {sectors.map((sector, sectorIndex) => {
          const baseAngle = -90 + sectorIndex * totalAnglePerSector;
          const labelAngle = baseAngle + totalAnglePerSector / 2;
          const scale = (radarBoxSize - 2 * radarPadding) / DESIGN.containerDefault;
          const centerCircleRadius = DESIGN.centerCircleRadius * scale;
          const barThickness = DESIGN.barThickness * scale;
          const barStartRadius = centerCircleRadius + barThickness + DESIGN.barStartGap * scale;
          const maxBarRadius = barStartRadius + (DESIGN.maxStrength - 1) * (barThickness + DESIGN.barGap * scale);
          const iconBoxWidth = Math.max(DESIGN.iconBoxWidthMin, radarBoxSize * DESIGN.iconBoxWidthFactor);
          const iconBoxHeight = Math.max(DESIGN.iconBoxHeightMin, radarBoxSize * DESIGN.iconBoxHeightFactor);
          const iconSize = Math.max(DESIGN.iconSizeMin, radarBoxSize * DESIGN.iconSizeFactor);
          const margin = radarBoxSize * DESIGN.iconMarginFactor;
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
              bgcolor: 'white', boxShadow: 'none', zIndex: 10,
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
                    max={DESIGN.maxStrength}
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
                  <Typography variant="caption" align="center" sx={{ fontSize: Math.max(10, radarBoxSize * 0.025), fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                    {sector.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: Math.max(10, radarBoxSize * 0.025) }}>
                    {Math.round((strengths[sectorIndex] / DESIGN.maxStrength) * 100)}%
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

function Radar({ sectors, strengths, size, padding, onInnerCircleClick, loading }: { sectors: Sector[]; strengths: number[]; size: number; padding: number; onInnerCircleClick: () => void; loading: boolean }) {
  const totalAnglePerSector = 360 / sectors.length;
  const barThickness = DESIGN.barThickness * (size / DESIGN.containerDefault);
  const centerCircleRadius = DESIGN.centerCircleRadius * (size / DESIGN.containerDefault);
  const barStartRadius = centerCircleRadius + barThickness + DESIGN.barStartGap * (size / DESIGN.containerDefault);
  const maxBarRadius = barStartRadius + (DESIGN.maxStrength - 1) * (barThickness + DESIGN.barGap * (size / DESIGN.containerDefault));
  const getGradientColor = (barIndex: number) => DESIGN.barColors[Math.min(barIndex, DESIGN.barColors.length - 1)];
  const maxStrength = DESIGN.maxStrength;
  const avg = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  const avgPercent = Math.round((avg / maxStrength) * 100);
  const avgColor = `rgb(${255 - Math.round(2.55 * avgPercent)},${Math.round(2.55 * avgPercent)},0)`;
  return (
    <div style={{ width: '100%', height: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
      <svg viewBox={`0 0 ${200 + (padding * 2) / (size / DESIGN.containerDefault)} ${200 + (padding * 2) / (size / DESIGN.containerDefault)}`}
        style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform={`translate(${padding / (size / DESIGN.containerDefault)},${padding / (size / DESIGN.containerDefault)})`}>
          <circle cx="100" cy="100" r={centerCircleRadius} fill={DESIGN.centerCircle} onClick={onInnerCircleClick} style={{ cursor: 'pointer' }} />
          <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill={avgColor}>
            {loading ? "..." : `${avgPercent}%`}
          </text>
          {sectors.map((sector, sectorIndex) => {
            const strength = strengths[sectorIndex] || 0;
            const outerBarIndex = Math.max(strength - 1, 0);
            const baseAngle = -90 + sectorIndex * totalAnglePerSector;
            const sectorColor = getGradientColor(outerBarIndex);
            return (
              <g key={sectorIndex}>
                {Array.from({ length: DESIGN.maxStrength }, (_, barIndex) => {
                  const r = barStartRadius + barIndex * (barThickness + DESIGN.barGap * (size / DESIGN.containerDefault));
                  const perimeterGap = (360 * DESIGN.minPerimeterGap) / (2 * Math.PI * r);
                  const effectiveGap = Math.max(DESIGN.baseVisualGap, perimeterGap);
                  const sectorAngle = totalAnglePerSector - effectiveGap;
                  const startAngle = baseAngle + effectiveGap / 2;
                  const endAngle = startAngle + sectorAngle;
                  const active = barIndex + 1 <= strength;
                  return (
                    <path
                      key={barIndex}
                      d={describeArc(100, 100, r, startAngle, endAngle)}
                      stroke={active ? sectorColor : DESIGN.barInactive}
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
