/* eslint-disable */
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { type NigerianState } from '../types';

const PublicReportPage: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [formData, setFormData] = useState({
    status: '' as 'Empty' | 'Almost Full' | 'Full' | 'Overflowing' | 'Damaged',
    location: { latitude: 0, longitude: 0, address: '' },
    photoURL: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const statusOptions = ['Empty', 'Almost Full', 'Full', 'Overflowing', 'Damaged'] as const;

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Safe user access - only proceed if user exists and has verified email
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Authentication required</div>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <h3 className="font-bold mb-2">Email Verification Required</h3>
            <p>
              Please verify your email address before submitting reports.
              Check your inbox for the verification email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusSelect = (status: typeof statusOptions[number]) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handlePhotoURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, photoURL: event.target.value }));
  };

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: address,
        // Generate mock coordinates based on address input
        latitude: address ? 6.5244 + (Math.random() - 0.5) * 0.01 : 0,
        longitude: address ? 3.3792 + (Math.random() - 0.5) * 0.01 : 0
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.status || !formData.location.address.trim()) {
      setSubmitMessage('Please select both status and enter a location address');
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

      // Create report with region from user profile
      const reportData = {
        location: formData.location,
        region: userProfile.region as NigerianState,
        binStatus: formData.status,
        photoURL: formData.photoURL,
        reportedBy: user.uid,
        reporterName: user.displayName || user.email?.split('@')[0] || 'Resident',
        reporterEmail: user.email,
        reporterRegion: userProfile.region,
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
            {userProfile && (
              <span className="block mt-2 text-blue-600 font-medium">
                Your region: {userProfile.region}
              </span>
            )}
          </p>
        </div>

        {/* Main Content Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Report Form
          </h2>

          <div className="space-y-6">
            {/* Location Section - Updated to Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bin Location Address *
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={handleAddressChange}
                  placeholder="Enter the full address of the bin location (e.g., 123 Main Street, Ikeja, Lagos)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.location.address && (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Location address entered
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Please provide the complete address where the waste bin is located. Be as specific as possible to help our team locate it quickly.
                </p>
              </div>
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
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${formData.status === status
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

            {/* Region Info (Read-only) */}
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  This report will be tagged to your region: {userProfile.region}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1 ml-7">
                Reports are managed by the waste management team in your state
              </p>
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
              <div className={`p-4 rounded-md ${submitMessage.includes('Error')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
                }`}>
                {submitMessage}
              </div>
            )}
          </div>
        </form>

        {/* Updated Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How it works
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Enter the complete address of the bin location</li>
            <li>• Choose the current bin status</li>
            <li>• Add an image URL if available (optional)</li>
            <li>• Submit your report - waste management team in your state will be notified</li>
            <li>• You'll receive notifications when your report is acknowledged or resolved</li>
          </ul>

          <div className="mt-4 p-3 bg-blue-100 rounded">
            <h4 className="font-semibold text-blue-800 mb-1">Address Tips:</h4>
            <p className="text-blue-700 text-sm">
              Include street name, area/neighborhood, landmark, and city for accurate location identification.
            </p>
          </div>

          <div className="mt-3 p-3 bg-blue-100 rounded">
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