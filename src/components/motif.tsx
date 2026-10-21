import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

/** Original line-art marks for the handbook. Not copied from the concept boards. */
export type MotifName =
  | 'gear'
  | 'wrench'
  | 'coupling'
  | 'trouble'
  | 'forms'
  | 'calculator'
  | 'company'
  | 'jobs'
  | 'book'
  | 'calendar'
  | 'ribbon'
  | 'person'
  | 'mic'
  | 'placement'
  | 'school'
  | 'home'
  | 'people'
  | 'briefcase'
  | 'bolt'
  | 'bearing';

export function Motif({
  name,
  color,
  cutout = 'transparent',
  size = 24,
}: {
  name: MotifName;
  color: string;
  /** Color that shows through a gear bore or a filled cutout. */
  cutout?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph(name, color, cutout)}
    </Svg>
  );
}

function glyph(name: MotifName, color: string, cutout: string) {
  switch (name) {
    case 'gear':
      return (
        <G>
          {Array.from({ length: 8 }, (_, index) => (
            <Rect
              key={index}
              x={10.35}
              y={0.7}
              width={3.3}
              height={4.3}
              rx={0.7}
              fill={color}
              transform={`rotate(${index * 45} 12 12)`}
            />
          ))}
          <Circle cx={12} cy={12} r={6.5} fill={color} />
          <Circle cx={12} cy={12} r={2.45} fill={cutout} />
        </G>
      );
    case 'wrench':
      return (
        <G>
          <Path
            d="M14.1 4.6a3.4 3.4 0 0 1 4.5 4.7l-1.7 1.7-3.6-3.6 0.8-2.8z"
            fill={color}
          />
          <Path
            d="M13.4 10.6 6.2 17.8a1.8 1.8 0 1 0 2.5 2.5l7.2-7.2"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={17.1} cy={7.1} r={1.15} fill={cutout} />
        </G>
      );
    case 'coupling':
      return (
        <G>
          <Circle cx={6.2} cy={12} r={3.3} stroke={color} strokeWidth={1.8} fill="none" />
          <Circle cx={17.8} cy={12} r={3.3} stroke={color} strokeWidth={1.8} fill="none" />
          <Line x1={9.5} y1={12} x2={14.5} y2={12} stroke={color} strokeWidth={2.3} strokeLinecap="round" />
          <Line x1={6.2} y1={8.7} x2={6.2} y2={6.2} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1={17.8} y1={8.7} x2={17.8} y2={6.2} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </G>
      );
    case 'trouble':
      return (
        <G>
          <Circle cx={10.2} cy={10.2} r={5.4} stroke={color} strokeWidth={1.8} fill="none" />
          <Line x1={14.2} y1={14.2} x2={20} y2={20} stroke={color} strokeWidth={2.3} strokeLinecap="round" />
          <Path
            d="M10.2 7.3 11.5 8.6 12.8 7.6 12.4 9.2 13.8 10 12.2 10.3 12.4 11.9 10.2 11 8 11.9 8.2 10.3 6.6 10 8 9.2 7.6 7.6 8.9 8.6Z"
            fill={color}
          />
        </G>
      );
    case 'forms':
      return (
        <G>
          <Rect x={5} y={4.2} width={14} height={16.2} rx={2} stroke={color} strokeWidth={1.7} fill="none" />
          <Rect x={9} y={2.6} width={6} height={3.2} rx={1} fill={color} />
          <Line x1={8} y1={10} x2={16} y2={10} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={8} y1={13.4} x2={16} y2={13.4} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={8} y1={16.8} x2={13} y2={16.8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </G>
      );
    case 'calculator':
      return (
        <G>
          <Rect x={4} y={2.8} width={16} height={18.4} rx={2.2} stroke={color} strokeWidth={1.7} fill="none" />
          <Rect x={6.6} y={5.2} width={10.8} height={3.1} rx={0.6} fill={color} />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((column) => (
              <Rect
                key={`${row}-${column}`}
                x={6.7 + column * 3.8}
                y={10.2 + row * 3.3}
                width={2.6}
                height={2.2}
                rx={0.4}
                fill={color}
              />
            )),
          )}
        </G>
      );
    case 'company':
      return (
        <G>
          <Path d="M3.8 20.2V10.2L12 3.8l8.2 6.4v10" stroke={color} strokeWidth={1.7} fill="none" strokeLinejoin="round" />
          <Rect x={10} y={13.2} width={4} height={7} fill={color} />
          <Rect x={6.2} y={11.2} width={2.5} height={2.5} rx={0.3} fill={color} />
          <Rect x={15.3} y={11.2} width={2.5} height={2.5} rx={0.3} fill={color} />
        </G>
      );
    case 'jobs':
      return (
        <G>
          <Rect x={4} y={3.5} width={16} height={17} rx={2} stroke={color} strokeWidth={1.7} fill="none" />
          <Path d="M8 12.2 10.6 14.8 16.2 9.2" stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );
    case 'book':
      return (
        <G>
          <Path
            d="M12 6.2C10.2 5 6.4 5.2 4 6.6V19c2.2-1.2 6-1.4 8-.4 2-1 5.8-.8 8 .4V6.6C17.6 5.2 13.8 5 12 6.2Z"
            stroke={color}
            strokeWidth={1.6}
            fill="none"
            strokeLinejoin="round"
          />
          <Line x1={12} y1={6.2} x2={12} y2={18.6} stroke={color} strokeWidth={1.5} />
        </G>
      );
    case 'calendar':
      return (
        <G>
          <Rect x={3.4} y={5} width={17.2} height={15} rx={2} stroke={color} strokeWidth={1.7} fill="none" />
          <Line x1={3.4} y1={9.2} x2={20.6} y2={9.2} stroke={color} strokeWidth={1.6} />
          <Line x1={8} y1={3.2} x2={8} y2={6.8} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1={16} y1={3.2} x2={16} y2={6.8} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Circle cx={8.2} cy={13.2} r={1} fill={color} />
          <Circle cx={12} cy={13.2} r={1} fill={color} />
          <Circle cx={15.8} cy={13.2} r={1} fill={color} />
        </G>
      );
    case 'ribbon':
      return (
        <G>
          <Circle cx={12} cy={9} r={4.3} stroke={color} strokeWidth={1.7} fill="none" />
          <Path d="M9.1 12.7 7.8 20.2 12 17.5 16.2 20.2 14.9 12.7" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
        </G>
      );
    case 'person':
      return (
        <G>
          <Circle cx={12} cy={8} r={3.2} stroke={color} strokeWidth={1.7} fill="none" />
          <Path d="M5.2 19.6c.8-3.8 3.2-5.8 6.8-5.8s6 2 6.8 5.8" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'mic':
      return (
        <G>
          <Rect x={9} y={2.6} width={6} height={10.2} rx={3} stroke={color} strokeWidth={1.7} fill="none" />
          <Path d="M6.8 11.2a5.2 5.2 0 0 0 10.4 0" stroke={color} strokeWidth={1.7} fill="none" />
          <Line x1={12} y1={16.4} x2={12} y2={20.2} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1={8.6} y1={20.2} x2={15.4} y2={20.2} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </G>
      );
    case 'placement':
      return (
        <G>
          <Path d="M2.8 10.2 12 6l9.2 4.2L12 14.4Z" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
          <Path d="M6.8 12.2v3.6c1.6 1.2 8.8 1.2 10.4 0v-3.6" stroke={color} strokeWidth={1.6} fill="none" />
          <Line x1={21.2} y1={10.2} x2={21.2} y2={15.4} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      );
    case 'school':
      return (
        <G>
          <Rect x={3} y={3.4} width={18} height={13.2} rx={1.6} stroke={color} strokeWidth={1.6} fill="none" />
          <Line x1={12} y1={16.6} x2={12} y2={19.4} stroke={color} strokeWidth={1.6} />
          <Line x1={8} y1={19.6} x2={16} y2={19.6} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M7 10.2h4.2M7 13h6.4" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </G>
      );
    case 'home':
      return (
        <G>
          <Path d="M3.6 11.2 12 4.2l8.4 7v9H3.6Z" stroke={color} strokeWidth={1.7} fill="none" strokeLinejoin="round" />
          <Rect x={10} y={13.4} width={4} height={6.6} fill={color} />
        </G>
      );
    case 'people':
      return (
        <G>
          <Circle cx={8.4} cy={8.4} r={2.5} stroke={color} strokeWidth={1.5} fill="none" />
          <Circle cx={15.6} cy={8.8} r={2.3} stroke={color} strokeWidth={1.5} fill="none" />
          <Path d="M3.4 19.2c.6-3 2.4-4.6 5-4.6 2.2 0 3.6 1.1 4.2 2.2" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <Path d="M12.2 17.2c.5-1.6 1.8-3 3.6-3 2.2 0 3.8 1.4 4.6 4.2" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'briefcase':
      return (
        <G>
          <Rect x={3} y={8} width={18} height={11.5} rx={2} stroke={color} strokeWidth={1.7} fill="none" />
          <Path d="M8.2 8V6.4A1.8 1.8 0 0 1 10 4.6h4a1.8 1.8 0 0 1 1.8 1.8V8" stroke={color} strokeWidth={1.7} fill="none" />
          <Line x1={3} y1={13} x2={21} y2={13} stroke={color} strokeWidth={1.5} />
        </G>
      );
    case 'bolt':
      return (
        <G>
          <Path d="M12 2.8 17.4 5.8v6.4L12 15.2 6.6 12.2V5.8Z" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
          <Line x1={8.2} y1={9} x2={15.8} y2={9} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={12} y1={15.2} x2={12} y2={21} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        </G>
      );
    case 'bearing':
      return (
        <G>
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} fill="none" />
          <Circle cx={12} cy={12} r={3.1} stroke={color} strokeWidth={1.6} fill="none" />
          <Circle cx={12} cy={6.2} r={1.15} fill={color} />
          <Circle cx={17} cy={9} r={1.15} fill={color} />
          <Circle cx={17} cy={15} r={1.15} fill={color} />
          <Circle cx={12} cy={17.8} r={1.15} fill={color} />
          <Circle cx={7} cy={15} r={1.15} fill={color} />
          <Circle cx={7} cy={9} r={1.15} fill={color} />
        </G>
      );
    default:
      return null;
  }
}

