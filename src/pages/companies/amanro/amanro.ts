import { Component } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-companies',
  imports: [],
  templateUrl: './amanro.html',
})
export class Amanro {

  //cartItems$!: Observable<CartItem[]>;
  total$!: Observable<number>; // Puedes crear un observable para el total también
  whatsappPhoneNumber: string = '51954121196';

  sendWhatsAppOrder() {
    let orderMessage = "\n\n¡Espero su confirmación!";

    const encodedMessage = encodeURIComponent(orderMessage);
    const whatsappUrl = `https://wa.me/${this.whatsappPhoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    //   this.cartItems$.subscribe(items => {
    //     if (items.length === 0) {
    //       alert("Tu carrito está vacío. Por favor, agrega productos antes de enviar el pedido.");
    //       return;
    //     }

    //     let orderMessage = "¡Hola! Me gustaría hacer el siguiente pedido:\n\n";
    //     items.forEach((item, index) => {
    //       orderMessage += `${index + 1}. ${item.name} x${item.quantity} - S/ ${(item.price * item.quantity).toFixed(2)}\n`;
    //     });

    //     //orderMessage += `\nTotal: S/ ${this.getTotal().toFixed(2)}`;
    //     orderMessage += "\n\n¡Espero su confirmación!";

    //     const encodedMessage = encodeURIComponent(orderMessage);
    //     const whatsappUrl = `https://wa.me/${this.whatsappPhoneNumber}?text=${encodedMessage}`;

    //     window.open(whatsappUrl, '_blank');

    //     // Opcional: limpiar el carrito después de enviar el pedido
    //     //this.cartService.clearCart();
    //   }).unsubscribe(); // Importante desuscribirse para evitar memory leaks
    // }
  }
}
