import { memo } from 'react';

interface CardEffectsProps {
  mobile: boolean;
}

export const CardEffects = memo(function CardEffects({ mobile }: CardEffectsProps) {
  if (mobile) return null;

  return (
    <>
      <ShimmerEffect />
      <GlowEffect />
      <GradientOverlay />
    </>
  );
});

const ShimmerEffect = memo(function ShimmerEffect() {
  return (
    <span className="z-10 absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[var(--blog-accent)]/20 to-transparent transform -translate-x-full opacity-0 transition-all duration-1000 ease-in-out group-hover:opacity-100 group-hover:translate-x-full" />
  );
});

const GlowEffect = memo(function GlowEffect() {
  return (
    <div className="absolute -inset-px bg-gradient-to-r rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10" />
  );
});

const GradientOverlay = memo(function GradientOverlay() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--blog-accent)]/5 via-transparent to-[var(--blog-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none rounded-2xl" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--blog-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none" />
    </>
  );
});

CardEffects.displayName = 'CardEffects';