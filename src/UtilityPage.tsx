import type { Component, JSX } from 'solid-js';

export type UtilityAccent = 'blue' | 'purple' | 'green';

export const accentClasses: Record<UtilityAccent, string> = {
  blue: 'from-sky-400/30 to-cyan-300/10 text-sky-200 border-sky-300/30',
  purple:
    'from-violet-400/30 to-fuchsia-300/10 text-violet-200 border-violet-300/30',
  green:
    'from-emerald-400/30 to-teal-300/10 text-emerald-200 border-emerald-300/30',
};

export const UtilityPage: Component<{
  title: string;
  eyebrow: string;
  accent: UtilityAccent;
  description: string;
  children: JSX.Element;
}> = (props) => {
  return (
    <section class="mx-auto max-w-5xl space-y-8">
      <div
        class={`glass-panel border bg-gradient-to-br p-8 sm:p-10 ${accentClasses[props.accent]}`}
      >
        <p class="text-sm font-semibold uppercase tracking-[0.4em] opacity-75">
          {props.eyebrow}
        </p>
        <h1 class="mt-5 text-5xl font-black tracking-tight text-white">
          {props.title}
        </h1>
        <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-200/80">
          {props.description}
        </p>
      </div>
      {props.children}
    </section>
  );
};
