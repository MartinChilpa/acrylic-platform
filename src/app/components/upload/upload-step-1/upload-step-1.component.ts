import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'acrylic-upload-step-1',
  standalone: true,
  imports: [NgClass],
  templateUrl: './upload-step-1.component.html',
  styleUrl: './upload-step-1.component.scss'
})
export class UploadStep1Component {
  connectSplit = [
    {Name: 'You', percentage: '60%'},
    {Name: 'John Doe', percentage: '30%'},
    {Name: 'John Doe', percentage: '5%'},
    {Name: 'John Doe', percentage: '5%'},
  ]
}
