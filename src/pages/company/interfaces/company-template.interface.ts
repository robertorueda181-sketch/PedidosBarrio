import { SafeResourceUrl } from '@angular/platform-browser';

export interface CompanyCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CompanyTemplateStyles {
  bannerColor: string;
  textColor: string;
  fontFamily: string;
  mutedTextColor?: string;
}

export interface CompanyGalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface CompanyVideoCard {
  title: string;
  description?: string;
  rawUrl: string;
  safeUrl: SafeResourceUrl;
  thumbnail?: string;
}

export interface CompanyBannerSection {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  badge?: string;
}

export interface CompanyImageSection {
  id: string;
  title: string;
  description?: string;
  images: CompanyGalleryImage[];
}

export interface CompanyVideoSection {
  id: string;
  title: string;
  description?: string;
  videos: CompanyVideoCard[];
}
