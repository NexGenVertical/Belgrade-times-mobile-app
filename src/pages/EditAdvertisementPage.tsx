import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAdvertisements, Advertisement } from '../hooks/useAdminAdvertisements';
import { ArrowLeft, BarChart3, TrendingUp, MousePointer, Eye, Calendar } from 'lucide-react';
import { AdvertisementForm } from '../components/AdvertisementForm';

export function EditAdvertisementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { 
    getAdvertisementById, 
    updateAdvertisement,
    deleteAdvertisement 
  } = useAdminAdvertisements();
  
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'analytics'>('form');

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (id) {
      const ad = getAdvertisementById(id);
      if (ad) {
        setAdvertisement(ad);
        setLoading(false);
      } else {
        setError('Advertisement not found');
        setLoading(false);
      }
    } else {
      setError('Advertisement ID is required');
      setLoading(false);
    }
  }, [id, user, profile, getAdvertisementById, navigate]);

  const handleSuccess = async () => {
    setSuccess('Advertisement updated successfully');
    setTimeout(() => {
      navigate('/admin/ads');
    }, 1500);
  };

  const handleCancel = () => {
    navigate('/admin/ads');
  };

  const handleDelete = async () => {
    if (!advertisement) return;
    
    const userConfirmed = confirm(`Are you sure you want to delete "${advertisement.name}"?\n\nThis action cannot be undone.`);
    
    if (!userConfirmed) {
      return;
    }

    try {
      await deleteAdvertisement(advertisement.id);
      navigate('/admin/ads');
    } catch (error: any) {
      setError(error.message || `Failed to delete advertisement`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUpdate = async (updateData: any) => {
    if (!advertisement || !id) return;
    
    try {
      const updatedAd = await updateAdvertisement(id, updateData);
      if (updatedAd) {
        setAdvertisement(updatedAd);
        handleSuccess();
      }
    } catch (error: any) {
      throw error; // Re-throw to be handled by the form component
    }
  };

  const getClickThroughRate = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (ad: Advertisement) => {
    const now = new Date();
    const startDate = ad.start_date ? new Date(ad.start_date) : null;
    const endDate = ad.end_date ? new Date(ad.end_date) : null;
    
    if (!ad.is_active) {
      return { status: 'Inactive', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
    
    if (startDate && startDate > now) {
      return { status: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    }
    
    if (endDate && endDate < now) {
      return { status: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    
    return { status: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error && !advertisement) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/admin/ads')}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Advertisements</span>
          </button>
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg p-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!advertisement) {
    return null;
  }

  const statusInfo = getStatusInfo(advertisement);
  const clickThroughRate = getClickThroughRate(advertisement.clicks, advertisement.impressions);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/ads')}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Advertisements</span>
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Advertisement
          </h1>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.status}
            </span>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              style={{ minHeight: '44px' }}
            >
              Delete Advertisement
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Analytics Dashboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Analytics Dashboard
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'form'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Edit Form
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          {activeTab === 'analytics' && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <MousePointer className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clicks</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{advertisement.clicks}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Impressions</div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">{advertisement.impressions}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Click-Through Rate</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{clickThroughRate}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Created</div>
                      <div className="text-sm font-bold text-orange-900 dark:text-orange-100">
                        {new Date(advertisement.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advertisement Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Advertisement Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advertisement Preview</h3>
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <img
                      src={advertisement.image_url}
                      alt={advertisement.name}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{advertisement.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Placement: {advertisement.placement.charAt(0).toUpperCase() + advertisement.placement.slice(1)}
                    </p>
                    {advertisement.link_url && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Link: <a href={advertisement.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{advertisement.link_url}</a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Performance Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Summary</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Campaign Duration</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Start: {formatDate(advertisement.start_date)}</div>
                        <div>End: {formatDate(advertisement.end_date)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Views:</span>
                          <span className="font-medium">{advertisement.impressions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Clicks:</span>
                          <span className="font-medium">{advertisement.clicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Click Rate:</span>
                          <span className="font-medium">{clickThroughRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`font-medium ${statusInfo.color}`}>{statusInfo.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'form' && (
            <AdvertisementForm
              mode="edit"
              initialData={advertisement}
              onSubmit={handleUpdate}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}