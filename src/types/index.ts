/* eslint-disable */
export type NigerianState =
    | 'Abia' | 'Adamawa' | 'Akwa Ibom' | 'Anambra' | 'Bauchi'
    | 'Bayelsa' | 'Benue' | 'Borno' | 'Cross River' | 'Delta'
    | 'Ebonyi' | 'Edo' | 'Ekiti' | 'Enugu' | 'Gombe'
    | 'Imo' | 'Jigawa' | 'Kaduna' | 'Kano' | 'Katsina'
    | 'Kebbi' | 'Kogi' | 'Kwara' | 'Lagos' | 'Nasarawa'
    | 'Niger' | 'Ogun' | 'Ondo' | 'Osun' | 'Oyo'
    | 'Plateau' | 'Rivers' | 'Sokoto' | 'Taraba' | 'Yobe'
    | 'Zamfara' | 'Federal Capital Territory - Abuja';

export type UserRole = 'super-admin' | 'admin' | 'user';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    region: NigerianState;
    emailVerified: boolean;
    createdAt: Date | any;
    updatedAt: Date | any;
}

export interface Report {
    id?: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    region: NigerianState;
    binStatus: 'Empty' | 'Almost Full' | 'Full' | 'Overflowing' | 'Damaged';
    photoURL?: string;
    reportedBy: string;
    reporterName: string;
    reporterEmail: string;
    reporterRegion: NigerianState;
    createdAt: any;
    updatedAt: any;
    workflowStatus: 'reported' | 'acknowledged' | 'collected';
}

export interface Notification {
    id?: string;
    userId: string;
    title: string;
    message: string;
    type: 'report_acknowledged' | 'report_collected' | 'info' | 'alert';
    reportId?: string;
    read: boolean;
    createdAt: any;
}

export type BinStatus = 'Empty' | 'Almost Full' | 'Full' | 'Overflowing' | 'Damaged';
export type WorkflowStatus = 'reported' | 'acknowledged' | 'collected';