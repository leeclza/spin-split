import { createEffect, createMemo, createSignal, For, Index, JSX, Show } from "solid-js";
import Wheel from "./Wheel";

const TEAM_COLORS = ["#a78bfa", "#f472b6", "#34d399", "#60a5fa", "#fbbf24", "#f87171", "#2dd4bf", "#fb923c"];
const STORAGE_KEY = "spinsplit:v2";
const LEGACY_V2_KEY = "spin-split:v2";
const OLD_STORAGE_KEY = "spin-split:names";
const DEFAULT_NAMES = ["Andi", "Budi", "Citra", "Dewi", "Eka", "Fajar"];

type Pick = { name: string; at: number };
type Saved = { names: string[]; picked: Pick[] };

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem(LEGACY_V2_KEY);
    if (legacy) return JSON.parse(legacy);
    const old = localStorage.getItem(OLD_STORAGE_KEY);
    if (old !== null) return { names: splitNames(old), picked: [] };
  } catch {}
  return { names: DEFAULT_NAMES, picked: [] };
}

function splitNames(text: string) {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
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

function formatTime(t: number) {
  return new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const saved = load();
  const [tab, setTab] = createSignal<"wheel" | "teams">("wheel");
  const [listTab, setListTab] = createSignal<"names" | "picked">("names");
  // the textarea text is the source of truth; one name per line
  const [text, setText] = createSignal(saved.names.join("\n"));
  const names = createMemo(() =>
    text()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const setNames = (list: string[]) => setText(list.join("\n"));
  const [picked, setPicked] = createSignal<Pick[]>(saved.picked);
  const [rotation, setRotation] = createSignal(0);
  const [spinning, setSpinning] = createSignal(false);
  const [winner, setWinner] = createSignal<string | null>(null);
  const [teamCount, setTeamCount] = createSignal(2);
  const [teams, setTeams] = createSignal<string[][]>([]);

  createEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ names: names(), picked: picked() }));
    } catch {}
  });

  const addNames = (more: string) => setNames([...names(), ...splitNames(more)]);

  const removeAt = (i: number) => setNames(names().filter((_, j) => j !== i));

  const clearNames = () => {
    if (names().length && confirm("Hapus semua nama?")) setNames([]);
  };

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
    const w = list[Math.min(list.length - 1, Math.floor(angle / seg))];
    setWinner(w);
    setPicked((p) => [{ name: w, at: Date.now() }, ...p]);
    setSpinning(false);
  };

  const removeWinner = () => {
    const idx = names().indexOf(winner() ?? "");
    if (idx >= 0) removeAt(idx);
    setWinner(null);
  };

  // how many names have been "dealt" so far (round-robin order)
  const [dealt, setDealt] = createSignal(Infinity);
  const [dealing, setDealing] = createSignal(false);
  let dealTimer: number | undefined;
  const makeTeams = () => {
    const k = teamCount();
    const result: string[][] = Array.from({ length: k }, () => []);
    const shuffled = shuffle(names());
    shuffled.forEach((name, i) => result[i % k].push(name));
    clearInterval(dealTimer);
    setDealt(0);
    setDealing(true);
    setTeams(result);
    // cap the whole animation at ~2.5s regardless of list size
    const tickMs = 70;
    const step = Math.max(1, Math.ceil(shuffled.length / (2500 / tickMs)));
    dealTimer = window.setInterval(() => {
      const next = dealt() + step;
      if (next >= shuffled.length) {
        clearInterval(dealTimer);
        setDealt(Infinity);
        setDealing(false);
      } else setDealt(next);
    }, tickMs);
  };

  const [sortAsc, setSortAsc] = createSignal(true);
  const toggleSort = () => {
    const asc = sortAsc();
    const sorted = [...names()].sort((x, y) => x.localeCompare(y, "id", { sensitivity: "base" }));
    setNames(asc ? sorted : sorted.reverse());
    setSortAsc(!asc);
  };

  const nameList = () => (
    <>
      <textarea
        class="names-box"
        rows={12}
        spellcheck={false}
        placeholder={"Satu nama per baris\nAndi\nBudi\nCitra"}
        value={text()}
        disabled={spinning()}
        onInput={(e) => setText(e.currentTarget.value)}
      />

      <div class="list-actions">
        <button class="ghost" onClick={() => setNames(shuffle(names()))} disabled={spinning() || names().length < 2}>
          🔀 Acak
        </button>
        <button
          class="ghost"
          onClick={toggleSort}
          disabled={spinning() || names().length < 2}
          title={sortAsc() ? "Urutkan A → Z" : "Urutkan Z → A"}
        >
          {sortAsc() ? "↓ A–Z" : "↑ Z–A"}
        </button>
        <button class="ghost danger" onClick={clearNames} disabled={spinning() || !names().length}>
          🗑 Hapus semua
        </button>
      </div>
    </>
  );

  const pickedList = () => (
    <>
      <Show when={picked().length > 0} fallback={<p class="list-empty">Belum ada yang kepilih. Putar rodanya dulu!</p>}>
        <ol class="name-list picked">
          <For each={picked()}>
            {(p, i) => (
              <li>
                <span class="rank">{picked().length - i()}</span>
                <span class="name">{p.name}</span>
                <span class="time">{formatTime(p.at)}</span>
                <Show when={!names().includes(p.name)}>
                  <button class="ghost" onClick={() => addNames(p.name)} title="Kembalikan ke roda">
                    ↩
                  </button>
                </Show>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <div class="list-actions">
        <button class="ghost danger" onClick={() => setPicked([])} disabled={!picked().length}>
          🗑 Bersihkan riwayat
        </button>
      </div>
    </>
  );

  const namesPanel = (extra: JSX.Element, withHistory: boolean) => (
    <div class="panel names-panel">
      <Show
        when={withHistory}
        fallback={
          <h3>
            Daftar Nama <span class="badge">{names().length}</span>
          </h3>
        }
      >
        <div class="seg">
          <button classList={{ active: listTab() === "names" }} onClick={() => setListTab("names")}>
            Daftar <span class="badge">{names().length}</span>
          </button>
          <button classList={{ active: listTab() === "picked" }} onClick={() => setListTab("picked")}>
            Terpilih <span class="badge">{picked().length}</span>
          </button>
        </div>
      </Show>
      <Show when={!withHistory || listTab() === "names"} fallback={pickedList()}>
        {nameList()}
      </Show>
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
          <div>
            <div class="wheel-wrap">
              <div class="pointer" />
              <Wheel names={names()} rotation={rotation()} onSpinEnd={onSpinEnd} />
              <button class="spin-btn" onClick={spin} disabled={spinning() || names().length < 2}>
                SPIN
              </button>
            </div>
            <p class="hint">{names().length < 2 ? "Tambah minimal 2 nama untuk mulai" : "Klik SPIN untuk memutar roda"}</p>
          </div>
          {namesPanel(null, true)}
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
                      Tim {i() + 1}{" "}
                      <span class="badge">
                        {members.filter((_, j) => j * teams().length + i() < dealt()).length}
                      </span>
                    </h3>
                    <ul>
                      <Index each={members}>
                        {(m, j) => (
                          <Show when={j * teams().length + i() < dealt()}>
                            <li title={m()}>{m()}</li>
                          </Show>
                        )}
                      </Index>
                    </ul>
                  </div>
                )}
              </For>
            </div>
          </Show>
          {namesPanel(
            <div class="row team-row">
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
              <button class="primary" onClick={makeTeams} disabled={!names().length || dealing()}>
                Acak Tim
              </button>
            </div>,
            false,
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

      <footer class="footer">
        Made by <b>leeclza</b> · © {new Date().getFullYear()} · All rights reserved
      </footer>
    </div>
  );
}
