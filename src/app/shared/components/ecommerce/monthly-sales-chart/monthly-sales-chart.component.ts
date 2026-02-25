import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries, ApexChart, ApexXAxis,
  ApexPlotOptions, ApexDataLabels, ApexStroke,
  ApexLegend, ApexYAxis, ApexGrid, ApexFill, ApexTooltip
} from 'ng-apexcharts';

import { DashboardService } from '../../../../services/dashboard.service';

@Component({
  selector: 'app-monthly-sales-chart',
  standalone: true,
  imports: [NgApexchartsModule, NgClass],
  templateUrl: './monthly-sales-chart.component.html'
})
export class MonthlySalesChartComponent implements OnInit {

  private readonly MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  currentYear: number;
  currentMonth: number;   // 1–12
  loading = false;

  // ── ApexCharts config ────────────────────────────────────────────────
  public series: ApexAxisChartSeries = [{ name: 'Ingresos', data: [] }];

  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    type: 'bar',
    height: 180,
    toolbar: { show: false },
  };

  public xaxis: ApexXAxis = {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: '11px' } },
  };

  public plotOptions: ApexPlotOptions = {
    bar: {
      horizontal: false,
      columnWidth: '60%',
      borderRadius: 4,
      borderRadiusApplication: 'end',
    },
  };

  public dataLabels: ApexDataLabels = { enabled: false };
  public stroke: ApexStroke = { show: true, width: 3, colors: ['transparent'] };
  public legend: ApexLegend = { show: false };
  public yaxis: ApexYAxis = {
    title: { text: undefined },
    labels: { formatter: (v: number) => `S/ ${v}` }
  };
  public grid: ApexGrid = { yaxis: { lines: { show: true } } };
  public fill: ApexFill = { opacity: 1 };
  public tooltip: ApexTooltip = {
    x: { show: true, formatter: (_v: number, opts: any) => `Día ${opts.w.globals.labels[opts.dataPointIndex]}` },
    y: { formatter: (val: number) => `S/ ${val.toFixed(2)}` },
  };
  public colors: string[] = ['#465fff'];

  constructor(private dashboardService: DashboardService) {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
  }

  ngOnInit(): void {
    this.loadData();
  }

  get monthLabel(): string {
    return `${this.MONTHS[this.currentMonth - 1]} ${this.currentYear}`;
  }

  get canGoNext(): boolean {
    const now = new Date();
    return !(this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth() + 1);
  }

  prevMonth(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadData();
  }

  nextMonth(): void {
    if (!this.canGoNext) return;
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.dashboardService.getMonthlyRevenue(this.currentYear, this.currentMonth).subscribe({
      next: res => {
        const d = res.data;
        this.xaxis = { ...this.xaxis, categories: d.categories };
        this.series = [{ name: 'Ingresos', data: d.series }];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}