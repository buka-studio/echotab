import {
  AnimationDefinition,
  motion,
  useAnimation,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ComponentProps, useEffect, useImperativeHandle, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export type Direction = "left" | "right" | "up" | "down";

export interface SwipeableRef {
  swipe: (direction?: Direction) => void;
}

interface Props {
  onSwipe: (direction?: Direction) => void;
  onBeforeSwipe: (direction?: Direction) => void;
  constrained?: boolean;
  i: number;
  active: boolean;
  swipeableRef: React.Ref<SwipeableRef>;
  directions: Direction[];
}

export default function SwipeableCard({
  children,
  onSwipe,
  onBeforeSwipe,
  constrained,
  i,
  active,
  swipeableRef,
  directions,
  ...props
}: Props & ComponentProps<typeof motion.div>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const x = useMotionValue(0);
  const rotate = useMotionValue(0);
  const rotateSpring = useSpring(rotate, { stiffness: 50, damping: 10 });
  const controls = useAnimation();

  const trajectory = useRef<{
    v: number;
    direction: Direction | undefined;
  }>({
    v: 0,
    direction: undefined,
  });

  function setTrajectory() {
    const velocity = x.getVelocity();
    const direction = velocity >= 1 ? "right" : velocity <= -1 ? "left" : undefined;
    if (velocity === 0 || direction === undefined) {
      return;
    }

    dragging.current = true;
    trajectory.current = { v: velocity, direction };

    if (Math.abs(velocity) > 200) {
      rotate.set(direction === "left" ? -18 : 18);
    } else {
      rotate.set(0);
    }
  }

  function flyAway(minVelocity: number) {
    const flyAwayDistance = (direction: Direction) => {
      const parentWidth = containerRef.current?.parentElement?.getBoundingClientRect()?.width;
      if (!parentWidth) {
        return 0;
      }
      const childWidth = containerRef.current!.getBoundingClientRect().width;

      return direction === "left"
        ? -parentWidth / 2 - childWidth / 2
        : parentWidth / 2 + childWidth / 2;
    };

    if (
      trajectory.current.direction &&
      Math.abs(trajectory.current.v) > minVelocity &&
      containerRef.current
    ) {
      controls
        .start({
          x: flyAwayDistance(trajectory.current.direction) * 1.2,
        })
        .then(() => onSwipe(trajectory.current.direction));
    }
  }

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: ((props.style?.y as number) || 0) + 20,
      scale: i === 0 ? 1 : props.style?.scale || 0.7,
      filter: props.style?.filter || "blur(0px)",
      ...(i === 0 && {
        filter: "blur(0px)",
        y: 20,
      }),
      transition: {
        delay: 0.05 * i,
        duration: 0.75,
        type: "spring",
      },
    } as AnimationDefinition);
  }, [props.style?.y, controls, i, props.style?.filter]);

  const swipeLeft = () => {
    onBeforeSwipe("left");
    trajectory.current.direction = "left";
    controls
      .start({
        opacity: 0,
        x: -500,
        rotate: -90,
        filter: "blur(5px)",
        transition: {
          duration: 0.175,
        },
      })
      .then(() => {
        onSwipe("left");
      });
  };

  const swipeRight = () => {
    onBeforeSwipe("right");
    trajectory.current.direction = "right";
    controls
      .start({
        opacity: 0,
        x: 500,
        rotate: 90,
        transition: {
          duration: 0.175,
        },
      })
      .then(() => {
        onSwipe("right");
      });
  };

  const swipeUp = () => {
    trajectory.current.direction = "up";
    controls
      .start({
        opacity: 0,
        filter: "blur(10px)",
        y: -100,
        scale: 0.85,
        transition: {
          duration: 0.2,
        },
      })
      .then(() => {
        onSwipe("up");
      })
      .then(() => controls.set({ zIndex: 0 }))
      .then(() => controls.start({ y: -100, transition: { duration: 0.15 } }));
  };

  const swipeDown = () => {
    trajectory.current.direction = "down";
    controls
      .start({
        opacity: 0,
        filter: "blur(10px)",
        y: 75,
        scale: 0.95,
        transition: {
          duration: 0.225,
        },
      })
      .then(() => {
        onSwipe("down");
      })
      .then(() => controls.set({ zIndex: 0 }))
      .then(() => controls.start({ y: -100, transition: { duration: 0.15 } }));
  };

  useHotkeys("left", () => swipeLeft(), {
    enabled: active && directions.includes("left"),
  });

  useHotkeys("right", () => swipeRight(), {
    enabled: active && directions.includes("right"),
  });

  useHotkeys("up", () => swipeUp(), {
    enabled: active && directions.includes("up"),
  });

  useHotkeys("down", () => swipeDown(), {
    enabled: active && directions.includes("down"),
  });

  useImperativeHandle(swipeableRef, () => ({
    swipe: (direction?: Direction) => {
      if (direction === "left") {
        swipeLeft();
      } else if (direction === "right") {
        swipeRight();
      } else if (direction === "up") {
        swipeUp();
      } else if (direction === "down") {
        swipeDown();
      }
    },
  }));

  return (
    <motion.div
      {...props}
      animate={controls}
      dragConstraints={constrained && { left: 0, right: 0, top: 20, bottom: 20 }}
      dragElastic={0.5}
      ref={containerRef}
      style={{
        ...(props.style || {}),
        x,
        opacity: 0,
        rotate: rotateSpring,
        z: 1,
      }}
      onDrag={setTrajectory}
      onDragEnd={() => {
        flyAway(1000);

        rotate.set(0);
      }}
      drag>
      {children}
    </motion.div>
  );
}
