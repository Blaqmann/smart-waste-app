/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import ImageModal from '../components/ImageModal';
// import { Report } from '../types';

// Define the Report type directly here if import fails
type Report = {
  id?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  binStatus: 'Empty' | 'Almost Full' | 'Full' | 'Overflowing' | 'Damaged';
  photoURL?: string;
  reportedBy?: string;
  createdAt: any;
  updatedAt: any;
  workflowStatus: 'reported' | 'acknowledged' | 'collected';
};

const AdminDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch reports in real-time
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData: Report[] = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({ id: doc.id, ...doc.data() } as Report);
      });
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const updateWorkflowStatus = async (reportId: string, newStatus: 'reported' | 'acknowledged' | 'collected') => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        workflowStatus: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report status');
    }
  };

  // Calculate statistics
  const stats = {
    totalToday: reports.filter(report => {
      const today = new Date();
      const reportDate = report.createdAt instanceof Date ? report.createdAt : new Date(report.createdAt.seconds * 1000);
      return reportDate.toDateString() === today.toDateString();
    }).length,
    pending: reports.filter(report => report.workflowStatus === 'reported').length,
    resolved: reports.filter(report => report.workflowStatus === 'collected').length,
    critical: reports.filter(report => report.binStatus === 'Overflowing' && report.workflowStatus !== 'collected').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Overflowing': return 'bg-red-100 text-red-800';
      case 'Full': return 'bg-orange-100 text-orange-800';
      case 'Damaged': return 'bg-purple-100 text-purple-800';
      case 'Almost Full': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getWorkflowColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'collected': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Waste Management Overview</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Reports Today</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalToday}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Actions</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Resolved Today</h3>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Critical Alerts</h3>
            <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Reports</h2>
            <p className="text-gray-600 text-sm mt-1">
              {reports.length} total reports • {stats.pending} require attention
            </p>
          </div>

          <div className="p-6">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reports submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            Bin Report #{report.id?.slice(-6)}
                          </h4>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(report.binStatus)}`}>
                            {report.binStatus}
                          </span>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${getWorkflowColor(report.workflowStatus)}`}>
                            {report.workflowStatus}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          Location: {report.location.address || `Lat: ${report.location.latitude.toFixed(4)}, Lng: ${report.location.longitude.toFixed(4)}`}
                        </p>

                        <p className="text-xs text-gray-500">
                          Reported: {report.createdAt instanceof Date
                            ? report.createdAt.toLocaleString()
                            : new Date(report.createdAt.seconds * 1000).toLocaleString()}
                        </p>

                        {report.photoURL && (
                          <div className="mt-2">
                            <div
                              className="h-20 w-20 bg-gray-100 rounded border cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                              onClick={() => openImageModal(report.photoURL!)}
                            >
                              <img
                                src={report.photoURL}
                                alt="Bin photo"
                                className="h-full w-full object-cover hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden h-full w-full flex items-center justify-center bg-gray-200">
                                <span className="text-xs text-gray-500">Image</span>
                              </div>
                            </div>
                            <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline"
                              onClick={() => openImageModal(report.photoURL!)}>
                              View full image
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {report.workflowStatus === 'reported' && (
                          <button
                            onClick={() => updateWorkflowStatus(report.id!, 'acknowledged')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {report.workflowStatus === 'acknowledged' && (
                          <button
                            onClick={() => updateWorkflowStatus(report.id!, 'collected')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Mark Collected
                          </button>
                        )}
                        {report.workflowStatus === 'collected' && (
                          <span className="text-green-600 text-sm font-medium px-2">
                            Completed ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Image Modal */}
      <ImageModal
        imageUrl={selectedImage || ''}
        isOpen={isModalOpen}
        onClose={closeImageModal}
      />
    </div>
  );
};

export default AdminDashboardPage;