import {
  AnimationDefinition,
  motion,
  useAnimation,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ComponentProps, useEffect, useImperativeHandle, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import "./CurateDialog.css";

type Direction = "left" | "right" | "up" | "down";

export interface SwipeableRef {
  swipe: (direction?: Direction) => void;
}

interface Props {
  onSwiped: (direction?: Direction) => void;
  constrained?: boolean;
  i: number;
  active: boolean;
  swipeableRef: React.Ref<SwipeableRef>;
}

export default function SwipeableCard({
  children,
  onSwiped,
  constrained,
  i,
  active,
  swipeableRef,
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
        .then(() => onSwiped(trajectory.current.direction));
    }
  }

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: ((props.style?.y as number) || 0) + 20,
      scale: i === 0 ? 1 : props.style?.scale || 0.7,
      transition: {
        delay: 0.1 * i,
        type: "spring",
        stiffness: 100,
      },
    } as AnimationDefinition);
  }, [props.style?.y, controls, i]);

  const swipeLeft = () => {
    trajectory.current.direction = "left";

    controls
      .start({
        opacity: 0,
        x: -500,
        rotate: -90,
        filter: "blur(5px)",
        transition: {
          duration: 0.25,
        },
      })
      .then(() => {
        onSwiped("left");
      });
  };

  const swipeRight = () => {
    trajectory.current.direction = "right";
    controls
      .start({
        opacity: 0,
        x: 500,
        rotate: 90,
        transition: {
          duration: 0.25,
        },
      })
      .then(() => {
        onSwiped("right");
      });
  };

  const swipeUp = () => {
    trajectory.current.direction = "up";
    controls
      .start({
        opacity: 0,
        y: [400, 300],
        transition: {
          duration: 0.25,
        },
      })
      .then(() => {
        onSwiped("up");
      });
  };

  const swipeDown = () => {
    trajectory.current.direction = "down";
  };

  useHotkeys("left", () => swipeLeft(), {
    enabled: active,
  });

  useHotkeys("right", () => swipeRight(), {
    enabled: active,
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
        // swipeDown();
      }
    },
  }));

  return (
    <motion.div
      {...props}
      animate={controls}
      dragConstraints={constrained && { left: 0, right: 0, top: 10, bottom: 10 }}
      dragElastic={0.5}
      ref={containerRef}
      style={{
        ...(props.style || {}),
        x,
        opacity: 0,
        rotate: rotateSpring,
      }}
      onDrag={setTrajectory}
      onDragEnd={() => {
        flyAway(1000);

        rotate.set(0);
      }}
      //   onTouchStart={(e) => {
      //     (e.currentTarget as HTMLButtonElement)?.focus();
      //   }}
      //   onTouchEnd={(e) => {
      //     (e.currentTarget as HTMLButtonElement)?.blur();
      //   }}
      drag>
      {children}
    </motion.div>
  );
}
