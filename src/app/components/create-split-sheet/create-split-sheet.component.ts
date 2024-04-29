import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'acrylic-create-split-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor],
  templateUrl: './create-split-sheet.component.html',
  styleUrl: './create-split-sheet.component.scss'
})
export class CreateSplitSheetComponent implements OnInit{

  createSplitSheetForm!: FormGroup;
  reveiwBtnClick:boolean = false;
  publishingSheetForms: any[] = [{}];
  masterSheetForms: any[] = [{}];

  private _fb = inject(FormBuilder);
  public _navigationService = inject(NavigationService);


  ngOnInit(): void {
    this.createSplitSheetForm = this._fb.group({
      isrcCode: ['', Validators.required],
      email: ['', Validators.required],
      publishing: new FormArray([
        new FormGroup ({
          name: new FormControl(''),
          email: new FormControl(''),
          percentage: new FormControl('')
        })
      ]),
      mastering: new FormArray([
        new FormGroup ({
          name: new FormControl(''),
          email: new FormControl(''),
          percentage: new FormControl('')
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

  addPublishingSheet () {
    this.publishing.push(
      new FormGroup({
        name: new FormControl(''),
        email: new FormControl(''),
        percentage: new FormControl('')
      })
    );
  }

  addMasterSheet () {
    this.mastering.push(
      new FormGroup({
        name: new FormControl(''),
        email: new FormControl(''),
        percentage: new FormControl('')
      })
    );
  }

  reviewSheet () {
    this.reveiwBtnClick = true;
  }

  backToSplitSheetForm () {
    this.reveiwBtnClick = false;
    console.log(this.createSplitSheetForm.patchValue);
  }

  sendRequestToCreateSheet () {
    console.log(this.createSplitSheetForm.value);
  }

  navigateToHome () {
    this._navigationService.navigateToHome();
  }

}
