import React, { useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { theme } from '@styles/theme';

const LEFT_PAD = 52;
const RIGHT_PAD = 40;
const TOP_PAD = 16;
const LABELS_HEIGHT = 28;
const TOOLTIP_WIDTH = 132;
const TOOLTIP_HEIGHT = 52;

export interface LinePoint {
  time: number;
  value: number;
}

export interface AxisLabel {
  time: number;
  text: string;
}

interface LineChartProps {
  points: LinePoint[];
  startTime: number;
  endTime: number;
  minValue: number;
  maxValue: number;
  ticks: number[];
  goal?: number;
  goalLabel?: string;
  xLabels: AxisLabel[];
  formatValue: (value: number) => string;
  formatDate: (time: number) => string;
  height?: number;
}

// Smooth line via Catmull-Rom converted to cubic Béziers.
function smoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return '';
  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

// Trend chart drawn with SVG. Time runs right-to-left (newest on the left) and
// the tooltip follows the finger. Coordinates are physical — SVG isn't mirrored.
export const LineChart: React.FC<LineChartProps> = ({
  points,
  startTime,
  endTime,
  minValue,
  maxValue,
  ticks,
  goal,
  goalLabel,
  xLabels,
  formatValue,
  formatDate,
  height = 280,
}) => {
  const [width, setWidth] = useState(0);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const plotLeft = LEFT_PAD;
  const plotRight = width - RIGHT_PAD;
  const plotBottom = height - LABELS_HEIGHT;
  const plotHeight = plotBottom - TOP_PAD;
  const span = Math.max(1, endTime - startTime);

  const xFor = (time: number) => plotLeft + ((endTime - time) / span) * (plotRight - plotLeft);
  const yFor = (value: number) => plotBottom - ((value - minValue) / (maxValue - minValue)) * plotHeight;

  const coords = [...points].sort((a, b) => b.time - a.time).map((point) => ({ x: xFor(point.time), y: yFor(point.value) }));
  const linePath = smoothPath(coords);
  const areaPath =
    coords.length > 1 ? `${linePath} L ${coords[coords.length - 1].x} ${plotBottom} L ${coords[0].x} ${plotBottom} Z` : '';

  // Newest point is selected until the user touches the chart.
  const newest = points.reduce<LinePoint | null>((best, point) => (best === null || point.time > best.time ? point : best), null);
  const selected = points.find((point) => point.time === selectedTime) ?? newest;

  const selectFromTouch = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    let nearest = points[0];
    for (const point of points) {
      if (Math.abs(xFor(point.time) - x) < Math.abs(xFor(nearest.time) - x)) nearest = point;
    }
    if (nearest) setSelectedTime(nearest.time);
  };

  const selectedX = selected ? xFor(selected.time) : 0;
  const selectedY = selected ? yFor(selected.value) : 0;
  const tooltipX = Math.min(Math.max(selectedX - TOOLTIP_WIDTH / 2, 4), Math.max(4, width - TOOLTIP_WIDTH - 4));

  return (
    <View
      onLayout={onLayout}
      style={{ height }}
      onStartShouldSetResponder={() => points.length > 0}
      onMoveShouldSetResponder={() => points.length > 0}
      onResponderGrant={selectFromTouch}
      onResponderMove={selectFromTouch}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.text} stopOpacity={0.18} />
              <Stop offset="1" stopColor={theme.colors.text} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {ticks.map((tick) => (
            <React.Fragment key={tick}>
              <Line
                x1={plotLeft}
                x2={plotRight}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke={theme.colors.surfaceHover}
                strokeWidth={1}
              />
              <SvgText
                x={width - RIGHT_PAD / 2}
                y={yFor(tick) + 4}
                fontSize={12}
                fill={theme.colors.textTertiary}
                textAnchor="middle"
              >
                {String(tick)}
              </SvgText>
            </React.Fragment>
          ))}

          {areaPath !== '' && <Path d={areaPath} fill="url(#trendFill)" />}
          {coords.length > 1 && (
            <Path d={linePath} stroke={theme.colors.text} strokeWidth={3} fill="none" strokeLinecap="round" />
          )}

          {goal !== undefined && (
            <>
              <Line
                x1={plotLeft}
                x2={plotRight}
                y1={yFor(goal)}
                y2={yFor(goal)}
                stroke={theme.colors.cyan}
                strokeWidth={2}
                strokeDasharray="7 6"
              />
              {goalLabel && (
                <SvgText
                  x={LEFT_PAD / 2}
                  y={yFor(goal) - 6}
                  fontSize={12}
                  fontWeight="bold"
                  fill={theme.colors.cyan}
                  textAnchor="middle"
                >
                  {goalLabel}
                </SvgText>
              )}
            </>
          )}

          {xLabels.map((label) => (
            <SvgText
              key={label.time}
              x={xFor(label.time)}
              y={plotBottom + 20}
              fontSize={12}
              fill={theme.colors.textTertiary}
              textAnchor="middle"
            >
              {label.text}
            </SvgText>
          ))}

          {selected && (
            <G>
              <Line x1={selectedX} x2={selectedX} y1={TOP_PAD} y2={plotBottom} stroke={theme.colors.cyan} strokeWidth={2} />
              <Circle cx={selectedX} cy={selectedY} r={7} fill={theme.colors.bg} stroke={theme.colors.cyan} strokeWidth={3} />
              <Rect
                x={tooltipX}
                y={0}
                width={TOOLTIP_WIDTH}
                height={TOOLTIP_HEIGHT}
                rx={12}
                fill={theme.colors.surfaceHover}
                stroke={theme.colors.textTertiary}
                strokeWidth={1}
              />
              <SvgText
                x={tooltipX + TOOLTIP_WIDTH / 2}
                y={22}
                fontSize={17}
                fontWeight="bold"
                fill={theme.colors.text}
                textAnchor="middle"
              >
                {formatValue(selected.value)}
              </SvgText>
              <SvgText
                x={tooltipX + TOOLTIP_WIDTH / 2}
                y={41}
                fontSize={12}
                fill={theme.colors.textSecondary}
                textAnchor="middle"
              >
                {formatDate(selected.time)}
              </SvgText>
            </G>
          )}
        </Svg>
      )}
    </View>
  );
};
