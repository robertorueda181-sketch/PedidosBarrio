import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ToastrService } from 'ngx-toastr';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'delivery' | 'pickup' | 'dine-in';
  createdAt: Date;
  estimatedTime?: number; // minutos
  address?: string;
  notes?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer';
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    BadgeModule,
    ButtonModule,
    ChipModule,
    SelectModule,
    InputTextModule,
    DialogModule,
    TabsModule
  ],
  providers: [ConfirmationService],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class PedidosComponent implements OnInit {
  private toastr = inject(ToastrService);
  private confirmationService = inject(ConfirmationService);

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus = 'all';
  searchTerm = '';
  showOrderDetail = false;
  selectedOrder: Order | null = null;

  statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Recibidos', value: 'received' },
    { label: 'En Preparación', value: 'preparing' },
    { label: 'Listos', value: 'ready' },
    { label: 'Entregados', value: 'delivered' },
    { label: 'Cancelados', value: 'cancelled' }
  ];

  ngOnInit() {
    this.loadOrders();
    this.filterOrders();
  }

  loadOrders() {
    // Datos de ejemplo
    this.orders = [
      {
        id: '1',
        orderNumber: '#001',
        customerName: 'Juan Pérez',
        customerPhone: '987654321',
        items: [
          { id: '1', name: 'Pizza Margarita', quantity: 2, price: 25.00, modifiers: ['Extra queso'] },
          { id: '2', name: 'Coca Cola 500ml', quantity: 2, price: 5.00 }
        ],
        total: 60.00,
        status: 'received',
        orderType: 'delivery',
        createdAt: new Date(),
        estimatedTime: 30,
        address: 'Av. Principal 123',
        notes: 'Sin cebolla por favor',
        paymentMethod: 'cash'
      },
      {
        id: '2',
        orderNumber: '#002',
        customerName: 'María García',
        customerPhone: '912345678',
        items: [
          { id: '3', name: 'Hamburguesa Clásica', quantity: 1, price: 18.00 },
          { id: '4', name: 'Papas Fritas', quantity: 1, price: 8.00 }
        ],
        total: 26.00,
        status: 'preparing',
        orderType: 'pickup',
        createdAt: new Date(Date.now() - 15 * 60000),
        estimatedTime: 20,
        paymentMethod: 'card'
      },
      {
        id: '3',
        orderNumber: '#003',
        customerName: 'Carlos López',
        items: [
          { id: '5', name: 'Ensalada César', quantity: 2, price: 15.00 },
          { id: '6', name: 'Jugo Natural', quantity: 2, price: 7.00 }
        ],
        total: 44.00,
        status: 'ready',
        orderType: 'dine-in',
        createdAt: new Date(Date.now() - 30 * 60000),
        paymentMethod: 'cash'
      },
      {
        id: '4',
        orderNumber: '#004',
        customerName: 'Ana Torres',
        customerPhone: '998877665',
        items: [
          { id: '7', name: 'Sushi Roll', quantity: 3, price: 22.00 }
        ],
        total: 66.00,
        status: 'delivered',
        orderType: 'delivery',
        createdAt: new Date(Date.now() - 60 * 60000),
        address: 'Jr. Los Olivos 456',
        paymentMethod: 'transfer'
      }
    ];
  }

  filterOrders() {
    let filtered = this.orders;

    // Filtrar por estado
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(search) ||
        order.customerName.toLowerCase().includes(search) ||
        order.customerPhone?.toLowerCase().includes(search)
      );
    }

    this.filteredOrders = filtered;
  }

  get receivedOrdersCount(): number {
    return this.orders.filter(o => o.status === 'received').length;
  }

  get preparingOrdersCount(): number {
    return this.orders.filter(o => o.status === 'preparing').length;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      received: 'Recibido',
      preparing: 'En Preparación',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      received: 'bg-blue-500 text-white',
      preparing: 'bg-orange-500 text-white',
      ready: 'bg-green-500 text-white',
      delivered: 'bg-gray-500 text-white',
      cancelled: 'bg-red-500 text-white'
    };
    return classes[status] || 'bg-gray-500 text-white';
  }

  getOrderTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      delivery: 'Delivery',
      pickup: 'Para llevar',
      'dine-in': 'Para comer aquí'
    };
    return labels[type] || type;
  }

  getOrderTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      delivery: 'pi-motorcycle',
      pickup: 'pi-shopping-bag',
      'dine-in': 'pi-home'
    };
    return icons[type] || 'pi-circle';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia'
    };
    return labels[method] || method;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutos

    if (diff < 1) return 'Hace un momento';
    if (diff < 60) return `Hace ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  viewOrderDetail(order: Order) {
    this.selectedOrder = order;
    this.showOrderDetail = true;
  }

  closeOrderDetail() {
    this.showOrderDetail = false;
    this.selectedOrder = null;
  }

  updateOrderStatus(orderId: string, newStatus: Order['status']) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      this.filterOrders();
      
      this.toastr.success(`Pedido ${order.orderNumber} actualizado a ${this.getStatusLabel(newStatus)}`, 'Estado actualizado');
    }
  }

  acceptOrder(order: Order) {
    this.updateOrderStatus(order.id, 'preparing');
  }

  markAsReady(order: Order) {
    this.updateOrderStatus(order.id, 'ready');
  }

  markAsDelivered(order: Order) {
    this.updateOrderStatus(order.id, 'delivered');
  }

  cancelOrder(order: Order) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de cancelar el pedido ${order.orderNumber}?`,
      header: 'Confirmar cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.updateOrderStatus(order.id, 'cancelled');
      }
    });
  }

  printOrder(order: Order) {
    this.toastr.info(`Imprimiendo pedido ${order.orderNumber}`, 'Imprimiendo');
  }
}
