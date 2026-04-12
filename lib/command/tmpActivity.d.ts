export interface Activity {
    id: number;
    name: string;
    start_at: string;
    server?: {
        name: string;
    };
    participants: number;
}

export interface ActivityConfig {
    activityCheckEnable: boolean;
    activityCheckInterval: number;
    activityGroups: string[];
}

export declare class ActivityService {
    constructor(ctx: any, config: ActivityConfig);
    start(): void;
    getActivities(): Promise<Activity[]>;
    checkActivityNotification(): Promise<void>;
    sendActivityReminder(activity: Activity, minutesLeft: number): Promise<void>;
    formatTime(timeString: string): string;
    cleanup(): void;
}

export declare function queryActivity(ctx: any): Promise<string>;
