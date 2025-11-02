import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { CategoryPage } from './pages/CategoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ArticlePage } from './pages/ArticlePage';
import { LatestPage } from './pages/LatestPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import { ArticlesManagementPage } from './pages/ArticlesManagementPage';
import { CreateArticlePage } from './pages/CreateArticlePage';
import { EditArticlePage } from './pages/EditArticlePage';
import { AdvertisementManagementPage } from './pages/AdvertisementManagementPage';
import { CreateAdvertisementPage } from './pages/CreateAdvertisementPage';
import { EditAdvertisementPage } from './pages/EditAdvertisementPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { CreateUserPage } from './pages/CreateUserPage';
import { EditUserPage } from './pages/EditUserPage';
import { CategoriesManagementPage } from './pages/CategoriesManagementPage';
import { CreateCategoryPage } from './pages/CreateCategoryPage';
import { EditCategoryPage } from './pages/EditCategoryPage';
import { BreakingNewsPage } from './pages/BreakingNewsPage';
import { CommentsManagementPage } from './pages/CommentsManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SiteContentManagementPage } from './pages/SiteContentManagementPage';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/article/:slug" element={<ArticlePage />} />
                <Route path="/latest" element={<LatestPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/articles" element={<ArticlesManagementPage />} />
                <Route path="/admin/articles/create" element={<CreateArticlePage />} />
                <Route path="/admin/articles/edit/:id" element={<EditArticlePage />} />
                <Route path="/admin/ads" element={<AdvertisementManagementPage />} />
                <Route path="/admin/ads/create" element={<CreateAdvertisementPage />} />
                <Route path="/admin/ads/:id" element={<EditAdvertisementPage />} />
                <Route path="/admin/users" element={<UsersManagementPage />} />
                <Route path="/admin/users/create" element={<CreateUserPage />} />
                <Route path="/admin/users/:id" element={<EditUserPage />} />
                <Route path="/admin/categories" element={<CategoriesManagementPage />} />
                <Route path="/admin/categories/create" element={<CreateCategoryPage />} />
                <Route path="/admin/categories/:id" element={<EditCategoryPage />} />
                <Route path="/admin/breaking-news" element={<BreakingNewsPage />} />
                <Route path="/admin/comments" element={<CommentsManagementPage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
                <Route path="/admin/content" element={<SiteContentManagementPage />} />
              </Routes>
            </main>
            <Footer />
            <CookieConsent />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
