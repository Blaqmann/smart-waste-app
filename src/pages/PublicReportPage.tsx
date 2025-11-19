/* eslint-disable */
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const PublicReportPage: React.FC = () => {
  const [formData, setFormData] = useState({
    status: '' as 'Empty' | 'Almost Full' | 'Full' | 'Overflowing' | 'Damaged',
    location: { latitude: 0, longitude: 0, address: '' },
    photoURL: '' // Changed from File to string URL
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const statusOptions = ['Empty', 'Almost Full', 'Full', 'Overflowing', 'Damaged'] as const;

  const handleStatusSelect = (status: typeof statusOptions[number]) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handlePhotoURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, photoURL: event.target.value }));
  };

  const handleLocationSelect = () => {
    const mockLocation = {
      latitude: 6.5244 + (Math.random() - 0.5) * 0.01,
      longitude: 3.3792 + (Math.random() - 0.5) * 0.01,
      address: 'Sample Location, South-West Nigeria'
    };
    setFormData(prev => ({ ...prev, location: mockLocation }));
    alert('Location set! In a real app, this would use a map picker.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.status || formData.location.latitude === 0) {
      setSubmitMessage('Please select both status and location');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Validate URL if provided (optional)
      if (formData.photoURL && !isValidUrl(formData.photoURL)) {
        setSubmitMessage('Please enter a valid image URL or leave it empty');
        setIsSubmitting(false);
        return;
      }

      // Save report to Firestore
      const reportData = {
        location: formData.location,
        binStatus: formData.status,
        photoURL: formData.photoURL, // Store the URL directly
        reportedBy: 'anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        workflowStatus: 'reported' as const
      };

      await addDoc(collection(db, 'reports'), reportData);

      setSubmitMessage('Report submitted successfully! Thank you for helping keep your community clean.');
      
      // Reset form
      setFormData({
        status: '' as any,
        location: { latitude: 0, longitude: 0, address: '' },
        photoURL: ''
      });

    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitMessage('Error submitting report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to validate URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Report a Waste Bin Issue
          </h1>
          <p className="text-lg text-gray-600">
            Help keep your community clean by reporting full or damaged waste bins
          </p>
        </div>

        {/* Main Content Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Report Form
          </h2>
          
          <div className="space-y-6">
            {/* Location Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bin Location *
              </label>
              <button
                type="button"
                onClick={handleLocationSelect}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              >
                {formData.location.latitude !== 0 ? (
                  <div>
                    <p className="text-green-600 font-medium">Location Set ✓</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.location.address}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500">Click to set location</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Select bin location on map
                    </p>
                  </div>
                )}
              </button>
            </div>

            {/* Status Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bin Status *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusSelect(status)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      formData.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo URL Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.photoURL}
                onChange={handlePhotoURLChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Paste a link to a photo of the bin (e.g., from Imgur, Google Drive, etc.)
              </p>
              
              {/* Preview if URL is provided */}
              {formData.photoURL && isValidUrl(formData.photoURL) && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <img 
                    src={formData.photoURL} 
                    alt="Preview" 
                    className="max-w-xs max-h-32 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>

            {/* Status Message */}
            {submitMessage && (
              <div className={`p-4 rounded-md ${
                submitMessage.includes('Error') 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {submitMessage}
              </div>
            )}
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How it works
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Select the bin location on the map</li>
            <li>• Choose the current bin status</li>
            <li>• Add an image URL if available (optional)</li>
            <li>• Submit your report - waste management team will be notified</li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <h4 className="font-semibold text-blue-800 mb-1">Getting Image URLs:</h4>
            <p className="text-blue-700 text-sm">
              You can upload images to services like Imgur, Google Drive, or Dropbox and paste the shareable link here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicReportPage;