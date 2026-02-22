import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../shared/services/search.service';
import { AnalyticsService } from '../../shared/services/analytics.service';

export interface SearchResult {
    type: 'NEGOCIO' | 'SERVICIO' | 'INMUEBLE';
    id: number;
    title: string;
    description: string;
    imageUrl?: string | null;
    price?: number | null;
    location?: string | null;
    category?: string | null;
    url?: string | null;
    // Inmueble specific
    operacion?: string | null;
    medidas?: string | null;
    dormitorios?: number | null;
    banos?: number | null;
}

@Component({
    selector: 'app-search-results',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './search-results.component.html',
    styleUrl: './search-results.component.css'
})
export class SearchResultsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private searchService = inject(SearchService);
    private analyticsService = inject(AnalyticsService);

    searchQuery = signal<string>('');
    activeTab = signal<string>('TODOS');
    results = signal<SearchResult[]>([]);
    isLoading = signal<boolean>(false);
    showMobileFilters = signal<boolean>(false);

    // Mock filters
    categories = ['Restaurantes', 'Salud', 'Hogar', 'Tecnología', 'Venta', 'Alquiler'];
    selectedCategory = signal<string>('');

    toggleMobileFilters() {
        this.showMobileFilters.update(v => !v);
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['q']) {
                this.searchQuery.set(params['q']);
                this.performSearch();
            }
        });
    }

    performSearch() {
        if (!this.searchQuery().trim()) return;

        this.isLoading.set(true);
        this.searchService.search(this.searchQuery()).subscribe({
            next: (data) => {
                console.log('Search results:', data);
                this.results.set(data);
                this.isLoading.set(false);
                
                // Registrar búsqueda en cookies
                this.analyticsService.trackSearch(this.searchQuery(), data.length);
            },
            error: (err) => {
                console.error('Error performing search', err);
                this.isLoading.set(false);
                
                // Registrar búsqueda fallida
                this.analyticsService.trackSearch(this.searchQuery(), 0);
            }
        });
    }

    setTab(tab: string) {
        this.activeTab.set(tab);
    }

    get filteredResults() {
        if (this.activeTab() === 'TODOS') return this.results();
        return this.results().filter(r => r.type === this.activeTab());
    }

    onSearch() {
        console.log('pruebq')
        if (this.searchQuery().trim()) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { q: this.searchQuery() },
                queryParamsHandling: 'merge'
            });
        }
    }

    goToDetail(result: SearchResult) {
        window.open(result.url || '', '_blank');
    }
}
