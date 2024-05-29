import { MyArtistService } from './../../../services/my-artist.service';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ConfirmUploadComponent } from '../confirm-upload/confirm-upload.component';
import { LiveUploadComponent } from '../live-upload/live-upload.component';
import { FormGroup } from '@angular/forms';
import { IPrice } from '../../../interfaces/response/price.response';

@Component({
  selector: 'acrylic-upload-step-5',
  standalone: true,
  imports: [ConfirmUploadComponent, LiveUploadComponent],
  templateUrl: './upload-step-5.component.html',
  styleUrl: './upload-step-5.component.scss'
})
export class UploadStep5Component {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();
  @Output() selectedPriceEvent = new EventEmitter();

  prices: IPrice[] = [];
  private _myArtistService = inject(MyArtistService);
  selectedPrice!: IPrice;

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  actionTaken($event: boolean) {
    if ($event) {
      this.selectedPriceEvent.emit(this.selectedPrice);
    }
  }

  ngOnInit(): void {
    this.getPrices();
  }

  getPrices(): void {
    this._myArtistService.getPrices().subscribe((response) => {
      this.prices = response.results;
      this.selectedPrice = this.prices?.find(x => x.default) ?? {} as IPrice;
    })
  }
}
