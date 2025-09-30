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

export interface SiteConfig {
  shopName: string;
  hero: HeroConfig;
  featured: FeaturedSectionConfig;
  faq: FAQItem[];
  animations: AnimationConfig;
  reels: PromotionalReel[];
  parallax: ParallaxSectionConfig[];
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
      state.config = action.payload;
    },
    updateConfig(state, action: PayloadAction<Partial<SiteConfig>>) {
      state.config = { ...state.config, ...action.payload } as SiteConfig;
    },
  },
});

export const { setConfig, updateConfig } = siteConfigSlice.actions;
export default siteConfigSlice.reducer; 