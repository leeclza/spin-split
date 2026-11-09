import { For, Match, Switch } from "solid-js";

const PALETTE = ["#7c3aed", "#db2777", "#f59e0b", "#059669", "#2563eb", "#dc2626", "#0891b2", "#ea580c"];
const R = 93;

function colorAt(n: number, i: number) {
  // avoid the last slice sharing a color with the first one
  if (n > 1 && i === n - 1 && n % PALETTE.length === 1) return PALETTE[2];
  return PALETTE[i % PALETTE.length];
}

function point(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return `${R * Math.sin(rad)} ${-R * Math.cos(rad)}`;
}

function truncate(s: string) {
  return s.length > 14 ? s.slice(0, 13) + "…" : s;
}

function fontSize(n: number) {
  if (n <= 8) return 9;
  if (n <= 16) return 7;
  if (n <= 30) return 5;
  return 3.5;
}

function Label(props: { mid: number; name: string; size: number }) {
  return (
    <text
      transform={`rotate(${props.mid - 90})`}
      x="58"
      y="0"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="#fff"
      font-size={String(props.size)}
      font-weight="600"
    >
      {truncate(props.name)}
    </text>
  );
}

export default function Wheel(props: { names: string[]; rotation: number; onSpinEnd: () => void }) {
  const n = () => props.names.length;
  const seg = () => 360 / n();

  return (
    <svg
      class="wheel"
      viewBox="-100 -100 200 200"
      style={{ transform: `rotate(${props.rotation}deg)` }}
      onTransitionEnd={props.onSpinEnd}
    >
      <circle r="100" fill="#1e1b4b" stroke="#fbbf24" stroke-width="3" />
      <For each={Array.from({ length: 24 }, (_, i) => i * 15)}>
        {(a) => {
          const rad = (a * Math.PI) / 180;
          return <circle cx={97 * Math.sin(rad)} cy={-97 * Math.cos(rad)} r="1.3" fill="#fef3c7" />;
        }}
      </For>
      <Switch>
        <Match when={n() === 0}>
          <circle r={R} fill="#e4e4e7" />
        </Match>
        <Match when={n() === 1}>
          <circle r={R} fill={colorAt(1, 0)} />
          <Label mid={0} name={props.names[0]} size={fontSize(1)} />
        </Match>
        <Match when={n() > 1}>
          <For each={props.names}>
            {(name, i) => {
              const a0 = () => seg() * i();
              const a1 = () => a0() + seg();
              const large = () => (seg() > 180 ? 1 : 0);
              return (
                <>
                  <path
                    d={`M0 0 L${point(a0())} A${R} ${R} 0 ${large()} 1 ${point(a1())} Z`}
                    fill={colorAt(n(), i())}
                    stroke="rgba(255,255,255,0.35)"
                    stroke-width="0.6"
                  />
                  <Label mid={a0() + seg() / 2} name={name} size={fontSize(n())} />
                </>
              );
            }}
          </For>
        </Match>
      </Switch>
    </svg>
  );
}
