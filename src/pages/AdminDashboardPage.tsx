/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { collection, query, updateDoc, doc, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ImageModal from '../components/ImageModal';

// Define the Report type
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
  reporterName?: string;
  reporterEmail?: string;
  createdAt: any;
  updatedAt: any;
  workflowStatus: 'reported' | 'acknowledged' | 'collected';
};

const AdminDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch initial reports with pagination
  useEffect(() => {
    const fetchInitialReports = async () => {
      try {
        const q = query(
          collection(db, 'reports'),
          orderBy('createdAt', 'desc'),
          limit(reportsPerPage)
        );

        const querySnapshot = await getDocs(q);
        const reportsData: Report[] = [];

        querySnapshot.forEach((doc) => {
          reportsData.push({ id: doc.id, ...doc.data() } as Report);
        });

        setReports(reportsData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(reportsData.length === reportsPerPage);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setLoading(false);
      }
    };

    fetchInitialReports();
  }, [reportsPerPage]);

  const loadMoreReports = async () => {
    if (!lastVisible) return;

    try {
      const q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(reportsPerPage)
      );

      const querySnapshot = await getDocs(q);
      const newReports: Report[] = [];

      querySnapshot.forEach((doc) => {
        newReports.push({ id: doc.id, ...doc.data() } as Report);
      });

      setReports(prev => [...prev, ...newReports]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(newReports.length === reportsPerPage);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more reports:', error);
    }
  };

  // Enhanced analytics calculations
  const calculateAnalytics = () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const reportsLast24Hours = reports.filter(report => {
      const reportDate = report.createdAt instanceof Date
        ? report.createdAt
        : new Date(report.createdAt.seconds * 1000);
      return reportDate >= last24Hours;
    });

    const reportsLastWeek = reports.filter(report => {
      const reportDate = report.createdAt instanceof Date
        ? report.createdAt
        : new Date(report.createdAt.seconds * 1000);
      return reportDate >= lastWeek;
    });

    const binStatusCount = reports.reduce((acc, report) => {
      acc[report.binStatus] = (acc[report.binStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const workflowStatusCount = reports.reduce((acc, report) => {
      acc[report.workflowStatus] = (acc[report.workflowStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgResolutionTime = reports
      .filter(report => report.workflowStatus === 'collected')
      .reduce((total, report) => {
        const created = report.createdAt instanceof Date
          ? report.createdAt
          : new Date(report.createdAt.seconds * 1000);
        const updated = report.updatedAt instanceof Date
          ? report.updatedAt
          : new Date(report.updatedAt.seconds * 1000);
        return total + (updated.getTime() - created.getTime());
      }, 0) / (reports.filter(report => report.workflowStatus === 'collected').length || 1);

    return {
      totalReports: reports.length,
      totalToday: reports.filter(report => {
        const reportDate = report.createdAt instanceof Date
          ? report.createdAt
          : new Date(report.createdAt.seconds * 1000);
        return reportDate.toDateString() === now.toDateString();
      }).length,
      pending: reports.filter(report => report.workflowStatus === 'reported').length,
      acknowledged: reports.filter(report => report.workflowStatus === 'acknowledged').length,
      resolved: reports.filter(report => report.workflowStatus === 'collected').length,
      critical: reports.filter(report => report.binStatus === 'Overflowing' && report.workflowStatus !== 'collected').length,
      last24Hours: reportsLast24Hours.length,
      lastWeek: reportsLastWeek.length,
      binStatusCount,
      workflowStatusCount,
      avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60)) // Convert to hours
    };
  };

  const analytics = calculateAnalytics();

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

  // Get current reports for pagination
  const currentReports = reports.slice(0, currentPage * reportsPerPage);

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
          <p className="text-gray-600">Waste Management Analytics & Reports</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Reports</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.totalReports}</p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics.last24Hours} in last 24h • {analytics.lastWeek} this week
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Actions</h3>
            <p className="text-3xl font-bold text-orange-600">{analytics.pending}</p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics.acknowledged} acknowledged • {analytics.resolved} resolved
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Critical Alerts</h3>
            <p className="text-3xl font-bold text-red-600">{analytics.critical}</p>
            <p className="text-sm text-gray-500 mt-1">
              Overflowing bins requiring immediate attention
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Avg. Resolution</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.avgResolutionTime}h</p>
            <p className="text-sm text-gray-500 mt-1">
              Average time to resolve reports
            </p>
          </div>
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bin Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bin Status Distribution</h3>
            <div className="space-y-2">
              {Object.entries(analytics.binStatusCount).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`}
                        style={{
                          width: `${(count / analytics.totalReports) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Workflow Status</h3>
            <div className="space-y-2">
              {Object.entries(analytics.workflowStatusCount).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getWorkflowColor(status).split(' ')[0]}`}
                        style={{
                          width: `${(count / analytics.totalReports) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reports List with Pagination */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Recent Reports</h2>
              <p className="text-gray-600 text-sm mt-1">
                Showing {currentReports.length} of {reports.length} reports • {analytics.pending} require attention
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Page {currentPage}
            </div>
          </div>

          <div className="p-6">
            {currentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reports submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {currentReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            Report #{report.id?.slice(-6)}
                          </h4>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(report.binStatus)}`}>
                            {report.binStatus}
                          </span>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${getWorkflowColor(report.workflowStatus)}`}>
                            {report.workflowStatus}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-1">
                          📍 {report.location.address || 'No address provided'}
                        </p>

                        {report.reporterName && (
                          <p className="text-xs text-gray-500 mb-1">
                            Reported by: {report.reporterName}
                          </p>
                        )}

                        <p className="text-xs text-gray-500">
                          🕒 {report.createdAt instanceof Date
                            ? report.createdAt.toLocaleString()
                            : new Date(report.createdAt.seconds * 1000).toLocaleString()}
                        </p>

                        {report.photoURL && (
                          <div className="mt-2">
                            <div
                              className="h-16 w-16 bg-gray-100 rounded border cursor-pointer hover:shadow transition-shadow overflow-hidden"
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
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {report.workflowStatus === 'reported' && (
                          <button
                            onClick={() => updateWorkflowStatus(report.id!, 'acknowledged')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
                          >
                            Acknowledge
                          </button>
                        )}
                        {report.workflowStatus === 'acknowledged' && (
                          <button
                            onClick={() => updateWorkflowStatus(report.id!, 'collected')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
                          >
                            Mark Collected
                          </button>
                        )}
                        {report.workflowStatus === 'collected' && (
                          <span className="text-green-600 text-sm font-medium px-2 whitespace-nowrap">
                            Completed ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && currentReports.length < reports.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreReports}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  Load More Reports
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Showing {currentReports.length} of {reports.length} reports
                </p>
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