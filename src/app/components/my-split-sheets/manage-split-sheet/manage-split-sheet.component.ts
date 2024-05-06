import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationService } from '../../../services/navigation.service';
import { AlertService } from '../../../services/alert.service';
import { IDistributorsResult } from '../../../interfaces/response/distributor.response';
import { DistributorsService } from '../../../services/distributors.service';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { MyArtistService } from '../../../services/my-artist.service';

@Component({
  selector: 'acrylic-manage-split-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, CustomDropdownComponent],
  templateUrl: './manage-split-sheet.component.html',
  styleUrl: './manage-split-sheet.component.scss'
})
export class ManageSplitSheetComponent implements OnInit {

  createSplitSheetForm!: FormGroup;
  reveiwBtnClick: boolean = false;
  publishingSheetForms: any[] = [{}];
  masterSheetForms: any[] = [{}];
  total: number = 100;
  totalPublishingPercentage: number = 100;
  totalMasteringPercentage: number = 100;
  reviewObject: any = {};
  distributors!: IDistributorsResult[]

  private _fb = inject(FormBuilder);
  public _navigationService = inject(NavigationService);
  private _alertService = inject(AlertService);
  private _distributorService = inject(DistributorsService)
  private _myArtistService = inject(MyArtistService)


  ngOnInit(): void {
    this.createSplitSheetForm = this._fb.group({
      isrcCode: ['', Validators.required],
      email: ['', Validators.required],
      publishing_splits: new FormArray([
        new FormGroup({
          name: new FormControl('', [Validators.required]),
          email: new FormControl('', [Validators.required]),
          percent: new FormControl(100, [Validators.required])
        })
      ]),
      master_splits: new FormArray([
        new FormGroup({
          name: new FormControl('', [Validators.required]),
          email: new FormControl('', [Validators.required]),
          percent: new FormControl(100, [Validators.required])
        })
      ])
    });
    this.getDistributors()
  }

  getDistributors() {
    this._distributorService.getDistributorList().subscribe({
      next: response => {
        this.distributors = response.results
      }
    })
  }

  dropdownSelected($event: any) {
    this.createSplitSheetForm.get('email')?.setValue($event.uuid);
  }

  get publishing_splits(): FormArray {
    return this.createSplitSheetForm.get('publishing_splits') as FormArray;
  }

  get master_splits(): FormArray {
    return this.createSplitSheetForm.get('master_splits') as FormArray;
  }

  calculatePercentage(object: [any]) {
    let result: any[] = [];
    if (object.length > 0) {
      let percent = object.map(x => x.percent).map(val => parseFloat(val));
      if (percent.some(val => { return val != 0 })) {
        let sum = 0
        let count = 1;

        percent.forEach(item => {
          sum = sum + item;
          count += 1;
        });
        let r = 0;
        if (sum > 0 && sum <= this.total) {
          r = sum / count
          if (percent.length == 5) {
            return result;
          }
          object.forEach(item => {
            item.percent = r;
          });
        } else if (sum > this.total) {
          return result;
        }
        else {
          r = this.total - sum;
        }
        object.push({ name: '', email: '', percent: r });
        result = object;
      }

    }
    return result;
  }

  addPublishingSheet() {
    let publishingArray = this.createSplitSheetForm.controls['publishing_splits'].value;
    let percent: any[] = this.calculatePercentage(publishingArray);
    if (percent.length > 0) {
      this.publishing_splits.clear();
      percent.forEach(item => {
        this.publishing_splits.push(
          new FormGroup({
            name: new FormControl(item.name, [Validators.required]),
            email: new FormControl(item.email, [Validators.required]),
            percent: new FormControl(parseFloat(parseFloat(`${item.percent}`).toFixed(2)), [Validators.required])
          })
        );
      });
    } else {
      this._alertService.error("Cannot split more");
    }
  }

  addMasterSheet() {
    let masterArray = this.createSplitSheetForm.controls['master_splits'].value;
    let percent: any[] = this.calculatePercentage(masterArray);
    if (percent.length > 0) {
      this.master_splits.clear();
      percent.forEach(item => {
        this.master_splits.push(
          new FormGroup({
            name: new FormControl(item.name, [Validators.required]),
            email: new FormControl(item.email, [Validators.required]),
            percent: new FormControl(parseFloat(parseFloat(`${item.percent}`).toFixed(2)), [Validators.required])
          })
        );
      });
    } else {
      this._alertService.error("Cannot split more");
    }
  }

  reviewSheet() {
    if (this.createSplitSheetForm.invalid)
      return;
    let controls = this.createSplitSheetForm.controls;
    this.reviewObject = {
      isrcCode: controls['isrcCode'].value,
      email: controls['email'].value,
      publishing_splits: controls['publishing_splits'].value,
      master_splits: controls['master_splits'].value
    };
    this.reveiwBtnClick = true;
  }

  backToSplitSheetForm() {
    this.reveiwBtnClick = false;
  }

  sendRequestToCreateSheet() {
    console.log(this.reviewObject);
    this._myArtistService.createSplitSheet(this.reviewObject).subscribe({
      next: response => {
        this._alertService.success("Split sheet created successfully")
      }
    })
  }

  navigateToHome() {
    this._navigationService.navigateToHome();
  }

  distributorName() {
    return this.distributors?.find(x => x.uuid == this.reviewObject?.email)?.name
  }

  removePublishSplits(index: number) {
    let dataArray = Array.from(this.publishing_splits as any);
    const dataIndex = dataArray.findIndex((x: any, i: number) => i == index)
    if (dataIndex >= 0) {
      this.publishing_splits.removeAt(dataIndex)
      const percent = parseFloat(parseFloat(`${100 / Array.from(this.publishing_splits as any).length}`).toFixed(2))
      const data = Array.from(this.publishing_splits.controls as any).map((x: any) => x.value)
      this.publishing_splits.clear();
      data.forEach((item: any) => {
        this.publishing_splits.push(
          new FormGroup({
            name: new FormControl(item.name, [Validators.required]),
            email: new FormControl(item.email, [Validators.required]),
            percent: new FormControl(percent, [Validators.required])
          })
        );
      });
    }
  }

  removeMasterSplits(index: number) {
    let dataArray = Array.from(this.master_splits as any);
    const dataIndex = dataArray.findIndex((x: any, i: number) => i == index)
    if (dataIndex >= 0) {
      this.master_splits.removeAt(dataIndex)
      const percent = parseFloat(parseFloat(`${100 / Array.from(this.master_splits as any).length}`).toFixed(2))
      const data = Array.from(this.master_splits.controls as any).map((x: any) => x.value)
      this.master_splits.clear();
      data.forEach((item: any) => {
        this.master_splits.push(
          new FormGroup({
            name: new FormControl(item.name, [Validators.required]),
            email: new FormControl(item.email, [Validators.required]),
            percent: new FormControl(percent, [Validators.required])
          })
        );
      });
    }
  }
}
