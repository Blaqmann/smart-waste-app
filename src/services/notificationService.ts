import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { type Notification } from '../types';

export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    reportId?: string
) => {
    try {
        const notification: Omit<Notification, 'id'> = {
            userId,
            title,
            message,
            type,
            reportId,
            read: false,
            createdAt: new Date()
        };

        await addDoc(collection(db, 'notifications'), notification);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const notifications: Notification[] = [];

        querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() } as Notification);
        });

        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const markNotificationAsRead = async (notificationId: string) => {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const markAllNotificationsAsRead = async (userId: string) => {
    try {
        const notifications = await getUserNotifications(userId);
        const unreadNotifications = notifications.filter(n => !n.read);

        const updatePromises = unreadNotifications.map(notification =>
            markNotificationAsRead(notification.id!)
        );

        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

// Notification templates
export const NOTIFICATION_TEMPLATES = {
    reportAcknowledged: (reportId: string) => ({
        title: 'Report Acknowledged',
        message: `Your waste bin report (ID: ${reportId.slice(-6)}) has been acknowledged by the waste management team.`,
        type: 'report_acknowledged' as const
    }),
    reportCollected: (reportId: string) => ({
        title: 'Report Resolved',
        message: `The waste bin from your report (ID: ${reportId.slice(-6)}) has been collected.`,
        type: 'report_collected' as const
    })
};