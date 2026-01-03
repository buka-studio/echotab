export function useTypingAnimation({
  text,
  speed = 50,
  splitter = (t) => [...t],
  onAnimationEnd,
  disabled,
}: {
  text: string;
  speed?: number;
  splitter?: (t: string) => string[];
  onAnimationEnd?: () => void;
  disabled?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const textParts = useMemo(() => splitter(text), [text, splitter]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    if (currentIndex < textParts.length) {
      const timer = setTimeout(
        () => {
          setDisplayedText((prev) => [...prev, textParts[currentIndex]]);
          setCurrentIndex((prev) => prev + 1);
        },
        speed + speed * (Math.random() - 0.5),
      );

      return () => clearTimeout(timer);
    }

    if (currentIndex === textParts.length && textParts.length > 0) {
      onAnimationEnd?.();
    }
  }, [textParts, currentIndex, speed, onAnimationEnd, disabled]);

  return displayedText;
}
