import { Component, signal, inject } from '@angular/core';
import { Footer } from "../shared/footer/footer";
import { Navbar } from '../shared/navbar/navbar';
import { Router, RouterOutlet } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private messageService = inject(MessageService);

  constructor(private router: Router) { }

  protected readonly title = signal('PedidosBarrio');
  searchQuery = '';
  onSearch() {
    // Aquí puedes agregar la lógica para buscar negocios según searchQuery
    this.messageService.add({ severity: 'info', summary: 'Búsqueda', detail: `Buscando: ${this.searchQuery}` });
  }

}
