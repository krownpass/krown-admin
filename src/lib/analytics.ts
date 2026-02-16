import api from "@/lib/api";

export interface AnalyticsData {
    kpi: {
        totalRevenue: number;
        totalBookings: number;
        activeUsers: number;
        noShowRate: number;
    };
    revenueChart: {
        date: string;
        dineoutRevenue: number;
        subscriptionRevenue: number;
    }[];
    bookingFunnel: {
        pending: number;
        accepted: number;
        visited: number;
    };
    cafeLeaderboard: {
        cafeId: string;
        cafeName: string;
        totalRevenue: number;
        totalBookings: number;
        acceptedBookings: number;
        visitedBookings: number;
        completionRate: number;
        avgRating: number;
    }[];
    operationalMetrics: {
        peakHour: number | null;
        avgLeadTimeHours: number;
    };
    subscriptionHealth: {
        active: number;
        expired: number;
    };
    visitorRetention: {
        newVisitors: number;
        returningVisitors: number;
    };
    recentBookings: {
        bookingId: string;
        date: string;
        time: string;
        status: string;
        amount: number;
        userName: string;
        userMobile: string;
        cafeName: string;
    }[];
}

export const getAdminDashboardStats = async (range: string = "7d"): Promise<AnalyticsData> => {
    const response = await api.get(`/krown/admin/dashboard?range=${range}`);
    return response.data.data; // The backend returns { success: true, data: { ... } }
};
