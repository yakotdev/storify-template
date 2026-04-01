import React from 'react';
import { useThemeConfig, LayoutSection } from './ThemeContext';

// Import real sections
import HeaderSection from './sections/HeaderSection';
import HeroSliderSection from './sections/HeroSliderSection';
import FeaturedProductsSection from './sections/FeaturedProductsSection';
import CategoriesSection from './sections/CategoriesSection';
import NewsletterSection from './sections/NewsletterSection';
import FooterSection from './sections/FooterSection';
import EmptyStateSection from './sections/EmptyStateSection';
import ProductDetailsSettingsSection from './sections/ProductDetailsSettingsSection';
import ShopPageSection from './sections/ShopPageSection';
import AboutPageSection from './sections/AboutPageSection';
import ContactPageSection from './sections/ContactPageSection';
import WishlistPageSection from './sections/WishlistPageSection';
import TrackOrderPageSection from './sections/TrackOrderPageSection';
import ProfilePageSection from './sections/ProfilePageSection';
import PolicyPageSection from './sections/PolicyPageSection';
import ProductReviewsSection from './sections/ProductReviewsSection';

const SECTION_MAP: Record<string, React.FC<{ section: LayoutSection }>> = {
  HEADER: HeaderSection,
  HERO_SLIDER: HeroSliderSection,
  FEATURED_PRODUCTS: FeaturedProductsSection,
  CATEGORIES: CategoriesSection,
  NEWSLETTER: NewsletterSection,
  EMPTY_STATE: EmptyStateSection,
  PRODUCT_DETAILS_SETTINGS: ProductDetailsSettingsSection,
  PRODUCT_REVIEWS: ProductReviewsSection,
  SHOP_PAGE: ShopPageSection,
  ABOUT_PAGE: AboutPageSection,
  CONTACT_PAGE: ContactPageSection,
  WISHLIST_PAGE: WishlistPageSection,
  TRACK_ORDER_PAGE: TrackOrderPageSection,
  PROFILE_PAGE: ProfilePageSection,
  POLICY_PAGE: PolicyPageSection,
  FOOTER: FooterSection,
};

const normalizeSectionToken = (value: unknown) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_');

export const SectionRenderer: React.FC = () => {
  const { layout } = useThemeConfig();

  // Sort layout by group order: header -> template -> footer
  const sortedLayout = [...layout].sort((a, b) => {
    const groupOrder = { header_group: 0, template_group: 1, overlay_group: 2, footer_group: 3 };
    const orderA = groupOrder[a.group as keyof typeof groupOrder] ?? 1;
    const orderB = groupOrder[b.group as keyof typeof groupOrder] ?? 1;
    if (orderA !== orderB) return orderA - orderB;
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <div className="flex flex-col min-h-screen">
      {sortedLayout.map((section) => {
        if (!section.enabled) return null;
        
        const candidates = [
          normalizeSectionToken(section.type),
          normalizeSectionToken(section.id),
        ].filter(Boolean);
        const resolvedType = candidates.find((token) => SECTION_MAP[token]);
        const Component = resolvedType ? SECTION_MAP[resolvedType] : undefined;
        
        if (!Component) {
          console.warn(`Section type "${section.type || section.id}" not found in SECTION_MAP`);
          return null;
        }
        
        return <Component key={section.id} section={{ ...section, type: resolvedType }} />;
      })}
    </div>
  );
};
