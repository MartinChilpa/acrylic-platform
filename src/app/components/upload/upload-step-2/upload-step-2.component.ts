import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DistributorsService } from '../../../services/distributors.service';
import { IDistributorsResult } from '../../../interfaces/response/distributor.response';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { NavigationService } from '../../../services/navigation.service';
import { PreventTypingIfDisabledDirective } from '../../../directives/prevent-typing-if-disabled.directive';

@Component({
  selector: 'acrylic-upload-step-2',
  standalone: true,
  imports: [ReactiveFormsModule, CustomDropdownComponent, PreventTypingIfDisabledDirective],
  templateUrl: './upload-step-2.component.html',
  styleUrl: './upload-step-2.component.scss'
})
export class UploadStep2Component implements OnInit {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();

  public _navigationService = inject(NavigationService);
  private _distributorService = inject(DistributorsService);

  distributors!: IDistributorsResult[];
  isDistributorNameRequired: boolean = false;

  ngOnInit(): void {
    this.getDistributors()
    if (!this.form.get('distributor')?.value && (this.form.get('other_distributor')?.value || this.form.get('other_distributor_email')?.value)) {
      this.form.get('distributor')?.setValue('other');
      this.isDistributorNameRequired = true;
    }
  }

  nextUploadStepper(count: number) {
    if (this.form.get('distributor')?.value == 'other') {
      this.form.get('distributor')?.setValue('')
    }
    this.nextStepper.emit(count);
  }

  getDistributors() {
    this._distributorService.getDistributorList().subscribe({
      next: response => {
        this.distributors = response.results;
        this.distributors.push({
          name: "Other",
          uuid: "other"
        });
      }
    })
  }

  dropdownSelected($event: any) {
    if ($event.uuid != "other") {
      this.form.get('other_distributor')?.setValue('');
      this.form.get('other_distributor_email')?.setValue('');
      this.form.get('distributor')?.setValue($event.uuid);
      this.isDistributorNameRequired = false;
    }
    else {
      this.form.get('distributor')?.setValue($event.uuid);
      this.isDistributorNameRequired = true;
    }
  }

  checkCover(): void {
    this.form.get('is_cover')?.setValue(false);
  }
}
