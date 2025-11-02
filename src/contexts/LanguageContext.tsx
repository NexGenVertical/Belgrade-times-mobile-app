import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'sr' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, defaultValue?: string) => string;
  tInterpolated: (key: string, values?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  sr: {
    // Header
    'header.tagline': 'Independent News Source',
    'header.breaking': 'Važne vesti i ažuriranja',
    'header.login': 'Prijavi se',
    'header.register': 'Registruj se',
    'header.logout': 'Odjavi se',
    'header.welcome': 'Dobrodošli',
    
    // Navigation
    'nav.home': 'Početna',
    'nav.categories': 'Kategorije',
    'nav.latest': 'Najnovije',
    'nav.about': 'O nama',
    'nav.contact': 'Kontakt',
    'nav.admin': 'Admin Panel',
    'nav.search': 'Pretraživanje',
    
    // Categories
    'cat.politika': 'Politika',
    'cat.biznis': 'Ekonomija',
    'cat.sport': 'Sport',
    'cat.tehnologija': 'Tehnologija',
    'cat.kultura': 'Kultura',
    'cat.zdravlje': 'Zdravlje',
    'cat.lokalni-beograd': 'Lokalni Beograd',
    'cat.medunarodni': 'Međunarodni',
    'cat.zivotna-sredina': 'Životna sredina',
    'cat.obrazovanje': 'Obrazovanje',
    'cat.general': 'Opšte',
    'cat.description.politika': 'Političke vesti i analiza',
    'cat.description.biznis': 'Ekonomske vesti i analiza',
    'cat.description.sport': 'Sportske vesti i rezultati',
    'cat.description.tehnologija': 'Tehnološke inovacije i vesti',
    'cat.description.kultura': 'Kulturne vesti i dešavanja',
    'cat.description.zdravlje': 'Zdravstvene vesti i saveti',
    'cat.description.lokalni-beograd': 'Lokalne vesti iz Beograda',
    'cat.description.medunarodni': 'Međunarodne vesti i dešavanja',
    'cat.description.zivotna-sredina': 'Vestiti o životnoj sredini',
    'cat.description.obrazovanje': 'Obrazovne vesti i dešavanja',
    'cat.description.general': 'Opšte vesti i dešavanja',
    
    // Article
    'article.readMore': 'Pročitaj više',
    'article.readingTime': 'min čitanja',
    'article.by': 'od',
    
    // Footer
    'footer.about': 'O nama',
    'footer.contact': 'Kontakt',
    'footer.address': 'Beograd, Srbija',
    'footer.phone': '+381 11 123 4567',
    'footer.email': 'kontakt@belgradetimes.com',
    'footer.mission': 'Pružamo nepristrasne i istinite vesti za bolju informisanost građana.',
    'footer.coverage': 'Lokalne i međunarodne vesti 24/7.',
    'footer.links': 'Linkovi',
    'footer.privacy': 'Privatnost',
    'footer.terms': 'Uslovi korišćenja',
    'footer.cookies': 'Politika kolačića',
    'footer.sitemap': 'Mapa sajta',
    'footer.newsletter': 'Prijavite se na newsletter',
    'footer.newsletterPlaceholder': 'Unesite vašu email adresu',
    'footer.subscribe': 'Prijavite se',
    'footer.award': 'Dobitnik nagrade za najbolji digitalni medij 2024.',
    'footer.allRights': 'Sva prava zadržana.',
    
    // Auth
    'auth.loginTitle': 'Prijavite se',
    'auth.registerTitle': 'Registrujte se',
    'auth.email': 'Email',
    'auth.password': 'Lozinka',
    'auth.fullName': 'Puno ime',
    'auth.confirmPassword': 'Potvrdite lozinku',
    'auth.loginButton': 'Prijavite se',
    'auth.registerButton': 'Registrujte se',
    'auth.noAccount': 'Nemate nalog?',
    'auth.haveAccount': 'Već imate nalog?',
    'auth.registerLink': 'Registrujte se',
    'auth.loginLink': 'Prijavite se',
    
    // Search
    'search.placeholder': 'Pretražite vesti...',
    'search.title': 'Pretraživanje',
    'search.subtitle': 'Unesite pojam za pretraživanje kroz naše vesti',
    'search.noResults': 'Nema rezultata',
    'search.noResultsDesc': 'Nema pronađenih članaka za "{query}"',
    'search.resultsFor': 'Rezultati za "{query}"',
    'search.foundResults': 'Pronađeno {count} rezultata',
    'search.category': 'Kategorija',
    'search.allCategories': 'Sve kategorije',
    'search.dateRange': 'Vremenski period',
    'search.anyTime': 'Bilo koje vreme',
    'search.pastWeek': 'Poslednja nedelja',
    'search.pastMonth': 'Poslednji mesec',
    'search.past3Months': 'Poslednja 3 meseca',
    'search.pastYear': 'Poslednja godina',
    'search.sortBy': 'Sortiraj po',
    'search.newestFirst': 'Najnovije prvo',
    'search.oldestFirst': 'Najstarije prvo',
    'search.titleAZ': 'Naslov A-Z',
    'search.relevance': 'Relevantnost',
    'search.pageOfTotal': 'Strana {current} od {total}',
    
    // Category
    'category.articles': 'Članci u ovoj kategoriji',
    'category.noArticles': 'Nema članaka u ovoj kategoriji',
    'category.noArticlesDesc': 'Uskoro ćete moći da pronađete članke u ovoj kategoriji.',
    
    // Cookie
    'cookie.message': 'Koristimo kolačiće za poboljšanje vašeg iskustva.',
    'cookie.accept': 'Prihvati sve',
    'cookie.reject': 'Odbij sve',
    'cookie.customize': 'Prilagodi',
    
    // Home page
    'home.featuredStories': 'Izdvojene priče',
    'home.latestArticles': 'Najnoviji članci',
    'home.latest': 'Najnovije',
    'home.popular': 'Popularno',
    'home.byCategory': 'Po kategoriji',
    'home.searchResults': 'Rezultati pretraživanja',
    'home.noArticlesFound': 'Nema pronađenih članaka',
    'home.clearFilters': 'Ukloni filtere',
    
    // Category navigation
    'category.categories': 'Kategorije',
    'category.all': 'Sve',
    'category.allCategories': 'Sve kategorije',
    'category.noCategories': 'Nema dostupnih kategorija',
    'category.noCategoriesDesc': 'Kategorije će uskoro biti dostupne.',
    
    // Search controls
    'search.searchArticles': 'Pretražite članke...',
    'search.sortLatest': 'Najnovije',
    'search.sortPopular': 'Popularno',
    'search.sortCategory': 'Po kategoriji',
    'search.gridView': 'Pregled u mreži',
    'search.listView': 'Lista',
    
    // Common
    'common.loading': 'Učitavanje...',
    'common.error': 'Greška',
    'common.errorDesc': 'Došlo je do greške. Molimo pokušajte ponovo.',
    'common.close': 'Zatvori',
    'common.menu': 'Meni',
    'common.backToHome': 'Nazad na početnu',
    'common.backToCategories': 'Nazad na kategorije',
    'common.previous': 'Prethodna',
    'common.next': 'Sledeća',
    'common.article': 'članak',
    'common.articles': 'članaka',
    'common.oneArticle': '1 članak',
    'common.articlesCount': '{count} članaka',
  },
  en: {
    // Header
    'header.tagline': 'Independent News Source',
    'header.breaking': 'Breaking News & Updates',
    'header.login': 'Login',
    'header.register': 'Register',
    'header.logout': 'Logout',
    'header.welcome': 'Welcome',
    
    // Navigation
    'nav.home': 'Home',
    'nav.categories': 'Categories',
    'nav.latest': 'Latest',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.admin': 'Admin Panel',
    'nav.search': 'Search',
    
    // Categories
    'cat.politika': 'Politics',
    'cat.biznis': 'Economics',
    'cat.sport': 'Sports',
    'cat.tehnologija': 'Technology',
    'cat.kultura': 'Culture',
    'cat.zdravlje': 'Health',
    'cat.lokalni-beograd': 'Local Belgrade',
    'cat.medunarodni': 'International',
    'cat.zivotna-sredina': 'Environment',
    'cat.obrazovanje': 'Education',
    'cat.general': 'General',
    'cat.description.politika': 'Political news and analysis',
    'cat.description.biznis': 'Economic news and analysis',
    'cat.description.sport': 'Sports news and results',
    'cat.description.tehnologija': 'Technology innovations and news',
    'cat.description.kultura': 'Cultural news and events',
    'cat.description.zdravlje': 'Health news and advice',
    'cat.description.lokalni-beograd': 'Local news from Belgrade',
    'cat.description.medunarodni': 'International news and events',
    'cat.description.zivotna-sredina': 'Environmental news and issues',
    'cat.description.obrazovanje': 'Education news and developments',
    'cat.description.general': 'General news and updates',
    
    // Article
    'article.readMore': 'Read more',
    'article.readingTime': 'min read',
    'article.by': 'by',
    
    // Footer
    'footer.about': 'About Us',
    'footer.contact': 'Contact',
    'footer.address': 'Belgrade, Serbia',
    'footer.phone': '+381 11 123 4567',
    'footer.email': 'contact@belgradetimes.com',
    'footer.mission': 'We provide unbiased and truthful news for better citizen awareness.',
    'footer.coverage': 'Local and international news 24/7.',
    'footer.links': 'Links',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.cookies': 'Cookie Policy',
    'footer.sitemap': 'Site Map',
    'footer.newsletter': 'Subscribe to Newsletter',
    'footer.newsletterPlaceholder': 'Enter your email address',
    'footer.subscribe': 'Subscribe',
    'footer.award': 'Winner of the Best Digital Media Award 2024.',
    'footer.allRights': 'All rights reserved.',
    
    // Auth
    'auth.loginTitle': 'Login',
    'auth.registerTitle': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.loginButton': 'Login',
    'auth.registerButton': 'Register',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.registerLink': 'Register',
    'auth.loginLink': 'Login',
    
    // Search
    'search.placeholder': 'Search news...',
    'search.title': 'Search',
    'search.subtitle': 'Enter a search term to find articles',
    'search.noResults': 'No results found',
    'search.noResultsDesc': 'No articles found for "{query}"',
    'search.resultsFor': 'Results for "{query}"',
    'search.foundResults': 'Found {count} results',
    'search.category': 'Category',
    'search.allCategories': 'All categories',
    'search.dateRange': 'Date range',
    'search.anyTime': 'Any time',
    'search.pastWeek': 'Past week',
    'search.pastMonth': 'Past month',
    'search.past3Months': 'Past 3 months',
    'search.pastYear': 'Past year',
    'search.sortBy': 'Sort by',
    'search.newestFirst': 'Newest first',
    'search.oldestFirst': 'Oldest first',
    'search.titleAZ': 'Title A-Z',
    'search.relevance': 'Relevance',
    'search.pageOfTotal': 'Page {current} of {total}',
    
    // Category
    'category.articles': 'Articles in this category',
    'category.noArticles': 'No articles in this category',
    'category.noArticlesDesc': 'You will be able to find articles in this category soon.',
    'category.noCategories': 'No categories available',
    'category.noCategoriesDesc': 'Categories will be available soon.',
    
    // Cookie
    'cookie.message': 'We use cookies to improve your experience.',
    'cookie.accept': 'Accept All',
    'cookie.reject': 'Reject All',
    'cookie.customize': 'Customize',
    
    // Home page
    'home.featuredStories': 'Featured Stories',
    'home.latestArticles': 'Latest Articles',
    'home.latest': 'Latest',
    'home.popular': 'Popular',
    'home.byCategory': 'By Category',
    'home.searchResults': 'Search Results',
    'home.noArticlesFound': 'No articles found',
    'home.clearFilters': 'Clear filters',
    
    // Category navigation
    'category.categories': 'Categories',
    'category.all': 'All',
    'category.allCategories': 'All Categories',
    
    // Search controls
    'search.searchArticles': 'Search articles...',
    'search.sortLatest': 'Latest',
    'search.sortPopular': 'Popular',
    'search.sortCategory': 'By Category',
    'search.gridView': 'Grid view',
    'search.listView': 'List view',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.errorDesc': 'An error occurred. Please try again.',
    'common.close': 'Close',
    'common.menu': 'Menu',
    'common.backToHome': 'Back to home',
    'common.backToCategories': 'Back to categories',
    'common.previous': 'Previous',
    'common.next': 'Next',
    'common.article': 'article',
    'common.articles': 'articles',
    'common.oneArticle': '1 article',
    'common.articlesCount': '{count} articles',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'sr') ? saved : 'sr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'sr' ? 'en' : 'sr');
  };

  const t = (key: string, defaultValue?: string): string => {
    const translation = translations[language][key as keyof typeof translations.sr];
    return translation || defaultValue || key;
  };

  const tInterpolated = (key: string, options?: { fallback?: string, [key: string]: string | number | undefined }): string => {
    let str = translations[language][key as keyof typeof translations.sr];
    
    // Use fallback if translation doesn't exist
    if (!str) {
      return options?.fallback || key;
    }
    
    // Replace placeholders
    if (options && 'fallback' in options) {
      const { fallback, ...values } = options;
      Object.keys(values).forEach(param => {
        if (param !== 'fallback') {
          str = str.replace(new RegExp(`\\{${param}\\}`, 'g'), String(values[param]));
        }
      });
    }
    
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, tInterpolated }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
