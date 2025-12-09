import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const VerifyEmailPage: React.FC = () => {
    const { user, refreshUserData } = useAuth();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);
    const [status, setStatus] = useState<'checking' | 'verified' | 'failed'>('checking');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const checkEmailVerification = async () => {
            if (!user) {
                navigate('/login');
                return;
            }

            try {
                // Reload user to get latest verification status
                await user.reload();

                if (user.emailVerified) {
                    setStatus('verified');

                    // Update Firestore with verified status
                    await refreshUserData();

                    // Countdown before redirect
                    const timer = setInterval(() => {
                        setCountdown((prev) => {
                            if (prev <= 1) {
                                clearInterval(timer);
                                navigate('/report');
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);

                    return () => clearInterval(timer);
                } else {
                    setStatus('failed');
                    setVerifying(false);
                }
            } catch (error) {
                console.error('Error checking email verification:', error);
                setStatus('failed');
                setVerifying(false);
            }
        };

        checkEmailVerification();
    }, [user, navigate, refreshUserData]);

    const handleRetry = async () => {
        setVerifying(true);
        setStatus('checking');

        if (user) {
            await user.reload();

            if (user.emailVerified) {
                await refreshUserData();
                navigate('/report');
            } else {
                setStatus('failed');
                setVerifying(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full space-y-8 text-center">
                {verifying ? (
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Verifying Email...
                        </h2>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">
                            Please wait while we verify your email address
                        </p>
                    </div>
                ) : status === 'verified' ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <h3 className="font-bold mb-2">Email Verified Successfully!</h3>
                        <p className="mb-4">
                            Your email has been verified. You will be redirected in {countdown} seconds...
                        </p>
                        <button
                            onClick={() => navigate('/report')}
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                        >
                            Go to Dashboard Now
                        </button>
                    </div>
                ) : (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                        <h3 className="font-bold mb-2">Email Not Verified Yet</h3>
                        <p className="mb-4">
                            Please check your inbox and click the verification link.
                            If you don't see the email, check your spam folder.
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleRetry}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mr-2"
                            >
                                I've Verified My Email
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                Return to Login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;