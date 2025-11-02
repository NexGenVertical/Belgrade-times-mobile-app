import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAdvertisements, Advertisement } from '../hooks/useAdminAdvertisements';
import { Plus, Edit, Trash2, ArrowLeft, Search, Filter, BarChart3, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

interface Filters {
  search: string;
  placement: string;
  status: 'all' | 'active' | 'inactive' | 'scheduled';
}

export function AdvertisementManagementPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    placement: '',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const {
    advertisements: allAdvertisements,
    loading: adsLoading,
    error: adsError,
    fetchAdvertisements,
    deleteAdvertisement,
    toggleActiveStatus,
    getAdvertisementStats,
    getFilteredAdvertisements
  } = useAdminAdvertisements();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      setLoading(adsLoading);
      setError(adsError || '');
    }
  }, [user, profile, adsLoading, adsError]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      // Convert 'all' status to undefined for the filter function
      const filterParams = {
        ...filters,
        status: filters.status === 'all' ? undefined : filters.status
      };
      const filtered = getFilteredAdvertisements(filterParams);
      setAdvertisements(filtered);
    }
  }, [allAdvertisements, filters, user, profile]);

  const handleDelete = async (id: string, name: string) => {
    const userConfirmed = confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`);
    
    if (!userConfirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      await deleteAdvertisement(id);
      
      setSuccess(`Advertisement "${name}" deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting advertisement:', error);
      setError(error.message || `Failed to delete advertisement "${name}"`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      setError('');
      setSuccess('');
      
      await toggleActiveStatus(id, !currentStatus);
      
      setSuccess(`Advertisement "${name}" ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error toggling advertisement status:', error);
      setError(error.message || `Failed to update advertisement status`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getStatusBadge = (ad: Advertisement) => {
    const now = new Date();
    const startDate = ad.start_date ? new Date(ad.start_date) : null;
    const endDate = ad.end_date ? new Date(ad.end_date) : null;
    
    if (!ad.is_active) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Inactive
        </span>
      );
    }
    
    if (startDate && startDate > now) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Scheduled
        </span>
      );
    }
    
    if (endDate && endDate < now) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Expired
        </span>
      );
    }
    
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Active
      </span>
    );
  };

  const getClickThroughRate = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatPlacement = (placement: string) => {
    return placement.charAt(0).toUpperCase() + placement.slice(1);
  };

  const stats = getAdvertisementStats();

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Admin</span>
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Advertisement Management
          </h1>
          <Link
            to="/admin/ads/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            style={{ minHeight: '44px' }}
          >
            <Plus className="h-5 w-5" />
            <span>Create Advertisement</span>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Ads</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAds}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeAds}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clicks</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalClicks}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Impressions</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalImpressions}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg CTR</div>
            <div className="text-2xl font-bold text-orange-600">{stats.avgClickRate.toFixed(2)}%</div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="search"
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                    style={{ minHeight: '44px' }}
                    placeholder="Search by name..."
                  />
                </div>
              </div>

              {/* Placement Filter */}
              <div>
                <label htmlFor="placement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Placement
                </label>
                <select
                  id="placement"
                  value={filters.placement}
                  onChange={(e) => setFilters(prev => ({ ...prev, placement: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                  style={{ minHeight: '44px' }}
                >
                  <option value="">All Placements</option>
                  <option value="header">Header</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="footer">Footer</option>
                  <option value="content">Content</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                  style={{ minHeight: '44px' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {advertisements.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No advertisements found</p>
            <Link
              to="/admin/ads/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              style={{ minHeight: '44px' }}
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Advertisement</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Advertisement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Placement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Analytics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {advertisements.map((ad) => (
                      <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={ad.image_url}
                              alt={ad.name}
                              className="w-16 h-12 object-cover rounded border border-gray-300 dark:border-gray-600"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {ad.name}
                              </div>
                              {ad.link_url && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {ad.link_url}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatPlacement(ad.placement)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(ad)}
                            <button
                              onClick={() => handleToggleActive(ad.id, ad.is_active, ad.name)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title={ad.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {ad.is_active ? (
                                <ToggleRight className="h-5 w-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900 dark:text-white">
                            <div className="flex items-center gap-4">
                              <span>
                                <span className="font-medium">{ad.clicks}</span> clicks
                              </span>
                              <span>
                                <span className="font-medium">{ad.impressions}</span> views
                              </span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              CTR: {getClickThroughRate(ad.clicks, ad.impressions)}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div>
                            <div>Start: {formatDate(ad.start_date)}</div>
                            <div>End: {formatDate(ad.end_date)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/admin/ads/${ad.id}`}
                              className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                              style={{ minWidth: '44px', minHeight: '44px' }}
                              title="Edit Advertisement"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(ad.id, ad.name)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                              style={{ minWidth: '44px', minHeight: '44px' }}
                              title="Delete Advertisement"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {advertisements.map((ad) => (
                <div key={ad.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={ad.image_url}
                        alt={ad.name}
                        className="w-16 h-12 object-cover rounded border border-gray-300 dark:border-gray-600"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {ad.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatPlacement(ad.placement)}
                        </p>
                        {ad.link_url && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {ad.link_url}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(ad.id, ad.is_active, ad.name)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {ad.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(ad)}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      CTR: {getClickThroughRate(ad.clicks, ad.impressions)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Clicks:</span>
                      <span className="ml-1 font-medium">{ad.clicks}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Views:</span>
                      <span className="ml-1 font-medium">{ad.impressions}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <Link
                      to={`/admin/ads/${ad.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      style={{ minHeight: '48px' }}
                    >
                      <Edit className="h-5 w-5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(ad.id, ad.name)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      style={{ minHeight: '48px' }}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}