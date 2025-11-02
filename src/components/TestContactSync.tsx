import React from 'react';
import { useSiteContent } from '../hooks/useSiteContent';

export function TestContactSync() {
  const { getContent, content, loading, error } = useSiteContent();
  
  console.log('TestContactSync - content:', content);
  console.log('TestContactSync - loading:', loading);
  console.log('TestContactSync - error:', error);

  return (
    <div className="bg-red-500 text-white p-4 text-center">
      <h2>Contact Sync Test</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      <div className="space-y-2 text-sm">
        <p><strong>Address:</strong> {getContent('contact_address', 'FALLBACK_ADDRESS')}</p>
        <p><strong>Phone:</strong> {getContent('contact_phone', 'FALLBACK_PHONE')}</p>
        <p><strong>Email:</strong> {getContent('contact_email', 'FALLBACK_EMAIL')}</p>
      </div>
      
      <div className="mt-2 text-xs">
        <p>Raw content object:</p>
        <pre className="bg-black bg-opacity-30 p-2 text-left">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}