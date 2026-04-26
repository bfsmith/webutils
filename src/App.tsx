import { A, Route, Router } from '@solidjs/router';
import {
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  type Component,
  type JSX,
} from 'solid-js';

import PdfMergePage from './PdfMergePage';
import './starfield.js';
import { accentClasses, type UtilityAccent, UtilityPage } from './UtilityPage';

type StarfieldApi = {
  setup: (config: {
    container: HTMLElement;
    starColor: string;
    canvasColor: string;
    hueJitter: number;
    trailLength: number;
    baseSpeed: number;
    maxAcceleration: number;
    accelerationRate: number;
    decelerationRate: number;
    minSpawnRadius: number;
    maxSpawnRadius: number;
    auto: boolean;
  }) => void;
  cleanup: () => void;
};

declare global {
  interface Window {
    Starfield?: StarfieldApi;
  }
}

type Utility = {
  title: string;
  href: string;
  description: string;
  accent: UtilityAccent;
  status: string;
};

const utilities: Utility[] = [
  {
    title: 'PDF Merge',
    href: '/pdf-merge',
    description:
      'Combine multiple PDFs into a single cockpit-ready download queue.',
    accent: 'blue',
    status: 'Ready',
  },
  {
    title: 'VTT Converter',
    href: '/vtt-converter',
    description:
      'Transform caption files into readable, color-coded transcripts.',
    accent: 'green',
    status: 'Placeholder',
  },
];

const App: Component = () => {
  return (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route
        path="/pdf-merge"
        component={PdfMergePage}
      />
      <Route
        path="/vtt-converter"
        component={() => (
          <UtilityPage
            title="VTT Converter"
            eyebrow="Transcript utility"
            accent="green"
            description="A focused workspace for loading .vtt files and rendering speaker-friendly transcripts will live here."
          >
            <div />
          </UtilityPage>
        )}
      />
    </Router>
  );
};

const Layout: Component<{ children?: JSX.Element }> = (props) => {
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);
  let starfieldContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!starfieldContainer || !window.Starfield) {
      return;
    }

    window.Starfield.setup({
      container: starfieldContainer,
      starColor: 'rgb(255, 255, 255)',
      canvasColor: 'rgb(0, 0, 0)',
      hueJitter: 0,
      trailLength: 0.45,
      baseSpeed: 1,
      maxAcceleration: 2,
      accelerationRate: 0.05,
      decelerationRate: 0.05,
      minSpawnRadius: 80,
      maxSpawnRadius: 500,
      auto: false,
    });
  });

  onCleanup(() => {
    window.Starfield?.cleanup();
  });

  return (
    <div class="min-h-screen overflow-hidden text-slate-100">
      <div
        ref={starfieldContainer}
        class="starfield pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />
      <div class="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header class="glass-nav z-30 mb-10 px-5 py-4">
          <nav class="relative flex w-full items-center justify-between gap-3 text-sm font-medium text-slate-300">
            <A href="/" class="nav-link" activeClass="nav-link-active" end>
              Home
            </A>
            <button
              type="button"
              class="nav-link inline-flex size-11 items-center justify-center p-0 sm:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen()}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span class="flex flex-col gap-1.5">
                <span class="block h-0.5 w-5 rounded-full bg-current" />
                <span class="block h-0.5 w-5 rounded-full bg-current" />
                <span class="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
            <div class="hidden flex-wrap justify-end gap-3 sm:flex">
              <UtilityLinks onNavigate={() => setIsMenuOpen(false)} />
            </div>
            <Show when={isMenuOpen()}>
              <div class="absolute right-0 top-[calc(100%+0.75rem)] z-50 grid min-w-56 gap-2 rounded-3xl border border-white/15 bg-slate-950 p-3 shadow-2xl sm:hidden">
                <UtilityLinks
                  linkClass="nav-link bg-slate-900"
                  onNavigate={() => setIsMenuOpen(false)}
                />
              </div>
            </Show>
          </nav>
        </header>

        <main class="flex-1">{props.children}</main>
      </div>
    </div>
  );
};

const UtilityLinks: Component<{ linkClass?: string; onNavigate: () => void }> = (
  props,
) => {
  return (
    <For each={utilities}>
      {(utility) => (
        <A
          href={utility.href}
          class={props.linkClass ?? 'nav-link'}
          activeClass="nav-link-active"
          onClick={props.onNavigate}
        >
          {utility.title}
        </A>
      )}
    </For>
  );
};

const Home: Component = () => {
  return (
    <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <section class="space-y-8">
        <div class="glass-panel p-8 sm:p-10">
          <p class="text-sm font-semibold uppercase tracking-[0.45em] text-sky-200/80">
            Browser utilities
          </p>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A small set of privacy focused utilities where the data never leaves your device.
          </p>
        </div>
      </section>

      <section class="grid gap-5">
        <For each={utilities}>
          {(utility) => <UtilityCard utility={utility} />}
        </For>
      </section>
    </div>
  );
};

const UtilityCard: Component<{ utility: Utility }> = (props) => {
  return (
    <A
      href={props.utility.href}
      class={`glass-card group block border bg-gradient-to-br ${accentClasses[props.utility.accent]}`}
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.35em] opacity-75">
          {props.utility.status}
        </p>
        <h2 class="mt-4 text-3xl font-bold text-white">
          {props.utility.title}
        </h2>
      </div>
      <p class="mt-5 max-w-xl text-base leading-7 text-slate-200/80">
        {props.utility.description}
      </p>
    </A>
  );
};

export default App;