/** Wide industrial mark for the home hero. Original geometry, not a photograph. */
export function TurbineCardArt() {
  const navy = '#1F3A5F';
  const steel = '#C9CED3';
  const bronze = '#A9773F';
  const paper = '#F3EBDD';
  const blade = '#E8EBEE';
  return (
    <Svg width="100%" height={148} viewBox="0 0 320 148">
      <Rect x={18} y={126} width={284} height={10} rx={3} fill={navy} />
      <Rect x={128} y={108} width={64} height={20} rx={2} fill={navy} />
      <Circle cx={160} cy={74} r={46} fill={navy} />
      <Circle cx={160} cy={74} r={34} fill={steel} />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <Path
          key={angle}
          d="M160 74 L172 58 L160 42 L148 58 Z"
          fill={blade}
          transform={`rotate(${angle} 160 74)`}
        />
      ))}
      <Circle cx={160} cy={74} r={8} fill={navy} />
      <Circle cx={160} cy={74} r={3} fill={paper} />
      <Rect x={206} y={68} width={52} height={12} rx={2} fill={navy} />
      <Circle cx={262} cy={74} r={12} stroke={navy} strokeWidth={4} fill={paper} />
      <Circle cx={286} cy={74} r={10} stroke={bronze} strokeWidth={4} fill={paper} />
      <Line x1={250} y1={74} x2={276} y2={74} stroke={navy} strokeWidth={3} />
      <Rect x={36} y={86} width={46} height={16} rx={8} fill={navy} />
      <Line x1={82} y1={94} x2={114} y2={94} stroke={navy} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={48} cy={122} r={3} fill={paper} />
      <Circle cx={272} cy={122} r={3} fill={paper} />
    </Svg>
  );
}
