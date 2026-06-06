import { Cable, CircuitBoard, Code2, Cpu, Gauge, Play, Sparkles, SquareStack } from "lucide-react";

type Props = {
  boardCount: number;
  componentCount: number;
  lessonCount: number;
  onStart: () => void;
  onOpenCircuit: () => void;
  onOpenCode: () => void;
  onOpenLessons: () => void;
};

export default function LandingPage({ boardCount, componentCount, lessonCount, onStart, onOpenCircuit, onOpenCode, onOpenLessons }: Props) {
  return (
    <main className="landing-shell">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-scene" aria-hidden="true">
          <div className="landing-bubble bubble-blocks">
            <SquareStack size={20} />
            <span>Blocks</span>
          </div>
          <div className="landing-bubble bubble-code">
            <Code2 size={20} />
            <span>C++</span>
          </div>
          <div className="landing-bubble bubble-usb">
            <Cable size={20} />
            <span>USB</span>
          </div>
          <div className="landing-device">
            <div className="landing-board">
              <span />
              <span />
              <strong>Arduino</strong>
            </div>
            <div className="landing-wire wire-a" />
            <div className="landing-wire wire-b" />
            <div className="landing-breadboard">
              <span />
              <span />
              <span />
              <strong>Breadboard</strong>
            </div>
            <div className="landing-sensor sensor-one">LED</div>
            <div className="landing-sensor sensor-two">DHT</div>
          </div>
          <div className="landing-code-card">
            <span>void loop()</span>
            <span>digitalWrite(LED, HIGH);</span>
            <span>delay(1000);</span>
          </div>
        </div>

        <nav className="landing-nav" aria-label="Landing navigation">
          <div className="landing-brand">
            <span className="landing-brand-mark">
              <Cpu size={22} />
            </span>
            <strong>Arduino Blocks Lab</strong>
          </div>
          <button onClick={onStart}>Open app</button>
        </nav>

        <div className="landing-hero-copy">
          <span className="landing-kicker">
            <Sparkles size={16} />
            Blocks to real boards
          </span>
          <h1 id="landing-title">Arduino Blocks Lab</h1>
          <p>
            A playful block coding studio for Arduino that lets students start visually, inspect the generated C++, plan wiring, and move toward real uploads.
          </p>
          <div className="landing-actions">
            <button className="landing-primary" onClick={onStart}>
              <Play size={18} />
              Start building
            </button>
            <button className="landing-secondary" onClick={onOpenCircuit}>
              <CircuitBoard size={18} />
              Preview circuits
            </button>
          </div>
        </div>
      </section>

      <section className="landing-band" aria-label="Project entry points">
        <div className="landing-stat-row">
          <span>
            <strong>{boardCount}</strong>
            boards
          </span>
          <span>
            <strong>{componentCount}</strong>
            parts
          </span>
          <span>
            <strong>{lessonCount}</strong>
            lessons
          </span>
        </div>
        <div className="landing-entry-grid">
          <button onClick={onStart}>
            <SquareStack size={22} />
            <strong>Word Blocks</strong>
            <span>Build starter programs with colorful Arduino blocks.</span>
          </button>
          <button onClick={onOpenCode}>
            <Code2 size={22} />
            <strong>Arduino C++</strong>
            <span>See the real sketch update as projects change.</span>
          </button>
          <button onClick={onOpenCircuit}>
            <CircuitBoard size={22} />
            <strong>Circuit Studio</strong>
            <span>Check wiring plans before touching the breadboard.</span>
          </button>
          <button onClick={onOpenLessons}>
            <Gauge size={22} />
            <strong>Lessons</strong>
            <span>Follow beginner missions with classroom-friendly steps.</span>
          </button>
        </div>
      </section>
    </main>
  );
}
