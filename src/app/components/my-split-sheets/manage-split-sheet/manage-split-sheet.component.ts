import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationService } from '../../../services/navigation.service';
import { AlertService } from '../../../services/alert.service';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { MyArtistService } from '../../../services/my-artist.service';
import { NgClass } from '@angular/common';
import { CreateSplitSheetComponent } from '../create-split-sheet/create-split-sheet.component';
import { PreviewSplitSheetComponent } from '../preview-split-sheet/preview-split-sheet.component';

@Component({
  selector: 'acrylic-manage-split-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, CustomDropdownComponent, NgClass, CreateSplitSheetComponent, PreviewSplitSheetComponent],
  templateUrl: './manage-split-sheet.component.html',
  styleUrl: './manage-split-sheet.component.scss'
})
export class ManageSplitSheetComponent implements OnInit {
  activeStepper: number = 1;
  createSplitSheetForm!: FormGroup;
  reveiwBtnClick: boolean = false;
  publishingSheetForms: any[] = [{}];
  masterSheetForms: any[] = [{}];
  total: number = 100;
  totalPublishingPercentage: number = 100;
  totalMasteringPercentage: number = 100;
  reviewObject: any = {};

  manageSplitStepperList = ['Create a sign in split sheet', 'Preview split sheet'];
  private _fb = inject(FormBuilder);
  public _navigationService = inject(NavigationService);
  private _alertService = inject(AlertService);
  private _myArtistService = inject(MyArtistService)

  ngOnInit(): void {
    this.createSplitSheetForm = this._fb.group({
      isrc: ['', [Validators.pattern(/^[A-Z]{2}-?\w{3}-?\d{2}-?\d{5}$/)]],
      name: [''],
      publishing_splits: new FormArray([
        new FormGroup({
          name: new FormControl('', [Validators.required]),
          email: new FormControl('', [Validators.required, Validators.email]),
          role: new FormControl(''),
          percent: new FormControl(100, [Validators.required])
        })
      ]),
      master_splits: new FormArray([
        new FormGroup({
          name: new FormControl('', [Validators.required]),
          email: new FormControl('', [Validators.required, Validators.email]),
          role: new FormControl(''),
          percent: new FormControl(100, [Validators.required])
        })
      ])
    });
  }

  manageSplitStepper(index: number) {
    if (this.activeStepper < index) {
      return;
    }
    this.activeStepper = index;
  }

  backToSplitSheetForm() {
    this.reveiwBtnClick = false;
    this.activeStepper = 1;
  }

  sendRequestToCreateSheet() {
    if (this.reviewObject.publishing_splits) {
      this.reviewObject.publishing_splits.forEach((item: any) => {
        if (!item.role) {
          delete item.role
        }
      })
    }
    if (this.reviewObject.master_splits) {
      this.reviewObject.master_splits.forEach((item: any) => {
        if (!item.role) {
          delete item.role
        }
      })
    }
    this._myArtistService.createSplitSheet(this.reviewObject).subscribe({
      next: response => {
        this._alertService.success("Split sheet created successfully")
        this.requestSignature(response.uuid);
        this._navigationService.navigateToMySplitSheet();
      }
    })
  }

  requestSignature(uuid: string) {
    this._myArtistService.requestSignature(uuid, this.reviewObject).subscribe({
      next: response => {
        this._navigationService.navigateToMySplitSheet();
      }
    })
  }

  reviewSheet() {
    if (this.createSplitSheetForm.invalid)
      return;
    let controls = this.createSplitSheetForm.controls;
    this.reviewObject = {
      isrc: controls['isrc'].value,
      publishing_splits: controls['publishing_splits'].value,
      master_splits: controls['master_splits'].value
    };
    this.reveiwBtnClick = true;
    this.activeStepper = 2;
  }

}
