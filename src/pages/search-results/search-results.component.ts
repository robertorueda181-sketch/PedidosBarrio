import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../shared/services/search.service';

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

    searchQuery = signal<string>('');
    activeTab = signal<string>('TODOS');
    results = signal<SearchResult[]>([]);
    isLoading = signal<boolean>(false);

    // Mock filters
    categories = ['Restaurantes', 'Salud', 'Hogar', 'Tecnología', 'Venta', 'Alquiler'];
    selectedCategory = signal<string>('');

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
                this.results.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error performing search', err);
                this.isLoading.set(false);
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
        if (this.searchQuery().trim()) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { q: this.searchQuery() },
                queryParamsHandling: 'merge'
            });
        }
    }

    goToDetail(result: SearchResult) {
        if (result.type === 'NEGOCIO' && result.url) {
            this.router.navigateByUrl('/' + result.url);
        } else if (result.type === 'INMUEBLE') {
            this.router.navigate(['/inmueble', result.id]);
        } else if (result.type === 'SERVICIO') {
            this.router.navigate(['/servicio', result.id]);
        }
    }
}
