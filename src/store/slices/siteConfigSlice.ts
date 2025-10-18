import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PromotionalReel } from '../../types/promotional';
import { TimelineConfigEntry } from '../../types/timeline';

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

export interface LoaderConfig {
  duration: number;
  particleCount: number;
  animationSpeed: number;
  name: string;
  description: string;
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

export interface ContactHeroConfig {
  title: string;
  subtitle: string;
}

export interface ContactStoreAddress {
  street: string;
  city: string;
  country: string;
}

export interface ContactStoreHours {
  weekdays: string;
  weekend: string;
}

export interface ContactMapOverlay {
  title: string;
  description: string;
  hours: string;
}

export interface ContactMapConfig {
  enabled: boolean;
  type?: string;
  embedUrl?: string;
  linkUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  placeholder: string;
  description: string;
  overlay: ContactMapOverlay;
}

export interface ContactStoreConfig {
  name: string;
  address: ContactStoreAddress;
  phones: string[];
  emails: string[];
  hours: ContactStoreHours;
  map: ContactMapConfig;
}

export interface ContactFormField {
  label: string;
  placeholder: string;
  required: boolean;
  rows?: number;
}

export interface ContactFormFields {
  name: ContactFormField;
  email: ContactFormField;
  phone: ContactFormField;
  type: ContactFormField;
  message: ContactFormField;
}

export interface ContactFormSubmit {
  text: string;
  sending: string;
}

export interface ContactFormConfig {
  title: string;
  types: { value: string; label: string }[];
  fields: ContactFormFields;
  submit: ContactFormSubmit;
}

export interface ContactStoreInfoSection {
  icon: string;
  title: string;
  details: string[];
}

export interface ContactStoreInfoConfig {
  title: string;
  sections: ContactStoreInfoSection[];
}

export interface ContactConfig {
  hero: ContactHeroConfig;
  store: ContactStoreConfig;
  form: ContactFormConfig;
  storeInfo: ContactStoreInfoConfig;
}

export interface JourneyConfig {
  title: string;
  subtitle: string;
  entries: TimelineConfigEntry[];
}

export interface SiteConfig {
  shopName: string;
  hero: HeroConfig;
  featured: FeaturedSectionConfig;
  faq: FAQItem[];
  animations: AnimationConfig;
  loader: LoaderConfig;
  reels: PromotionalReel[];
  parallax: ParallaxSectionConfig[];
  storeOwner?: StoreOwnerConfig;
  stats?: StatsItem[];
  categories?: CategoryItem[];
  navigation?: NavigationItem[];
  navbar?: NavbarConfig;
  contact?: ContactConfig;
  journey?: JourneyConfig;
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
  loader: {
    duration: 4.5,
    particleCount: 15,
    animationSpeed: 1.2,
    name: '',
    description: ''
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