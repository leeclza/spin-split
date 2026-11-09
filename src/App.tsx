import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import Wheel from "./Wheel";

const TEAM_COLORS = ["#a78bfa", "#f472b6", "#34d399", "#60a5fa", "#fbbf24", "#f87171", "#2dd4bf", "#fb923c"];
const STORAGE_KEY = "spin-split:names";
const DEFAULT_NAMES = "Andi\nBudi\nCitra\nDewi\nEka\nFajar";

function loadNames() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_NAMES;
  } catch {
    return DEFAULT_NAMES;
  }
}

function mod360(x: number) {
  return ((x % 360) + 360) % 360;
}

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [tab, setTab] = createSignal<"wheel" | "teams">("wheel");
  const [input, setInput] = createSignal(loadNames());
  const [rotation, setRotation] = createSignal(0);
  const [spinning, setSpinning] = createSignal(false);
  const [winner, setWinner] = createSignal<string | null>(null);
  const [teamCount, setTeamCount] = createSignal(2);
  const [teams, setTeams] = createSignal<string[][]>([]);

  const names = createMemo(() =>
    input()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  createEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input());
    } catch {}
  });

  const spin = () => {
    if (spinning() || names().length < 2) return;
    setWinner(null);
    setSpinning(true);
    setRotation((r) => r + 360 * 6 + Math.random() * 360);
  };

  // Pointer sits at the top; the wheel turns clockwise by `rotation` degrees.
  const onSpinEnd = () => {
    if (!spinning()) return;
    const list = names();
    const seg = 360 / list.length;
    const angle = mod360(360 - mod360(rotation()));
    setWinner(list[Math.min(list.length - 1, Math.floor(angle / seg))]);
    setSpinning(false);
  };

  const removeWinner = () => {
    const w = winner();
    const list = [...names()];
    const idx = w === null ? -1 : list.indexOf(w);
    if (idx >= 0) list.splice(idx, 1);
    setInput(list.join("\n"));
    setWinner(null);
  };

  const makeTeams = () => {
    const k = teamCount();
    const result: string[][] = Array.from({ length: k }, () => []);
    shuffle(names()).forEach((name, i) => result[i % k].push(name));
    setTeams(result);
  };

  const namesPanel = (extra: any) => (
    <div class="panel">
      <h3>
        Daftar Nama <span class="badge">{names().length}</span>
      </h3>
      <textarea
        rows={12}
        placeholder="Satu nama per baris"
        value={input()}
        disabled={spinning()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      {extra}
    </div>
  );

  return (
    <div class="app">
      <header>
        <h1>Spin & Split</h1>
        <p class="subtitle">Putar roda atau bagi tim secara acak</p>
      </header>
      <div class="tabs">
        <button classList={{ active: tab() === "wheel" }} onClick={() => setTab("wheel")}>
          Roda Putar
        </button>
        <button classList={{ active: tab() === "teams" }} onClick={() => setTab("teams")}>
          Bagi Tim
        </button>
      </div>

      <Show when={tab() === "wheel"}>
        <div class="layout">
          <div class="wheel-wrap">
            <div class="pointer" />
            <Wheel names={names()} rotation={rotation()} onSpinEnd={onSpinEnd} />
            <button class="spin-btn" onClick={spin} disabled={spinning()}>
              SPIN
            </button>
          </div>
          {namesPanel(
            <p class="muted" style={{ "margin-top": "10px" }}>
              Satu nama per baris. Minimal 2 nama untuk spin.
            </p>,
          )}
        </div>
      </Show>

      <Show when={tab() === "teams"}>
        <div class="layout">
          <Show
            when={teams().length > 0}
            fallback={
              <div class="empty">
                <div>
                  <div class="big">🎲</div>
                  <p>
                    Atur jumlah tim, lalu klik <b>Acak Tim</b>
                  </p>
                </div>
              </div>
            }
          >
            <div class="teams">
              <For each={teams()}>
                {(members, i) => (
                  <div
                    class="panel team"
                    style={{
                      "--team-color": TEAM_COLORS[i() % TEAM_COLORS.length],
                      "animation-delay": `${i() * 60}ms`,
                    }}
                  >
                    <h3>
                      Tim {i() + 1} <span class="badge">{members.length}</span>
                    </h3>
                    <ul>
                      <For each={members}>{(m) => <li>{m}</li>}</For>
                    </ul>
                  </div>
                )}
              </For>
            </div>
          </Show>
          {namesPanel(
            <div class="row">
              <span class="grow">Jumlah tim</span>
              <input
                type="number"
                min="2"
                max="50"
                value={teamCount()}
                onInput={(e) => {
                  const v = parseInt(e.currentTarget.value);
                  if (!Number.isNaN(v)) setTeamCount(Math.min(50, Math.max(2, v)));
                }}
              />
              <button class="primary" onClick={makeTeams}>
                Acak Tim
              </button>
            </div>,
          )}
        </div>
      </Show>

      <Show when={winner()}>
        <div class="overlay">
          <div class="modal">
            <div class="trophy">🏆</div>
            <p class="muted">Yang kepilih:</p>
            <h2>{winner()}</h2>
            <div class="row">
              <button class="primary" onClick={() => setWinner(null)}>
                Tutup
              </button>
              <button onClick={removeWinner}>Hapus dari roda</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
