import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import * as d3 from 'd3';
import { RegionStatistic, StatisticsService } from '../services/statistics.service';

interface MapRegion {
  region: string;
  points: [number, number][];
}

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab4Page implements AfterViewInit {
  @ViewChild('barChart') private barChart?: ElementRef<SVGSVGElement>;
  @ViewChild('mapChart') private mapChart?: ElementRef<SVGSVGElement>;
  @ViewChild('shareChart') private shareChart?: ElementRef<SVGSVGElement>;

  readonly statistics = signal<RegionStatistic[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly totalLegends = signal(0);

  private readonly statisticsService = inject(StatisticsService);

  async ngAfterViewInit(): Promise<void> {
    try {
      const statistics = await this.statisticsService.getRegionStatistics();
      this.statistics.set(statistics);
      this.totalLegends.set(statistics.reduce((total, item) => total + item.legend_count, 0));
    } catch (error) {
      this.errorMessage.set(error instanceof Error
        ? error.message
        : 'No fue posible cargar las estadisticas.');
    } finally {
      this.isLoading.set(false);
      // The SVG elements are inside the loading conditional, so wait for Angular
      // to add them to the DOM before D3 selects and draws them.
      if (!this.errorMessage()) {
        setTimeout(() => this.renderCharts(this.statistics()), 0);
      }
    }
  }

  private renderCharts(statistics: RegionStatistic[]): void {
    this.renderBars(statistics);
    this.renderMap(statistics);
    this.renderShare(statistics);
  }

  private renderBars(statistics: RegionStatistic[]): void {
    if (!this.barChart) return;

    const svg = d3.select(this.barChart.nativeElement);
    svg.selectAll('*').remove();
    const width = 760;
    const height = 330;
    const margin = { top: 24, right: 24, bottom: 70, left: 48 };
    const max = Math.max(1, d3.max(statistics, (item: RegionStatistic) => item.legend_count) ?? 1);
    const x = d3.scaleBand().domain(statistics.map((item) => item.origin)).range([margin.left, width - margin.right]).padding(0.28);
    const y = d3.scaleLinear().domain([0, max]).nice().range([height - margin.bottom, margin.top]);

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickSize(0));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')));
    svg.append('g').selectAll('rect').data(statistics).join('rect')
      .attr('class', 'bar')
      .attr('x', (item: RegionStatistic) => x(item.origin) ?? 0)
      .attr('y', (item: RegionStatistic) => y(item.legend_count))
      .attr('width', x.bandwidth())
      .attr('height', (item: RegionStatistic) => y(0) - y(item.legend_count))
      .attr('rx', 8);
    svg.append('g').selectAll('text').data(statistics).join('text')
      .attr('class', 'value-label')
      .attr('x', (item: RegionStatistic) => (x(item.origin) ?? 0) + x.bandwidth() / 2)
      .attr('y', (item: RegionStatistic) => y(item.legend_count) - 8)
      .text((item: RegionStatistic) => item.legend_count);
  }

  private renderMap(statistics: RegionStatistic[]): void {
    if (!this.mapChart) return;

    const svg = d3.select(this.mapChart.nativeElement);
    svg.selectAll('*').remove();
    const width = 760;
    const height = 360;
    const projection = d3.geoNaturalEarth1().fitSize([width, height], {
      type: 'FeatureCollection',
      features: this.mapFeatures().map((item) => ({
        type: 'Feature',
        properties: { region: item.region },
        geometry: { type: 'Polygon', coordinates: [[...item.points, item.points[0]]] },
      })),
    } as never);
    const path = d3.geoPath(projection);
    const max = Math.max(1, d3.max(statistics, (item: RegionStatistic) => item.legend_count) ?? 1);
    const counts = new Map(statistics.map((item) => [item.region, item.legend_count]));

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.append('g').selectAll('path').data(this.mapFeatures()).join('path')
      .attr('class', 'map-region')
      .attr('d', (item: MapRegion) => path({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...item.points, item.points[0]]] } }) ?? '')
      .attr('fill', (item: MapRegion) => d3.interpolate('#d9e7e8', '#c56a3b')((counts.get(item.region) ?? 0) / max));
    const labels = this.mapFeatures().map((item) => {
      const center = d3.geoCentroid({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...item.points, item.points[0]]] } });
      return { ...item, center };
    });
    svg.append('g').selectAll('text').data(labels).join('text')
      .attr('class', 'map-label')
      .attr('x', (item: MapRegion & { center: [number, number] }) => projection(item.center)?.[0] ?? 0)
      .attr('y', (item: MapRegion & { center: [number, number] }) => projection(item.center)?.[1] ?? 0)
      .text((item: MapRegion) => `${item.region} (${counts.get(item.region) ?? 0})`);
  }

  private renderShare(statistics: RegionStatistic[]): void {
    if (!this.shareChart) return;

    const svg = d3.select(this.shareChart.nativeElement);
    svg.selectAll('*').remove();
    const width = 760;
    const height = 330;
    const radius = Math.min(width, height) / 2 - 24;
    const group = svg.attr('viewBox', `0 0 ${width} ${height}`).append('g').attr('transform', `translate(${width / 2},${height / 2})`);
    const color = d3.scaleOrdinal().domain(statistics.map((item) => item.region)).range(['#c56a3b', '#2b6570', '#e1a24a', '#547184']);
    const pie = d3.pie().value((item: RegionStatistic) => item.legend_count).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.56).outerRadius(radius);
    group.selectAll('path').data(pie(statistics)).join('path')
      .attr('class', 'share-slice')
      .attr('d', arc)
      .attr('fill', (item: { data: RegionStatistic }) => color(item.data.region));
    group.append('text').attr('class', 'donut-total').attr('text-anchor', 'middle').attr('dy', '-0.1em').text(this.totalLegends());
    group.append('text').attr('class', 'donut-caption').attr('text-anchor', 'middle').attr('dy', '1.4em').text('leyendas');
  }

  private mapFeatures(): MapRegion[] {
    return [
      { region: 'norteamerica', points: [[-168, 72], [-55, 70], [-60, 18], [-105, 10], [-135, 30]] },
      { region: 'latinoamerica', points: [[-88, 18], [-35, 12], [-48, -56], [-78, -55], [-92, -10]] },
      { region: 'europa', points: [[-12, 72], [42, 70], [58, 38], [8, 35], [-12, 48]] },
      { region: 'asia', points: [[42, 72], [178, 68], [165, 10], [75, 8], [42, 35]] },
    ];
  }
}
