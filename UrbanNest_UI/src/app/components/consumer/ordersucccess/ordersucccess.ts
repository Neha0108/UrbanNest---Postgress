import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ordersucccess',
  imports: [RouterLink],
  templateUrl: './ordersucccess.html',
  styleUrl: './ordersucccess.css',
})
export class Ordersucccess {
  orderId = history.state.orderId;
}
