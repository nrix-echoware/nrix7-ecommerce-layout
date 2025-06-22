
# Ethereal - Minimal Luxury eCommerce

A beautifully animated eCommerce frontend application built with React, GSAP, and anime.js, featuring minimal design and delightful motion effects inspired by modern luxury brands.

## ✨ Features

- **Smooth Animations**: GSAP and anime.js powered transitions and micro-interactions
- **Minimal Design**: Clean, elegant UI inspired by luxury design principles
- **Responsive**: Mobile-first design that works on all devices
- **State Management**: Redux Toolkit for centralized state management
- **Mock Products**: 100 curated products across fashion and electronics
- **Shopping Cart**: Animated cart overlay with real-time updates
- **Loading Experience**: Morphing SVG loading screen
- **Scroll Animations**: ScrollTrigger-powered reveal animations
- **Page Transitions**: Smooth route transitions with GSAP
- **Product Filtering**: Animated category filtering
- **Hover Effects**: Subtle hover animations throughout

## 🛠 Technologies

- **Frontend**: React 18, TypeScript
- **Animations**: GSAP, anime.js, ScrollTrigger
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6
- **Build Tool**: Vite
- **UI Components**: shadcn/ui

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ethereal-ecommerce
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:8080`

## 📱 Pages

- **Home**: Hero section with floating elements and featured products
- **Products**: Filterable product grid with staggered animations
- **Product Detail**: Animated product showcase with morphing transitions
- **Cart**: Slide-out cart overlay with smooth animations

## 🎨 Design System

### Colors
- **Background**: Pure white (#FFFFFF)
- **Foreground**: Deep black (#0F0F0F)
- **Muted**: Light gray variations for subtle elements
- **Accent**: Minimal use of color for emphasis

### Typography
- **Primary**: Inter (body text, clean and readable)
- **Display**: Playfair Display (headings, elegant serif)

### Animations
- **Page Transitions**: Fade + slide effects
- **Product Cards**: Staggered reveal with hover scaling
- **Cart**: Slide-in from right with backdrop blur
- **Loading**: SVG path morphing with GSAP timeline
- **Scroll**: Parallax and reveal animations

## 🔧 Animation Controller

The `AnimationController` class provides centralized animation management:

```typescript
// Page transitions
AnimationController.pageTransition(element, 'in');

// Staggered reveals
AnimationController.staggerFadeIn(elements, 0.1);

// Scroll-triggered animations
AnimationController.scrollReveal(element);

// Hover effects
AnimationController.hoverScale(element);
```

## 📦 State Management

### Products Slice
- Product catalog management
- Category filtering
- Selected product state

### Cart Slice
- Add/remove items
- Quantity management
- Cart overlay state
- Total calculation

### UI Slice
- Loading states
- Navigation state
- Animation triggers

## 🎭 Key Animations

1. **Loading Screen**: SVG stroke animations with anime.js
2. **Hero Section**: Staggered text reveals and floating elements
3. **Product Grid**: ScrollTrigger reveals with stagger
4. **Navigation**: Scroll-based background morphing
5. **Cart**: Slide transitions with backdrop effects
6. **Product Cards**: Hover scaling and image overlays

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactions
- Optimized animations for mobile performance

## 🔮 Future Enhancements

- User authentication
- Payment integration
- Product reviews
- Wishlist functionality
- Advanced filtering
- Search functionality
- Product recommendations
- Dark mode toggle

## 💡 Performance Considerations

- Lazy loading for images
- Animation cleanup on unmount
- Optimized bundle splitting
- Reduced motion for accessibility
- Efficient Redux state updates

## 🎨 Inspiration

Design inspired by minimal luxury brands and modern eCommerce experiences, focusing on:
- Negative space utilization
- Subtle motion design
- Typography hierarchy
- Clean product photography
- Intuitive user flows

## 📄 License

This project is for demonstration purposes. All product images are sourced from Picsum for placeholder use.

---

Built with ❤️ using React, GSAP, and modern web technologies.
