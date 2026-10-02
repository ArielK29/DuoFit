import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { theme } from '@styles/theme';

const LEFT_PAD = 52; // room for the goal label
const RIGHT_PAD = 40; // room for the value axis
const TOP_PAD = 12;
const LABELS_HEIGHT = 26;
const MAX_BAR_WIDTH = 18;
const MIN_BAR_HEIGHT = 5;

export interface Bar {
  value: number;
  color: string;
  label?: string;
}

interface BarChartProps {
  bars: Bar[]; // oldest first; drawn right-to-left like the rest of the RTL UI
  max: number;
  ticks: number[];
  formatTick: (value: number) => string;
  goal?: number;
  goalLabel?: string;
  goalColor?: string;
  height?: number;
  labelEvery?: number;
  accessibilityLabel?: string;
}

// Custom bar chart drawn with SVG. Every coordinate is physical (SVG is not
// mirrored by RTL), oldest bar on the right and newest on the left.
export const BarChart: React.FC<BarChartProps> = ({
  bars,
  max,
  ticks,
  formatTick,
  goal,
  goalLabel,
  goalColor = theme.colors.magenta,
  height = 200,
  labelEvery = 1,
  accessibilityLabel,
}) => {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const plotLeft = LEFT_PAD;
  const plotRight = width - RIGHT_PAD;
  const plotBottom = height - LABELS_HEIGHT;
  const plotHeight = plotBottom - TOP_PAD;
  const step = bars.length > 0 ? (plotRight - plotLeft) / bars.length : 0;
  const barWidth = Math.min(MAX_BAR_WIDTH, step * 0.5);
  const yFor = (value: number) => plotBottom - (Math.min(value, max) / max) * plotHeight;

  return (
    <View
      onLayout={onLayout}
      style={{ height }}
      accessible={accessibilityLabel !== undefined}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
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
                {formatTick(tick)}
              </SvgText>
            </React.Fragment>
          ))}

          {bars.map((bar, index) => {
            const centerX = plotRight - (index + 0.5) * step;
            const top = Math.min(yFor(bar.value), plotBottom - MIN_BAR_HEIGHT);
            const showLabel = bar.label !== undefined && (bars.length - 1 - index) % labelEvery === 0;
            return (
              <React.Fragment key={index}>
                <Rect
                  x={centerX - barWidth / 2}
                  y={top}
                  width={barWidth}
                  height={plotBottom - top}
                  rx={barWidth / 2}
                  fill={bar.color}
                />
                {showLabel && (
                  <SvgText
                    x={centerX}
                    y={plotBottom + 18}
                    fontSize={11}
                    fill={theme.colors.textTertiary}
                    textAnchor="middle"
                  >
                    {bar.label}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}

          {goal !== undefined && (
            <>
              <Line
                x1={plotLeft}
                x2={plotRight}
                y1={yFor(goal)}
                y2={yFor(goal)}
                stroke={goalColor}
                strokeWidth={2}
                strokeDasharray="7 6"
              />
              {goalLabel && (
                <SvgText
                  x={LEFT_PAD / 2}
                  y={yFor(goal) - 6}
                  fontSize={12}
                  fontWeight="bold"
                  fill={goalColor}
                  textAnchor="middle"
                >
                  {goalLabel}
                </SvgText>
              )}
            </>
          )}
        </Svg>
      )}
    </View>
  );
};
