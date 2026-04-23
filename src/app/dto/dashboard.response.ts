export interface DashboardResponse {
    totalClients: number;
    newClientsToday: number;
    totalSalesWeek: number;
    newSalesToday: number;
    revenueWeekPen: number;
    revenueWeekUsd: number;
    revenueTodayPen: number;
    revenueTodayUsd: number;
}

export interface MonthlyRevenueResponse {
    year: number;
    month: number;
    categories: number[];
    series: number[];
}
