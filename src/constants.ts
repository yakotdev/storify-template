export interface Product {
  id: string;
  name: string;
  description?: string;
  image: string;
  images?: string[];
  price: number;
  compareAtPrice?: number;
  category: string;
  categoryId?: string;
  categories?: Array<{ id: string; name?: string; slug?: string }>;
  status?: string;
  stock?: number;
  isNew?: boolean;
  isSale?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  count?: number;
  productCount?: number;
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'كرسي أوربيتال',
    price: 450,
    compareAtPrice: 600,
    category: 'أثاث',
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1000',
    isNew: true,
    isSale: true
  },
  {
    id: '2',
    name: 'مصباح السقف المعماري',
    price: 280,
    category: 'إضاءة',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=1000',
    isNew: true
  },
  {
    id: '3',
    name: 'طاولة جانبية بسيطة',
    price: 320,
    category: 'أثاث',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '4',
    name: 'مزهرية سيراميك خام',
    price: 120,
    category: 'ديكور',
    image: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '5',
    name: 'أريكة مودولار',
    price: 1800,
    category: 'أثاث',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '6',
    name: 'مصباح أرضي منحوت',
    price: 550,
    category: 'إضاءة',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '7',
    name: 'لوحة فنية تجريدية',
    price: 950,
    category: 'فن',
    image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '8',
    name: 'سجادة صوف يدوية',
    price: 1200,
    category: 'ديكور',
    image: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&q=80&w=1000'
  }
];

export const CATEGORIES: Category[] = [
  { id: '1', name: 'أثاث', slug: 'furniture', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1000', count: 24 },
  { id: '2', name: 'إضاءة', slug: 'lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=1000', count: 18 },
  { id: '3', name: 'ديكور', slug: 'decor', image: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&q=80&w=1000', count: 42 },
  { id: '4', name: 'فن', slug: 'art', image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1000', count: 12 }
];

export interface SlideData {
  id: number;
  url: string;
  title: string;
  description: string;
}

export const SLIDES: SlideData[] = [
  {
    id: 1,
    url: "https://picsum.photos/seed/slide1/1200/800",
    title: "جمال الطبيعة",
    description: "استكشف المناظر الطبيعية الخلابة من جميع أنحاء العالم."
  },
  {
    id: 2,
    url: "https://picsum.photos/seed/slide2/1200/800",
    title: "العمارة الحديثة",
    description: "تصاميم هندسية مبتكرة تعكس روح العصر."
  },
  {
    id: 3,
    url: "https://picsum.photos/seed/slide3/1200/800",
    title: "أضواء المدينة",
    description: "سحر المدن في الليل تحت الأضواء المتلألئة."
  },
  {
    id: 4,
    url: "https://picsum.photos/seed/slide4/1200/800",
    title: "هدوء البحر",
    description: "استرخِ مع أمواج البحر الهادئة والرمال الذهبية."
  },
  {
    id: 5,
    url: "https://picsum.photos/seed/slide5/1200/800",
    title: "عالم المغامرة",
    description: "انطلق في رحلة لا تُنسى في أعماق الغابات."
  }
];
