import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [RouterLink],
  template: `<div class="page-content"><p>Müşteri detayı yakında...</p></div>`
})
export class CustomerDetailComponent {}
