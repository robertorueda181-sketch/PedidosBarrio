import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('PedidosBarrio');
  searchQuery = '';
  onSearch() {
    // Aquí puedes agregar la lógica para buscar negocios según searchQuery
    alert(`Buscando: ${this.searchQuery}`);
  }
}
