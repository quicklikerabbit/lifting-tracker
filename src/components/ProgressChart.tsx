import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scaleTime } from '@visx/scale';
import { AreaStack, Line, LinePath } from '@visx/shape';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { useMemo, type PointerEvent } from 'react';
import { useLogs } from '../hooks/useLogs';
import {
  buildProgressSeries,
  dateForDay,
  type ProgressSeries,
} from '../utilities';

// Fixed categorical order, validated for colorblind separation between
// neighboring slots. Colors are assigned by rank and the stack is drawn in rank
// order, so touching bands are always neighboring slots.
const SERIES_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948',
];
const OTHERS_COLOR = '#94a3b8';
const OTHERS_KEY = '__others__';
const AREA_OPACITY = 0.6;

const TOTAL_COLOR = '#0f172a';
const GOAL_COLOR = '#64748b';
const GRID_COLOR = '#e2e8f0';
const AXIS_TEXT_COLOR = '#94a3b8';

// Projected year-end total, as a fraction of the goal, still counted "Close".
const CLOSE_THRESHOLD = 0.9;

const HEIGHT = 240;
const MARGIN = { top: 20, right: 16, bottom: 24, left: 40 };

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface Band {
  key: string;
  label: string;
  color: string;
  cumulative: number[];
}

type Row = { day: number } & Record<string, number>;

interface TooltipData {
  day: number;
}

type Status = 'onTrack' | 'close' | 'behind';

const STATUS_STYLES: Record<
  Status,
  { label: string; strip: string; pill: string; text: string; icon: string }
> = {
  onTrack: {
    label: 'On track',
    strip: 'bg-emerald-50',
    pill: 'bg-emerald-700',
    text: 'text-emerald-800',
    icon: '✓',
  },
  close: {
    label: 'Close',
    strip: 'bg-amber-50',
    pill: 'bg-amber-700',
    text: 'text-amber-900',
    icon: '~',
  },
  behind: {
    label: 'Behind',
    strip: 'bg-red-50',
    pill: 'bg-red-700',
    text: 'text-red-800',
    icon: '!',
  },
};

function firstName(name: string): string {
  return name.split(' ')[0];
}

// Contributors arrive largest first, which is also bottom-to-top stack order.
// Up to 8 people get their own color; past that, the smallest share "Others".
function toBands(series: ProgressSeries): Band[] {
  const { contributors } = series;
  const named =
    contributors.length > SERIES_COLORS.length
      ? contributors.slice(0, SERIES_COLORS.length - 1)
      : contributors;

  const firstNames = named.map((c) => firstName(c.userName));
  const bands: Band[] = named.map((c, i) => ({
    key: c.userId,
    // Fall back to the full name when two people share a first name.
    label:
      firstNames.indexOf(firstNames[i]) ===
      firstNames.lastIndexOf(firstNames[i])
        ? firstNames[i]
        : c.userName,
    color: SERIES_COLORS[i],
    cumulative: c.cumulative,
  }));

  const rest = contributors.slice(named.length);
  if (rest.length > 0) {
    bands.push({
      key: OTHERS_KEY,
      label: `${rest.length} others`,
      color: OTHERS_COLOR,
      cumulative: series.totals.map((_, i) =>
        rest.reduce((sum, c) => sum + c.cumulative[i], 0)
      ),
    });
  }
  return bands;
}

