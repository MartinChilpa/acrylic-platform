import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { FormGroup } from '@angular/forms';
import { NavigationService } from '../../../services/navigation.service';
import { LoaderService } from '../../../services/loader.service';
import { MyArtistService } from '../../../services/my-artist.service';
import { ISplitSheetResult } from '../../../interfaces/response/split-sheet.response';

@Component({
  selector: 'acrylic-upload-step-1',
  standalone: true,
  imports: [NgClass, CustomDropdownComponent],
  templateUrl: './upload-step-1.component.html',
  styleUrl: './upload-step-1.component.scss'
})
export class UploadStep1Component implements OnInit {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();
  public _navigationService = inject(NavigationService);
  public _loadingService = inject(LoaderService);
  public _myArtistService = inject(MyArtistService);
  selectedSplitSheet!: ISplitSheetResult;
  splitSheets: ISplitSheetResult[] = [];
  splitNames: any[] = [];
  splitSheetLoading: boolean = false;

  ngOnInit(): void {
    this.getSplitSheetDetail()
  }

  getSplitSheetDetail() {
    const isrc = this.form.get('isrc')?.value;
    if (isrc) {
      this._myArtistService.getSplitSheet({
        isrc: isrc
      }).subscribe({
        next: response => {
          this.selectedSplitSheet = response.results[0]
        }
      })
    }
  }

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  dropdownSelected($event: any) {
    this.selectedSplitSheet = <ISplitSheetResult>this.splitSheets.find(x => x.uuid == $event.splitSheetId);
    this.form.get('isrc')?.setValue($event.isrc);
  }

  searchTrack(searchString: string) {
    if (!searchString) {
      this.splitNames = []
      return;
    }
    this._loadingService.hideLoading.set(true);
    this.splitSheetLoading = true
    this._myArtistService.getSplitSheet({
      search: searchString,
      is_signed: true
    }).subscribe({
      next: response => {
        this.splitSheets = response.results;
        this.splitNames = response.results.map(x => ({
          name: x.track?.name ? x.track?.name : x.isrc,
          isrc: x.track?.isrc ? x.track?.isrc : x.isrc,
          text: x.signed ? new Date(x.signed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null,
          uuid: x.track?.uuid,
          splitSheetId: x.uuid
        }));
      },
      complete: () => {
        this.splitSheetLoading = false;
        this._loadingService.hideLoading.set(false);
      }
    })
  }
}
