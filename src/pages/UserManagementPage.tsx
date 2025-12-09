/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
    collection,
    getDocs,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import type { UserProfile, UserRole, NigerianState } from '../types';
import { NIGERIAN_STATES } from '../constants/nigerian-states';

const UserManagementPage: React.FC = () => {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState<NigerianState | 'all'>('all');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

    useEffect(() => {
        if (userProfile?.role === 'super-admin') {
            fetchUsers();
        }
    }, [userProfile]);

    const fetchUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData: UserProfile[] = [];

            usersSnapshot.forEach((doc) => {
                usersData.push({ uid: doc.id, ...doc.data() } as UserProfile);
            });

            // Sort by creation date (newest first)
            usersData.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

            setUsers(usersData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: UserRole) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: newRole,
                updatedAt: new Date()
            });

            // Update local state
            setUsers(prev =>
                prev.map(user =>
                    user.uid === userId
                        ? { ...user, role: newRole, updatedAt: new Date() }
                        : user
                )
            );

            alert('User role updated successfully!');
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Error updating user role');
        }
    };

    const updateUserRegion = async (userId: string, newRegion: NigerianState) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                region: newRegion,
                updatedAt: new Date()
            });

            // Update local state
            setUsers(prev =>
                prev.map(user =>
                    user.uid === userId
                        ? { ...user, region: newRegion, updatedAt: new Date() }
                        : user
                )
            );

            alert('User region updated successfully!');
        } catch (error) {
            console.error('Error updating user region:', error);
            alert('Error updating user region');
        }
    };

    // Filter users based on search term, region, and role
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRegion = regionFilter === 'all' || user.region === regionFilter;
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRegion && matchesRole;
    });

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'super-admin': return 'bg-purple-100 text-purple-800';
            case 'admin': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getVerificationStatus = (user: UserProfile) => {
        return user.emailVerified ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
            </span>
        ) : (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Unverified
            </span>
        );
    };

    if (!userProfile || userProfile.role !== 'super-admin') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl text-red-600">Unauthorized Access</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading user management...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600">
                        Manage user roles and regions across all states
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 px-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
                        <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Verified Users</h3>
                        <p className="text-3xl font-bold text-green-600">
                            {users.filter(u => u.emailVerified).length}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Admins</h3>
                        <p className="text-3xl font-bold text-purple-600">
                            {users.filter(u => u.role === 'admin' || u.role === 'super-admin').length}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Regions</h3>
                        <p className="text-3xl font-bold text-orange-600">
                            {Array.from(new Set(users.map(u => u.region))).length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search Users
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Region
                            </label>
                            <select
                                value={regionFilter}
                                onChange={(e) => setRegionFilter(e.target.value as NigerianState | 'all')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Regions</option>
                                {NIGERIAN_STATES.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Role
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="super-admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Users ({filteredUsers.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Region
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.uid} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.displayName}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Joined: {user.createdAt.toDate().toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getVerificationStatus(user)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{user.region}</div>
                                                <div className="mt-2">
                                                    <select
                                                        value={user.region}
                                                        onChange={(e) => updateUserRegion(user.uid, e.target.value as NigerianState)}
                                                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        disabled={user.uid === userProfile.uid}
                                                    >
                                                        {NIGERIAN_STATES.map(state => (
                                                            <option key={state} value={state}>{state}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getRoleColor(user.role)}`}>
                                                    {user.role === 'super-admin' ? 'Super Admin' :
                                                        user.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                                <div className="mt-2">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => updateUserRole(user.uid, e.target.value as UserRole)}
                                                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        disabled={user.uid === userProfile.uid}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="super-admin">Super Admin</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <div className="space-y-2">
                                                    <button
                                                        onClick={() => updateUserRole(user.uid, 'admin')}
                                                        disabled={user.role === 'admin' || user.uid === userProfile.uid}
                                                        className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                                                    >
                                                        Make Admin
                                                    </button>
                                                    <br />
                                                    <button
                                                        onClick={() => updateUserRole(user.uid, 'user')}
                                                        disabled={user.role === 'user' || user.uid === userProfile.uid}
                                                        className="text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                                                    >
                                                        Make User
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Info */}
                    <div className="p-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Showing {filteredUsers.length} of {users.length} users
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;