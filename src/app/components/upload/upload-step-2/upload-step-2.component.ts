import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DistributorsService } from '../../../services/distributors.service';
import { IDistributorsResult } from '../../../interfaces/response/distributor.response';

@Component({
  selector: 'acrylic-upload-step-2',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './upload-step-2.component.html',
  styleUrl: './upload-step-2.component.scss'
})
export class UploadStep2Component implements OnInit {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();

  private _distributorService = inject(DistributorsService)
  distributors!: IDistributorsResult[]

  ngOnInit(): void {
    this.getDistributors()
  }

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  getDistributors() {
    this._distributorService.getDistributorList().subscribe({
      next: response => {
        this.distributors = response.results
      }
    })
  }
}
