import { useEffect, useRef, useState, FC } from "react";
import sampleSize from "lodash/sampleSize";
import range from "lodash/range";
import styles from "../../styles/g-number.module.css";

import confetti from "canvas-confetti";

const showConfetti = (confetti: confetti.CreateTypes) => {
  var duration = 15 * 1000;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = window.setInterval(function () {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    var particleCount = 151 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    try {
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      );
    } catch (e) {
      console.log(e);
    }
  }, 250);
};

const Index: FC<{
  onClose: () => void;
  pickResult?: {
    index: number;
    winner: number;
  };
}> = ({ pickResult, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const numbers = range(9060);
  const [randomNumber, setRandomNumber] = useState(sampleSize(numbers));
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (pickResult) {
      window.clearInterval(intervalRef.current);
      setRandomNumber([pickResult?.winner]);
      if (canvasRef.current) {
        var myConfetti = confetti.create(canvasRef.current, {
          resize: true,
          useWorker: true,
        });
        showConfetti(myConfetti);
      }
    }
  }, [pickResult]);
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setRandomNumber(sampleSize(range(9060)));
    }, 100);

    return () => {
      window.clearInterval(intervalRef.current);
    };
  }, []);
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {pickResult && (
          <h2
            style={{
              fontSize: "4rem",
              margin: 0,
            }}
          >
            Congratulations 🎉 (No{pickResult.index + 1})
          </h2>
        )}
        <h1
          style={{
            fontSize: "8rem",
          }}
        >
          #{randomNumber}
        </h1>

        <div
          className={styles.btn}
          onClick={() => {
            if (pickResult) {
              onClose();
            }
          }}
          style={{
            cursor: pickResult ? "pointer" : "not-allowed",
            background: pickResult ? "#0affe2" : "#f5f5f5",
          }}
        >
          Close
        </div>
      </div>
    </>
  );
};

export default Index;
