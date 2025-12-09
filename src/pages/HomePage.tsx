import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Waste Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Help keep Nigeria clean by reporting waste bin issues in your community.
            Together we can create a cleaner, healthier environment.
          </p>

          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-green-600 font-semibold">
                Welcome back, {user.displayName || user.email}!
              </p>
              <Link
                to="/report"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Report a Bin Issue
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                to="/register"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Get Started - Sign Up
              </Link>
              <Link
                to="/login"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Resident Login
              </Link>
              <Link
                to="/admin/login"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Admin Login
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-2xl mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Create Account</h3>
            <p className="text-gray-600">
              Sign up as a resident to start reporting waste bin issues in your neighborhood.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-2xl mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Report Issues</h3>
            <p className="text-gray-600">
              Quickly report full, overflowing, or damaged bins with photos and location details.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-2xl mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600">
              See how your reports help improve waste management in your community.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Making a Difference</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600">100+</div>
              <div className="text-gray-600">Reports Submitted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">85%</div>
              <div className="text-gray-600">Issues Resolved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">50+</div>
              <div className="text-gray-600">Active Residents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">24h</div>
              <div className="text-gray-600">Average Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;