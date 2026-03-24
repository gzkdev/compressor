import { Text } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";

const SHIMMER_COLORS = [
  "#a855f7",
  "#c084fc",
  "#e879f9",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
];

export function ShimmerSpinner() {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % SHIMMER_COLORS.length);
    }, 80);

    return () => clearInterval(timer);
  }, []);

  return (
    <Text color={SHIMMER_COLORS[colorIndex] as string}>
      <Spinner type="dots" />
    </Text>
  );
}
