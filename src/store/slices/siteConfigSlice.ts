import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PromotionalReel } from '../../types/promotional';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HeroSlide {
  image: string;
  heading: string;
  subtext: string;
  tag?: string;
}

export interface HeroConfig {
  title: string;
  subtitle?: string;
  slides: HeroSlide[];
}

export interface FeaturedSectionConfig {
  enabled: boolean;
  take: number;
}

export interface AnimationConfig {
  enabled: boolean;
  parallax: boolean;
  scrollReveal: boolean;
}

export interface ParallaxSectionConfig {
  title: string;
  bgImage: string;
  fgImage: string;
  text?: string;
  cta?: { text: string; href: string };
}

export interface StoreOwnerConfig {
  name: string;
  email: string;
  phone: string;
}

export interface StatsItem {
  label: string;
  value: string;
}

export interface CategoryItem {
  label: string;
  path: string;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon: string;
}

export interface NavbarConfig {
  searchPlaceholder: string;
  searchPlaceholderMobile: string;
  categoryDropdownLabel: string;
}

export interface SiteConfig {
  shopName: string;
  hero: HeroConfig;
  featured: FeaturedSectionConfig;
  faq: FAQItem[];
  animations: AnimationConfig;
  reels: PromotionalReel[];
  parallax: ParallaxSectionConfig[];
  storeOwner?: StoreOwnerConfig;
  stats?: StatsItem[];
  categories?: CategoryItem[];
  navigation?: NavigationItem[];
  navbar?: NavbarConfig;
}

const defaultConfig: SiteConfig = {
  shopName: 'Minimal Commerce',
  hero: {
    title: 'Modern Essentials',
    subtitle: 'Timeless pieces for everyday',
    slides: [],
  },
  featured: {
    enabled: true,
    take: 3,
  },
  faq: [],
  animations: {
    enabled: true,
    parallax: true,
    scrollReveal: true,
  },
  reels: [],
  parallax: [],
  storeOwner: { name: '', email: '', phone: '' },
  stats: [],
  categories: [],
  navigation: [],
  navbar: {
    searchPlaceholder: 'Search products...',
    searchPlaceholderMobile: 'Search...',
    categoryDropdownLabel: 'All',
  },
};

interface SiteConfigState {
  config: SiteConfig;
}

const initialState: SiteConfigState = {
  config: defaultConfig,
};

const siteConfigSlice = createSlice({
  name: 'siteConfig',
  initialState,
  reducers: {
    setConfig(state, action: PayloadAction<SiteConfig>) {
      state.config = action.payload as SiteConfig;
    },
    updateConfig(state, action: PayloadAction<Partial<SiteConfig>>) {
      state.config = { ...state.config, ...action.payload } as SiteConfig;
    },
  },
});

export const { setConfig, updateConfig } = siteConfigSlice.actions;
export default siteConfigSlice.reducer; 