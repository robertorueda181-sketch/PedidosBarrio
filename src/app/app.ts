import { Component, signal } from '@angular/core';
import { Footer } from "../shared/footer/footer";
import { Navbar } from '../shared/navbar/navbar';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  constructor(private router: Router) {}

  protected readonly title = signal('PedidosBarrio');
  searchQuery = '';
  onSearch() {
    // Aquí puedes agregar la lógica para buscar negocios según searchQuery
    alert(`Buscando: ${this.searchQuery}`);
  }
  
}
