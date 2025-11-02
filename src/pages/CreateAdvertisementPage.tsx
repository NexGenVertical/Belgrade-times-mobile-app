import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAdvertisements } from '../hooks/useAdminAdvertisements';
import { AdvertisementForm } from '../components/AdvertisementForm';

export function CreateAdvertisementPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { createAdvertisement } = useAdminAdvertisements();

  const handleSuccess = async () => {
    try {
      navigate('/admin/ads');
    } catch (error) {
      console.error('Error navigating after success:', error);
    }
  };

  const handleCancel = () => {
    navigate('/admin/ads');
  };

  const handleFormSubmit = async (advertisementData: any) => {
    if (!user) {
      throw new Error('You must be logged in to create advertisements');
    }

    try {
      const result = await createAdvertisement(advertisementData, user.id);
      console.log('Advertisement created successfully:', result);
      // The AdvertisementManagementPage will automatically refresh via realtime subscription
      handleSuccess();
    } catch (error: any) {
      console.error('Error creating advertisement:', error);
      throw error; // Re-throw to be handled by the form component
    }
  };

  React.useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
    }
  }, [user, profile, navigate]);

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <AdvertisementForm
          mode="create"
          onSubmit={handleFormSubmit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}