import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Scroll reveal — fade up on viewport enter.
 * Subtle tier: y:12 → 0, opacity: 0 → 1, 350ms.
 */
export function scrollReveal(
  elements: gsap.TweenTarget,
  options?: {
    y?: number;
    duration?: number;
    delay?: number;
    stagger?: number;
    start?: string;
  }
) {
  const { y = 12, duration = 0.35, delay = 0, stagger = 0, start = "top 90%" } = options ?? {};

  return gsap.from(elements, {
    opacity: 0,
    y,
    duration,
    delay,
    stagger,
    ease: "power1.out",
    scrollTrigger: {
      trigger: elements as gsap.DOMTarget,
      start,
      toggleActions: "play none none none",
    },
  });
}

/**
 * Stagger reveal — list items appear sequentially.
 * Subtle tier: y:8 → 0, opacity: 0 → 1, 300ms per item, 0.03s stagger.
 */
export function staggerReveal(
  elements: gsap.TweenTarget,
  options?: {
    y?: number;
    duration?: number;
    stagger?: number;
    delay?: number;
  }
) {
  const { y = 8, duration = 0.3, stagger = 0.03, delay = 0 } = options ?? {};

  return gsap.from(elements, {
    opacity: 0,
    y,
    duration,
    delay,
    stagger,
    ease: "power1.out",
  });
}

/**
 * Hover lift — card micro-interaction on mouseenter/mouseleave.
 * y:-4, scale:1.02, shadow elevation.
 */
export function hoverLift(
  element: HTMLElement,
  options?: { y?: number; scale?: number; shadow?: string; duration?: number }
) {
  const {
    y = -4,
    scale = 1.02,
    shadow = "0 12px 24px rgba(0,0,0,0.12)",
    duration = 0.25,
  } = options ?? {};

  const defaultShadow = "0 1px 2px rgba(0,0,0,0.05)";

  const onEnter = () => {
    gsap.to(element, {
      y,
      scale,
      boxShadow: shadow,
      duration,
      ease: "power2.out",
    });
  };

  const onLeave = () => {
    gsap.to(element, {
      y: 0,
      scale: 1,
      boxShadow: defaultShadow,
      duration,
      ease: "power2.out",
    });
  };

  element.addEventListener("mouseenter", onEnter);
  element.addEventListener("mouseleave", onLeave);

  return () => {
    element.removeEventListener("mouseenter", onEnter);
    element.removeEventListener("mouseleave", onLeave);
  };
}

/**
 * Entrance animation — elements appear on mount (no scroll trigger).
 */
export function entranceReveal(
  elements: gsap.TweenTarget,
  options?: {
    y?: number;
    duration?: number;
    stagger?: number;
    delay?: number;
  }
) {
  const { y = 16, duration = 0.5, stagger = 0.06, delay = 0 } = options ?? {};

  return gsap.from(elements, {
    opacity: 0,
    y,
    duration,
    delay,
    stagger,
    ease: "power2.out",
  });
}

export { gsap, ScrollTrigger };
