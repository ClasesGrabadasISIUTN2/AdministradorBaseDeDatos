export type ThemeId = 'slate' | 'nordic' | 'obsidian' | 'crimson' | 'titanium' | 'sunset';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: 'Oscuro' | 'Claro' | 'Especial';
  badge: string;
  description: string;
  colors: {
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'slate',
    name: 'Oscuro Slate',
    category: 'Oscuro',
    badge: 'Por Defecto',
    description: 'El tema original: modo nocturno balanceado con azul cobalto.',
    colors: {
      bg: '#020617',
      card: '#0f172a',
      accent: '#2563eb',
      text: '#f1f5f9',
    },
  },
  {
    id: 'nordic',
    name: 'Nórdico Hielo',
    category: 'Claro',
    badge: 'Minimalista',
    description: 'Porcelana escandinava de alta claridad y azul ártico nítido.',
    colors: {
      bg: '#f3f6f9',
      card: '#ffffff',
      accent: '#0284c7',
      text: '#0f172a',
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidiana Oro',
    category: 'Oscuro',
    badge: 'Lujo',
    description: 'Negro carbón profundo y contraste con oro champán radiante.',
    colors: {
      bg: '#08080a',
      card: '#121216',
      accent: '#f59e0b',
      text: '#fbfbfd',
    },
  },
  {
    id: 'crimson',
    name: 'Carmesí Royale',
    category: 'Oscuro',
    badge: 'Editorial',
    description: 'Borgoña aterciopelado con acentos rubí y rosa cálido.',
    colors: {
      bg: '#0d070b',
      card: '#160e14',
      accent: '#f43f5e',
      text: '#fdf2f8',
    },
  },
  {
    id: 'titanium',
    name: 'Titanio Pro',
    category: 'Oscuro',
    badge: 'Tecnológico',
    description: 'Acero titanio mate de precisión con cian eléctrico de alta gama.',
    colors: {
      bg: '#0a0d12',
      card: '#111620',
      accent: '#06b6d4',
      text: '#f3f7fc',
    },
  },
  {
    id: 'sunset',
    name: 'Atardecer Crepúsculo',
    category: 'Especial',
    badge: 'Calidez',
    description: 'Índigo crepuscular profundo con degradado ámbar y coral cálido.',
    colors: {
      bg: '#0c0916',
      card: '#151024',
      accent: '#f97316',
      text: '#faf7fd',
    },
  },
];

const STORAGE_KEY = 'utn_app_theme';

export function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return 'slate';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId;
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch (e) {
    // LocalStorage might be restricted
  }
  return 'slate';
}

export function applyTheme(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);
  if (document.body) {
    document.body.setAttribute('data-theme', themeId);
  }
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch (e) {
    // ignore
  }
}

export function getNextTheme(currentId: ThemeId): ThemeId {
  const currentIndex = THEMES.findIndex((t) => t.id === currentId);
  if (currentIndex === -1) return THEMES[0].id;
  const nextIndex = (currentIndex + 1) % THEMES.length;
  return THEMES[nextIndex].id;
}
