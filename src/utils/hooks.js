// Genel amacli React hook'lar.
import { useState, useEffect } from 'react';
import { useMotionValue } from 'framer-motion';

export function useReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setRm(mq.matches);
    const h = () => setRm(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return rm;
}

export function useTouchDevice() {
  const [t, setT] = useState(false);
  useEffect(() => { setT(window.matchMedia('(hover: none)').matches); }, []);
  return t;
}

export function useMousePosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  useEffect(() => {
    const h = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, [x, y]);
  return { x, y };
}
