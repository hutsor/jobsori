import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { createJobsori } from "./jobsori";
import { createPrng, generateSeed } from "./random";
import { Fragment } from "react";

interface Output {
  title: string;
  body: string[];
}

export default function App() {
  const [cursor, setCursorState] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [seed, setSeed] = useState("");
  const [doesAppendPunc, setAppendPunc] = useState(true);
  const setCursor = (cursor: number) => {
    setCursorState(cursor);
    setSeed(history.at(cursor) as string);
  };

  const onPrevClick = () => {
    if (history.length + cursor <= 0) return;
    setCursor(cursor - 1);
  };
  const onNextClick = () => {
    if (cursor >= -1) return;
    setCursor(cursor + 1);
  };

  const regenerateSeed = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const seed = generateSeed();
    setHistory((prev) => [...prev, seed]);
    setCursor(-1);
    setSeed(seed);
    setOutput(null);
  };

  const toggleAuto = useCallback((e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    setPlaying((p) => !p);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (!seed) {
      regenerateSeed();
      return;
    }
    setOutput(null);
    const prng = createPrng(seed);

    let timerId = window.setTimeout(function iterate() {
      setOutput((prev) =>
        prev
          ? {
              ...prev,
              body: [...prev.body, createJobsori(prng, doesAppendPunc)],
            }
          : { title: createJobsori(prng, false), body: [] },
      );
      timerId = window.setTimeout(iterate, 100);
    });

    return () => clearTimeout(timerId);
  }, [isPlaying, seed, doesAppendPunc]);

  useEffect(() => {
    document.querySelector(".cursor-control")?.scrollIntoView();
  }, [output]);
  return (
    <>
      <div className="hutsori-control">
        <h1>{output?.title ?? ""}</h1>
      </div>
      <div className={clsx("output-box")}>
        {output?.body.map((item, i) => <Fragment key={i}>{item} </Fragment>)}
      </div>
      <div className="cursor-control">
        <form>
          <p style={{ maxWidth: "100%" }}>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              size={16}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </p>
          <p>
            <button type="button" onClick={regenerateSeed}>
              시드 새로고침
            </button>{" "}
            <label>
              <input
                type="checkbox"
                checked={doesAppendPunc}
                onChange={(e) => setAppendPunc(e.target.checked)}
              />
              문장부호 붙이기
            </label>{" "}
            <button type="submit" onClick={toggleAuto}>
              <strong>생성 {isPlaying ? "정지" : "시작"}</strong>
            </button>
          </p>
        </form>
        <button type="button" onClick={onPrevClick}>
          이전
        </button>{" "}
        {history.length + cursor + 1} / {history.length}{" "}
        <button type="button" onClick={onNextClick}>
          다음
        </button>{" "}
      </div>
    </>
  );
}
