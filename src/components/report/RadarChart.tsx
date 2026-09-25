import React from 'react';

interface RadarDataPoint {
  label: string;
  selfScore: number; // 0 to 100
  peerScore?: number; // 0 to 100
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  showPeers?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 400,
  showPeers = false,
}) => {
  const center = size / 2;
  const radius = size * 0.36;
  const totalAxes = data.length; // 6 Summary Characteristics

  // Angles for each axis in radians (starting from top, clockwise)
  const getAngle = (index: number) => {
    return (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
  };

  // Convert polar coordinates to Cartesian (x, y)
  const polarToCartesian = (angle: number, distance: number) => {
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Concentric grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Self points polygon
  const selfPolygonPoints = data
    .map((d, i) => {
      const angle = getAngle(i);
      const dist = (d.selfScore / 100) * radius;
      const pt = polarToCartesian(angle, dist);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  // Peer points polygon
  const peerPolygonPoints = showPeers
    ? data
        .map((d, i) => {
          const angle = getAngle(i);
          const dist = ((d.peerScore ?? 0) / 100) * radius;
          const pt = polarToCartesian(angle, dist);
          return `${pt.x},${pt.y}`;
        })
        .join(' ')
    : '';

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible select-none"
      >
        {/* Concentric Polygons / Circles */}
        {gridLevels.map((lvl, idx) => {
          const levelPoints = data
            .map((_, i) => {
              const angle = getAngle(i);
              const pt = polarToCartesian(angle, radius * lvl);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');

          return (
            <g key={idx}>
              <polygon
                points={levelPoints}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={idx === gridLevels.length - 1 ? '1.5' : '1'}
                strokeDasharray={idx === gridLevels.length - 1 ? undefined : '3 3'}
              />
              {/* Level label on vertical axis */}
              <text
                x={center + 6}
                y={center - radius * lvl + 3}
                fill="#94A3B8"
                fontSize="10"
                fontFamily="ui-monospace, monospace"
              >
                {Math.round(lvl * 100)}
              </text>
            </g>
          );
        })}

        {/* Axis Spokes from center to vertex */}
        {data.map((_, i) => {
          const angle = getAngle(i);
          const pt = polarToCartesian(angle, radius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={pt.x}
              y2={pt.y}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          );
        })}

        {/* Peer Feedback Polygon (if active & enabled) */}
        {showPeers && peerPolygonPoints && (
          <polygon
            points={peerPolygonPoints}
            fill="#6366F1"
            fillOpacity="0.22"
            stroke="#4F46E5"
            strokeWidth="2.5"
            className="transition-all duration-500"
          />
        )}

        {/* Self Perception Polygon */}
        <polygon
          points={selfPolygonPoints}
          fill="#0D9488"
          fillOpacity="0.32"
          stroke="#0F766E"
          strokeWidth="2.5"
          className="transition-all duration-500"
        />

        {/* Point dots for Self */}
        {data.map((d, i) => {
          const angle = getAngle(i);
          const pt = polarToCartesian(angle, (d.selfScore / 100) * radius);
          return (
            <circle
              key={`self-dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#0F766E"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Point dots for Peer */}
        {showPeers &&
          data.map((d, i) => {
            if (d.peerScore === undefined) return null;
            const angle = getAngle(i);
            const pt = polarToCartesian(angle, (d.peerScore / 100) * radius);
            return (
              <circle
                key={`peer-dot-${i}`}
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#4F46E5"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}

        {/* Axis Labels */}
        {data.map((d, i) => {
          const angle = getAngle(i);
          const labelDist = radius + 32;
          const pt = polarToCartesian(angle, labelDist);

          // Determine text anchor based on position
          let textAnchor = 'middle';
          if (Math.cos(angle) > 0.3) textAnchor = 'start';
          if (Math.cos(angle) < -0.3) textAnchor = 'end';

          return (
            <g key={`label-${i}`} transform={`translate(${pt.x}, ${pt.y})`}>
              <text
                textAnchor={textAnchor}
                fill="#1E293B"
                fontSize="12"
                fontWeight="600"
                fontFamily="inherit"
                className="select-none"
              >
                {d.label}
              </text>
              <text
                y="14"
                textAnchor={textAnchor}
                fill="#64748B"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
              >
                Self: {d.selfScore}
                {showPeers && d.peerScore !== undefined ? ` • Peer: ${d.peerScore}` : ''}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Chart Legend */}
      <div className="flex items-center space-x-6 mt-4 text-xs font-medium">
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-teal-600 border border-teal-700" />
          <span className="text-slate-800 font-semibold">Self Perception</span>
        </div>

        {showPeers && (
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-indigo-500 border border-indigo-700" />
            <span className="text-slate-800 font-semibold">Aggregated Peer Perception</span>
          </div>
        )}
      </div>
    </div>
  );
};
