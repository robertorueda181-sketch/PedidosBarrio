import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company',
  imports: [CommonModule],
  templateUrl: './company.html',
  styleUrl: './company.css',
})
export class Company implements OnInit {
  private route = inject(ActivatedRoute);
  codigoempresa: string | null = null;

  ngOnInit() {
    // Obtener el código de empresa de la URL
    this.codigoempresa = this.route.snapshot.paramMap.get('codigoempresa');
    console.log('Código de empresa:', this.codigoempresa);
    
    // También puedes suscribirte a los cambios si la ruta puede cambiar sin recargar el componente
    this.route.paramMap.subscribe(params => {
      this.codigoempresa = params.get('codigoempresa');
      console.log('Código de empresa actualizado:', this.codigoempresa);
      // Aquí puedes cargar los datos de la empresa usando el código
    });
  }
}
