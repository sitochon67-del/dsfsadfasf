import { useCallback, useEffect, useRef, useState } from "react";
import procesandoGif from "./img/procesando.gif";

/** Mismo tamaño que registro.pse.com.co (DevTools: 175×175) */
export const PSE_LOADER_SIZE_PX = 175;

/**
 * Iconos opcionales en img/loader-frames/ (frame-01.png, …).
 * Si hay PNGs en alta resolución, se usa volteo; si no, el GIF oficial.
 */
const frameContext = require.context(
  "./img/loader-frames",
  false,
  /\.(png|jpe?g|webp)$/i,
);

const PSE_LOADER_FRAMES = frameContext
  .keys()
  .sort()
  .map((key) => frameContext(key));

const PSE_FLIP_HALF_MS = 550;
const PSE_FLIP_PAUSE_MS = 350;

function PseLoaderGif() {
  return (
    <div
      className="pse-loader-gif"
      style={{ "--pse-loader-size": `${PSE_LOADER_SIZE_PX}px` }}
      aria-hidden="true"
    >
      <img
        src={procesandoGif}
        alt="Procesando transacción PSE"
        className="pse-loader-gif__img"
        width={PSE_LOADER_SIZE_PX}
        height={PSE_LOADER_SIZE_PX}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

function PseLoaderFlip({ frames }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [useTransition, setUseTransition] = useState(true);
  const flipLockRef = useRef(false);

  const runFlipOut = useCallback(() => {
    if (flipLockRef.current || frames.length <= 1) return;
    flipLockRef.current = true;
    setUseTransition(true);
    setRotateY(90);
  }, [frames.length]);

  const onTransitionEnd = useCallback(
    (event) => {
      if (event.propertyName !== "transform" || frames.length <= 1) return;

      if (rotateY === 90) {
        setUseTransition(false);
        setFrameIndex((i) => (i + 1) % frames.length);
        setRotateY(-90);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setUseTransition(true);
            setRotateY(0);
          });
        });
        return;
      }

      if (rotateY === 0) {
        flipLockRef.current = false;
      }
    },
    [rotateY, frames.length],
  );

  useEffect(() => {
    if (frames.length <= 1) return undefined;
    const delay = PSE_FLIP_PAUSE_MS + PSE_FLIP_HALF_MS * 2;
    const first = window.setTimeout(runFlipOut, PSE_FLIP_PAUSE_MS);
    const loop = window.setInterval(runFlipOut, delay);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [frames.length, runFlipOut]);

  return (
    <div
      className="pse-loader-flip"
      style={{
        "--pse-loader-size": `${PSE_LOADER_SIZE_PX}px`,
        "--pse-flip-half-ms": `${PSE_FLIP_HALF_MS}ms`,
      }}
      aria-hidden="true"
    >
      <div className="pse-loader-flip__stage">
        <div
          className="pse-loader-flip__card"
          style={{
            transform: `rotateY(${rotateY}deg)`,
            transition: useTransition
              ? `transform ${PSE_FLIP_HALF_MS}ms ease-in-out`
              : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          <img
            src={frames[frameIndex]}
            alt=""
            className="pse-loader-flip__img"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

export default function PseLoaderFrames() {
  if (PSE_LOADER_FRAMES.length > 0) {
    return <PseLoaderFlip frames={PSE_LOADER_FRAMES} />;
  }
  return <PseLoaderGif />;
}
