"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hook for scroll-triggered reveal animation on children of the ref'd element.
 * Uses gsap.context() for StrictMode-safe cleanup.
 */
export function useScrollReveal(options?: {
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const { y = 12, duration = 0.35, stagger = 0.06, start = "top 90%" } =
      options ?? {};

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(el.children, { opacity: 1, y: 0 });
        return;
      }

      gsap.from(el.children, {
        opacity: 0,
        y,
        duration,
        stagger,
        ease: "power1.out",
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: "play none none none",
        },
      });
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/**
 * Hook for entrance reveal (plays on mount, no scroll trigger).
 * Uses gsap.context() for StrictMode-safe cleanup.
 */
export function useEntranceReveal(options?: {
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const { y = 16, duration = 0.5, stagger = 0.06, delay = 0 } = options ?? {};

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(el.children, { opacity: 1, y: 0 });
        return;
      }

      gsap.from(el.children, {
        opacity: 0,
        y,
        duration,
        delay,
        stagger,
        ease: "power2.out",
      });
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
