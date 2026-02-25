export interface DashboardResponse {
    totalClients: number;
    newClientsToday: number;
    totalSalesWeek: number;
    newSalesToday: number;
    revenueWeek: number;
    revenueToday: number;
}

export interface MonthlyRevenueResponse {
    year: number;
    month: number;
    categories: number[];
    series: number[];
}
