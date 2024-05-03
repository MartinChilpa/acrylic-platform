import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import { NgFor } from '@angular/common';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'acrylic-create-split-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor],
  templateUrl: './create-split-sheet.component.html',
  styleUrl: './create-split-sheet.component.scss'
})
export class CreateSplitSheetComponent implements OnInit {

  createSplitSheetForm!: FormGroup;
  reveiwBtnClick: boolean = false;
  publishingSheetForms: any[] = [{}];
  masterSheetForms: any[] = [{}];
  total: number = 100;
  totalPublishingPercentage: number = 100;
  totalMasteringPercentage: number = 100;
  reviewObject: any = {};

  private _fb = inject(FormBuilder);
  public _navigationService = inject(NavigationService);
  private _alertService = inject(AlertService);


  ngOnInit(): void {
    this.createSplitSheetForm = this._fb.group({
      isrcCode: ['', Validators.required],
      email: ['', Validators.required],
      publishing: new FormArray([
        new FormGroup({
          name: new FormControl(''),
          email: new FormControl(''),
          percentage: new FormControl('100')
        })
      ]),
      mastering: new FormArray([
        new FormGroup({
          name: new FormControl(''),
          email: new FormControl(''),
          percentage: new FormControl(100)
        })
      ])
    });

    console.log(this.createSplitSheetForm);
  }

  get publishing(): FormArray {
    return this.createSplitSheetForm.get('publishing') as FormArray;
  }

  get mastering(): FormArray {
    return this.createSplitSheetForm.get('mastering') as FormArray;
  }

  calculatePercentage(object: [any]) {
    let result: any[] = [];
    if (object.length > 0) {
      let percentage = object.map(x => x.percentage).map(val => parseFloat(val));
      if (percentage.some(val => { return val != 0 })) {
        let sum = 0
        let count = 1;

        percentage.forEach(item => {
          sum = sum + item;
          count += 1;
        });

        let r = 0;
        if (sum > 0 && sum === this.total) {
          r = sum / count
          object.forEach(item => {
            item.percentage = r;
          });
        } else if (sum > this.total) {
          return result;
        }
        else {
          r = this.total - sum;
        }
        object.push({ name: '', email: '', percentage: r });
        result = object;
      }

    }
    return result;
  }

  addPublishingSheet() {
    let publishingArray = this.createSplitSheetForm.controls['publishing'].value;
    let percentage: any[] = this.calculatePercentage(publishingArray);
    if (percentage.length > 0) {
      this.publishing.clear();
      percentage.forEach(item => {
        this.publishing.push(
          new FormGroup({
            name: new FormControl(item.name),
            email: new FormControl(item.email),
            percentage: new FormControl(item.percentage)
          })
        );
      });
    } else {
      this._alertService.error("Cannot split more");
    }


  }

  addMasterSheet() {
    let masterArray = this.createSplitSheetForm.controls['mastering'].value;
    let percentage: any[] = this.calculatePercentage(masterArray);
    if (percentage.length > 0) {
      this.mastering.clear();
      percentage.forEach(item => {
        this.mastering.push(
          new FormGroup({
            name: new FormControl(item.name),
            email: new FormControl(item.email),
            percentage: new FormControl(item.percentage)
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
      publishing: controls['publishing'].value,
      mastering: controls['mastering'].value
    };
    this.reveiwBtnClick = true;
  }

  backToSplitSheetForm() {
    this.reveiwBtnClick = false;
  }

  sendRequestToCreateSheet() {
    console.log(this.reviewObject);
  }

  navigateToHome() {
    this._navigationService.navigateToHome();
  }
}
