/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  requireEmailVerification = true
}) => {
  const { user, userProfile, loading, checkEmailVerification } = useAuth();
  const location = useLocation();
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    // Check email verification status on mount and every 5 seconds
    const checkVerification = async () => {
      if (user && requireEmailVerification && !user.emailVerified) {
        setCheckingVerification(true);
        await checkEmailVerification(); // Remove destructuring since isVerified isn't used
        setCheckingVerification(false);
      }
    };

    checkVerification();

    // Set up interval to check verification status
    const interval = setInterval(checkVerification, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, requireEmailVerification, checkEmailVerification]);

  if (loading || checkingVerification) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login page based on the route
    const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // Check email verification if required
  if (requireEmailVerification && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <h3 className="font-bold mb-2">Email Verification Required</h3>
            <p className="mb-3">
              Please verify your email address to access this page.
              Check your inbox for the verification email.
            </p>
            <p className="text-sm mb-4">
              <span className="font-semibold">Note:</span> If you just verified your email,
              this page will automatically refresh in a few seconds.
            </p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={async () => {
                  // Use auth method to resend verification or check if sendEmailVerification exists
                  try {
                    // Check if user has sendEmailVerification method
                    if ('sendEmailVerification' in user && typeof user.sendEmailVerification === 'function') {
                      await (user as any).sendEmailVerification();
                      alert('Verification email resent!');
                    } else {
                      alert('Verification email cannot be sent from this interface. Please use Firebase Console.');
                    }
                  } catch (error) {
                    console.error('Error sending verification email:', error);
                    alert('Error sending verification email');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                Resend Verification Email
              </button>
              <button
                onClick={async () => {
                  const { isVerified } = await checkEmailVerification();
                  if (isVerified) {
                    window.location.reload();
                  } else {
                    alert('Email not verified yet. Please check your inbox.');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                I've Verified My Email
              </button>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Wait for user profile to load
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading user profile...</div>
      </div>
    );
  }

  // Check if admin access is required but user is not an admin
  if (adminOnly && userProfile.role !== 'admin' && userProfile.role !== 'super-admin') {
    return <Navigate to="/" replace />;
  }

  // Check if super admin access is required but user is not super admin
  if (adminOnly && location.pathname === '/admin/users' && userProfile.role !== 'super-admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;