function formatDay(start: Date, day: number): string {
  return dateForDay(start, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function Chart({
  width,
  series,
  bands,
  goal,
  goalDay,
}: {
  width: number;
  series: ProgressSeries;
  bands: Band[];
  goal: number;
  // Day the projection reaches the goal, if it does so in the future by Dec 31.
  goalDay: number | null;
}) {
  const { start, todayIndex, yearEndIndex, totals, projectedYearEnd } = series;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const currentTotal = totals[todayIndex];

  const {
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
    showTooltip,
    hideTooltip,
  } = useTooltip<TooltipData>();
  // Portal the tooltip to <body>: ParentSize clips its children with
  // overflow: hidden, which would cut off a tooltip rendered inline.
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const rows = useMemo<Row[]>(
    () =>
      totals.map((_, day) => {
        const row: Row = { day } as Row;
        bands.forEach((b) => (row[b.key] = b.cumulative[day]));
        return row;
      }),
    [totals, bands]
  );

  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [start, dateForDay(start, yearEndIndex)],
        range: [0, innerWidth],
      }),
    [start, yearEndIndex, innerWidth]
  );
  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, Math.max(goal, projectedYearEnd, currentTotal) * 1.08],
        range: [innerHeight, 0],
      }),
    [goal, projectedYearEnd, currentTotal, innerHeight]
  );

  // Month ticks, with Dec 31 pinned to the right edge as the deadline. Drop
  // any month tick that would crowd it.
  const xTicks = useMemo(() => {
    const yearEnd = dateForDay(start, yearEndIndex);
    const months = xScale
      .ticks(Math.max(2, Math.floor(innerWidth / 60)))
      .filter((d) => xScale(yearEnd) - xScale(d) > 40);
    return [...months, yearEnd];
  }, [xScale, start, yearEndIndex, innerWidth]);

  function xOf(day: number) {
    return xScale(dateForDay(start, day));
  }

  function projectedAt(day: number) {
    return currentTotal + series.dailyRate * (day - todayIndex);
  }

  function onPointerMove(event: PointerEvent<SVGRectElement>) {
    const point = localPoint(event);
    if (!point) return;
    const date = xScale.invert(point.x - MARGIN.left);
    const day = Math.round((date.getTime() - start.getTime()) / 86400000);
    const clamped = Math.max(0, Math.min(yearEndIndex, day));
    const value =
      clamped <= todayIndex ? totals[clamped] : projectedAt(clamped);
    showTooltip({
      tooltipData: { day: clamped },
      tooltipLeft: xOf(clamped) + MARGIN.left,
      tooltipTop: yScale(value) + MARGIN.top,
    });
  }

  const hoverDay = tooltipData?.day;
  const hoverIsProjected = hoverDay !== undefined && hoverDay > todayIndex;
  const hoverValue =
    hoverDay === undefined
      ? 0
      : hoverIsProjected
        ? projectedAt(hoverDay)
        : totals[hoverDay];

  const goalY = yScale(goal);

  return (
    <div className="relative" ref={containerRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Team progress over time"
      >
        <Group left={MARGIN.left} top={MARGIN.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            numTicks={4}
            stroke={GRID_COLOR}
            strokeWidth={1}
          />

          <AreaStack<Row, string>
            keys={bands.map((b) => b.key)}
            data={rows}
            x={(d) => xOf(d.data.day)}
            y0={(d) => yScale(d[0])}
            y1={(d) => yScale(d[1])}
            curve={curveMonotoneX}
          >
            {({ stacks, path }) =>
              stacks.map((stack, i) => (
                <path
                  key={stack.key}
                  d={path(stack) || ''}
                  fill={bands[i].color}
                  fillOpacity={AREA_OPACITY}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              ))
            }
          </AreaStack>

          <Line
            from={{ x: 0, y: goalY }}
            to={{ x: innerWidth, y: goalY }}
            stroke={GOAL_COLOR}
            strokeWidth={1}
          />
          <text
            x={4}
            y={goalY - 5}
            fontSize={10}
            fontWeight={600}
            fill={GOAL_COLOR}
          >
            Goal {compact.format(goal)}
          </text>

          <LinePath
            data={[todayIndex, yearEndIndex]}
            x={(d) => xOf(d)}
            y={(d) => yScale(projectedAt(d))}
            stroke={TOTAL_COLOR}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
          {goalDay !== null ? (
            <>
              <circle
                cx={xOf(goalDay)}
                cy={goalY}
                r={4}
                fill={TOTAL_COLOR}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={xOf(goalDay)}
                y={goalY - 8}
                fontSize={10}
                fontWeight={600}
                fill={TOTAL_COLOR}
                textAnchor={xOf(goalDay) > innerWidth - 24 ? 'end' : 'middle'}
              >
                {formatDay(start, goalDay)}
              </text>
            </>
          ) : (
            <>
              <circle
                cx={xOf(yearEndIndex)}
                cy={yScale(projectedYearEnd)}
                r={4}
                fill={TOTAL_COLOR}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={xOf(yearEndIndex) - 8}
                y={yScale(projectedYearEnd) + 3}
                fontSize={10}
                fontWeight={600}
                fill={TOTAL_COLOR}
                textAnchor="end"
              >
                {compact.format(projectedYearEnd)}
              </text>
            </>
          )}

          <LinePath
            data={totals}
            x={(_, i) => xOf(i)}
            y={(d) => yScale(d)}
            stroke={TOTAL_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            curve={curveMonotoneX}
          />
          <circle
            cx={xOf(todayIndex)}
            cy={yScale(currentTotal)}
            r={4}
            fill={TOTAL_COLOR}
            stroke="#ffffff"
            strokeWidth={2}
          />

          <AxisLeft
            scale={yScale}
            numTicks={4}
            hideAxisLine
            hideTicks
            // The goal line already labels this value.
            tickFormat={(v) =>
              Number(v) === goal ? '' : compact.format(Number(v))
            }
            tickLabelProps={{
              fill: AXIS_TEXT_COLOR,
              fontSize: 10,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
            }}
          />
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickValues={xTicks}
            stroke={GRID_COLOR}
            hideTicks
            tickFormat={(v, i) =>
              i === xTicks.length - 1
                ? formatDay(start, yearEndIndex)
                : (v as Date).toLocaleDateString(undefined, { month: 'short' })
            }
            tickLabelProps={(_, i) => ({
              fill: AXIS_TEXT_COLOR,
              fontSize: 10,
              textAnchor: i === xTicks.length - 1 ? 'end' : 'middle',
            })}
          />

          {tooltipOpen && hoverDay !== undefined && (
            <g pointerEvents="none">
              <Line
                from={{ x: xOf(hoverDay), y: 0 }}
                to={{ x: xOf(hoverDay), y: innerHeight }}
                stroke="#94a3b8"
                strokeWidth={1}
              />
              <circle
                cx={xOf(hoverDay)}
                cy={yScale(hoverValue)}
                r={4}
                fill={TOTAL_COLOR}
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          )}

          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerDown={onPointerMove}
            onPointerLeave={hideTooltip}
          />
        </Group>
      </svg>

      {tooltipOpen && hoverDay !== undefined && (
        <TooltipInPortal
          left={tooltipLeft}
          top={tooltipTop}
          unstyled
          applyPositionStyle
          className="pointer-events-none bg-white border border-slate-200 shadow-md rounded-lg px-3 py-2 text-xs min-w-36"
        >
          <div className="text-slate-500 mb-1">
            {dateForDay(start, hoverDay).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-bold text-slate-900">
              {Math.round(hoverValue).toLocaleString()} lbs
            </span>
            <span className="text-slate-500">
              {hoverIsProjected ? 'Projected' : 'Total'}
            </span>
          </div>
          {!hoverIsProjected && (
            <ul className="mt-1 space-y-0.5">
              {bands.map((b) => (
                <li key={b.key} className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="font-medium text-slate-900">
                    {b.cumulative[hoverDay].toLocaleString()}
                  </span>
                  <span className="text-slate-500 truncate">{b.label}</span>
                </li>
              ))}
            </ul>
          )}
        </TooltipInPortal>
      )}
    </div>
  );
}

export default function ProgressChart({ goal }: { goal: number }) {
  const logs = useLogs();
  const series = useMemo(() => buildProgressSeries(logs), [logs]);
  const bands = useMemo(() => (series ? toBands(series) : []), [series]);

  if (!series) {
    return (
      <p className="text-slate-400 text-sm italic">No lifts recorded yet.</p>
    );
  }

  const {
    start,
    todayIndex,
    yearEndIndex,
    totals,
    dailyRate,
    projectedYearEnd,
  } = series;
  const currentTotal = totals[todayIndex];
  const reached = currentTotal >= goal;
  const status: Status =
    projectedYearEnd >= goal
      ? 'onTrack'
      : projectedYearEnd >= goal * CLOSE_THRESHOLD
        ? 'close'
        : 'behind';
  const styles = STATUS_STYLES[status];

  const goalDay =
    !reached && dailyRate > 0
      ? todayIndex + Math.ceil((goal - currentTotal) / dailyRate)
      : null;
  const goalDayInYear =
    goalDay !== null && goalDay <= yearEndIndex ? goalDay : null;

  const headline = reached
    ? `${compact.format(goal)} reached!`
    : goalDayInYear !== null
      ? `Hitting ${compact.format(goal)} around ${formatDay(start, goalDayInYear)}`
      : `Projected ${compact.format(projectedYearEnd)} by Dec 31`;

  const weeksLeft = Math.max(1, (yearEndIndex - todayIndex) / 7);
  const neededPerWeek = Math.max(0, (goal - currentTotal) / weeksLeft);

  return (
    <div className="space-y-3">
      <div
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${styles.strip}`}
      >
        <span
          className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${styles.pill}`}
        >
          <span aria-hidden="true">{styles.icon}</span>
          {styles.label}
        </span>
        <div className={`min-w-0 ${styles.text}`}>
          <div className="text-sm font-semibold">{headline}</div>
          <div className="text-xs opacity-80">
            Pace {compact.format(dailyRate * 7)}/wk
            {!reached && ` · need ${compact.format(neededPerWeek)}/wk`}
          </div>
        </div>
      </div>

      {/* visx 4 measures children in an absolutely positioned layer, so the
          wrapper needs an explicit height or it collapses to 0. */}
      <ParentSize debounceTime={50} style={{ height: HEIGHT }}>
        {({ width }) =>
          width > 0 ? (
            <Chart
              width={width}
              series={series}
              bands={bands}
              goal={goal}
              goalDay={goalDayInYear}
            />
          ) : null
        }
      </ParentSize>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {bands.map((b) => (
          <li key={b.key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: b.color, opacity: AREA_OPACITY }}
            />
            {b.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
