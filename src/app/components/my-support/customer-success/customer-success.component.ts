import { Component } from '@angular/core';
import { InquiryComponent } from '../inquiry/inquiry.component';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'acrylic-customer-success',
  standalone: true,
  imports: [NgOptimizedImage, InquiryComponent],
  templateUrl: './customer-success.component.html',
  styleUrl: './customer-success.component.scss'
})
export class CustomerSuccessComponent {
  suggestionBox = Array(6);
  inquirySelect= {
    title: 'Make sure to search amd upvote Lorem Ipsum!',
    label: 'Suggestion type',
  }
}
