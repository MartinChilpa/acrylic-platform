import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { AlertService } from '../../../services/alert.service';
import { NavigationService } from '../../../services/navigation.service';
import { MyArtistService } from '../../../services/my-artist.service';
import { LoaderService } from '../../../services/loader.service';

@Component({
  selector: 'acrylic-create-split-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, CustomDropdownComponent, NgClass],
  templateUrl: './create-split-sheet.component.html',
  styleUrl: './create-split-sheet.component.scss'
})
export class CreateSplitSheetComponent {
  @Input() createSplitSheetForm!: FormGroup;
  @Input() reviewObject!: any;
  @Output() reviewSheetData = new EventEmitter()

  totalPublishingSplits: number = 100;
  totalMasterSplits: number = 100;
  trackLoading: boolean = false
  splitNames: any[] = []
  publishing_splits_role = [
    { name: 'songwriter', uuid: 1 },
    { name: 'composer', uuid: 2 },
    { name: 'producer', uuid: 3 },
    { name: 'lyricist', uuid: 4 },
    { name: 'remixer', uuid: 5 },
    { name: 'other', uuid: 6 }
  ];

  master_splits_role = [
    { name: 'artist', uuid: 1 },
    { name: 'producer', uuid: 2 },
    { name: 'label', uuid: 3 },
    { name: 'other', uuid: 4 }
  ];

  private _alertService = inject(AlertService);
  private _navigationService = inject(NavigationService)
  private _myArtistService = inject(MyArtistService)
  private _loadingService = inject(LoaderService);

  get publishing_splits(): FormArray {
    return this.createSplitSheetForm.get('publishing_splits') as FormArray;
  }

  get master_splits(): FormArray {
    return this.createSplitSheetForm.get('master_splits') as FormArray;
  }

  get publishing_splits_total_percent(): number {
    let total = 0;
    this.createSplitSheetForm.controls['publishing_splits'].value.forEach((item: any) => {
      total += item.percent
    })
    return total;
  }

  get master_splits_total_percent(): number {
    let total = 0;
    this.createSplitSheetForm.controls['master_splits'].value.forEach((item: any) => {
      total += item.percent
    })
    return total;
  }

  // searchTrack(searchString: string) {
  //   if (!searchString) {
  //     this.splitNames = []
  //     return;
  //   }
  //   this._loadingService.hideLoading.set(true);
  //   this.trackLoading = true
  //   this._myArtistService.searchTracks(searchString).subscribe({
  //     next: response => {
  //       this.splitNames = response.map(x => ({
  //         name: x.name,
  //         text: x.released,
  //         uuid: x.uuid
  //       }))
  //     },
  //     complete: () => {
  //       this.trackLoading = false;
  //       this._loadingService.hideLoading.set(false);
  //     }
  //   })
  // }

  // dropdownSelected($event: any) {
  //   this.createSplitSheetForm.get('email')?.setValue($event.uuid);
  // }

  // splitSheetSelected($event: any) {
  //   this.createSplitSheetForm.get('name')?.setValue($event.name);
  //   this.createSplitSheetForm.get('track')?.setValue($event.uuid);
  // }

  onPercentChange(controlName: string) {
    if (controlName == 'publishing_splits') {
      this.totalPublishingSplits = this.publishing_splits_total_percent;
    }
    this.totalMasterSplits = this.master_splits_total_percent;

  }

  // onPercentChange(event: any, index: number, controlName: string) {
  //   const newPercentValue = isNaN(parseFloat(event.value)) ? 0 : parseFloat(event.value);
  //   const publishingSplitsArray = this.createSplitSheetForm.get(controlName) as FormArray;
  //   const controls = publishingSplitsArray.controls;

  //   controls.forEach((control: any, i: number) => {
  //     const percentValue = parseFloat(control.get('percent')!.value || 0);
  //     if (i === index && (isNaN(percentValue) || percentValue < 1 || percentValue > 100)) {
  //       control.get('percent')!.setValue(1);
  //     }
  //   });

  //   let totalPercentage = 0;

  //   controls.forEach((control, i) => {
  //     const percentValue = parseFloat(control.get('percent')!.value || 0);
  //     if (i !== index) {
  //       totalPercentage += percentValue;
  //     }
  //   });

  //   if (newPercentValue !== 0) {
  //     const remainingPercentage = 100 - newPercentValue;
  //     const equalPercentage = remainingPercentage / (controls.length - 1);

  //     controls.forEach((control, i) => {
  //       if (i !== index) {
  //         control.get('percent')!.setValue(this.formatPercent(equalPercentage));
  //       }
  //     });
  //   } else {
  //     const equalPercentage = 100 / (controls.length);

  //     controls.forEach((control, i) => {
  //       control.get('percent')!.setValue(this.formatPercent(equalPercentage));
  //     });
  //   }
  // }

  // formatPercent(value: number) {
  //   const formattedValue = value.toFixed(2);
  //   const integerPart = Math.floor(parseFloat(formattedValue));
  //   const decimalPart = parseFloat(formattedValue) - integerPart;
  //   return decimalPart === 0 ? integerPart.toString() : formattedValue;
  // }

  // calculatePercentage(object: [any]) {
  //   let result: any[] = [];
  //   if (object.length > 0) {
  //     let percent = object.map(x => x.percent).map(val => parseFloat(val));
  //     if (percent.length === 1) {
  //       percent[0] = 100;
  //     }
  //     if (percent.some(val => { return val != 0 })) {
  //       let sum = 0
  //       let count = 1;

  //       percent.forEach(item => {
  //         sum = sum + item;
  //         count += 1;
  //       });
  //       let r = 0;
  //       if (sum > 0 && sum <= this.total) {
  //         r = sum / count
  //         if (percent.length == 5) {
  //           return result;
  //         }
  //         object.forEach(item => {
  //           item.percent = r;
  //         });
  //       } else if (sum > this.total) {
  //         return result;
  //       }
  //       else {
  //         r = this.total - sum;
  //       }
  //       object.push({ name: '', email: '', percent: r });
  //       result = object;
  //     }

  //   }
  //   return result;
  // }

  addPublishingSheet() {
    this.publishing_splits.push(
      new FormGroup({
        name: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        role: new FormControl(''),
        percent: new FormControl(0, [Validators.required])
      })
    );
    // let publishingArray = this.createSplitSheetForm.controls['publishing_splits'].value;
    // let percent: any[] = this.calculatePercentage(publishingArray);

    // if (percent.length > 0) {
    //   this.publishing_splits.clear();
    //   percent.forEach(item => {
    //     this.publishing_splits.push(
    //       new FormGroup({
    //         name: new FormControl(item.name, [Validators.required]),
    //         email: new FormControl(item.email, [Validators.required, Validators.email]),
    //         percent: new FormControl(parseFloat(parseFloat(`${item.percent}`).toFixed(2)), [Validators.required])
    //       })
    //     );
    //   });
    // } else {
    //   this._alertService.error("Cannot split more");
    // }
  }

  addMasterSheet() {
    this.master_splits.push(
      new FormGroup({
        name: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        role: new FormControl(''),
        percent: new FormControl(0, [Validators.required])
      })
    );
    // let masterArray = this.createSplitSheetForm.controls['master_splits'].value;
    // let percent: any[] = this.calculatePercentage(masterArray);
    // if (percent.length > 0) {
    //   this.master_splits.clear();
    //   percent.forEach(item => {
    //     this.master_splits.push(
    //       new FormGroup({
    //         name: new FormControl(item.name, [Validators.required]),
    //         email: new FormControl(item.email, [Validators.required, Validators.email]),
    //         percent: new FormControl(parseFloat(parseFloat(`${item.percent}`).toFixed(2)), [Validators.required])
    //       })
    //     );
    //   });
    // } else {
    //   this._alertService.error("Cannot split more");
    // }
  }

  removePublishSplits(index: number) {
    let dataArray = Array.from(this.publishing_splits as any);
    const dataIndex = dataArray.findIndex((x: any, i: number) => i == index)
    if (dataIndex >= 0) {
      this.publishing_splits.removeAt(dataIndex);
      this.totalPublishingSplits = this.publishing_splits_total_percent;
      // const percent = parseFloat(parseFloat(`${100 / Array.from(this.publishing_splits as any).length}`).toFixed(2))
      // const data = Array.from(this.publishing_splits.controls as any).map((x: any) => x.value)
      // this.publishing_splits.clear();
      // data.forEach((item: any) => {
      //   this.publishing_splits.push(
      //     new FormGroup({
      //       name: new FormControl(item.name, [Validators.required]),
      //       email: new FormControl(item.email, [Validators.required]),
      //       percent: new FormControl(percent, [Validators.required])
      //     })
      //   );
      // });
    }
  }

  removeMasterSplits(index: number) {
    let dataArray = Array.from(this.master_splits as any);
    const dataIndex = dataArray.findIndex((x: any, i: number) => i == index)
    if (dataIndex >= 0) {
      this.master_splits.removeAt(dataIndex);
      this.totalMasterSplits = this.master_splits_total_percent;
      // const percent = parseFloat(parseFloat(`${100 / Array.from(this.master_splits as any).length}`).toFixed(2))
      // const data = Array.from(this.master_splits.controls as any).map((x: any) => x.value)
      // this.master_splits.clear();
      // data.forEach((item: any) => {
      //   this.master_splits.push(
      //     new FormGroup({
      //       name: new FormControl(item.name, [Validators.required]),
      //       email: new FormControl(item.email, [Validators.required]),
      //       percent: new FormControl(percent, [Validators.required])
      //     })
      //   );
      // });
    }
  }

  publishingSplitsRole($event: any, index: number) {
    this.publishing_splits.at(index).get('role')?.setValue($event.name);
  }

  masterSplitsRole($event: any, index: number) {
    this.master_splits.at(index).get('role')?.setValue($event.name);
  }

  reviewSheet() {
    if (this.totalPublishingSplits > 100) {
      this._alertService.error("Publishing percentage can't be grater then 100");
    } else if (this.totalMasterSplits > 100) {
      this._alertService.error("Master percentage can't be grater then 100");
    }
    this._myArtistService.getSplitSheet({
      isrc: this.createSplitSheetForm.get('isrc')?.value
    }).subscribe({
      next: response => {
        if (response.results.length == 0) {
          this.reviewSheetData.emit()
        } else {
          this._alertService.error("Track with above ISRC already exist");
        }
      }
    })
  }

  navigateToHome() {
    this._navigationService.navigateToHome();
  }
}
