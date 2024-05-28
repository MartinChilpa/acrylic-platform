import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { MyArtistService } from '../../../services/my-artist.service';
import { ICreateTracks } from '../../../interfaces/response/create-tracks.response';
import { TrackDetail } from '../../../interfaces/response/my-artist-synclist.response';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'acrylic-add-track',
  standalone: true,
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './add-track.component.html',
  styleUrl: './add-track.component.scss'
})
export class AddTrackComponent implements OnInit {
  searchForm!: FormGroup;
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);
  private debounceSubject: Subject<void> = new Subject<void>();
  trackList: ICreateTracks[] = [];
  @Input() synclistTracks!: TrackDetail[];
  @Input() synclistId: string = '';

  ngOnInit(): void {
    this.searchForm = this._fb.group({
      searchText: ['']
    });

    this.getTracks();
    this.debounceSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.getSearchTracks()
    });
  }

  getTracks() {
    this._myArtistService.getTracks().subscribe({
      next: response => {
        this.trackList = this.filterTracks(response.results);
      }
    })
  }

  searchChanges() {
    this.debounceSubject.next();
  }

  getSearchTracks() {
    this._myArtistService.searchTracks(this.searchForm.get('searchText')?.value).subscribe({
      next: response => {
        const newTracks = response.results;
        this.trackList = this.updateTrackList(newTracks);
      }
    });
  }

  synclistChecked(trackId: string) {
    if (this.synclistTracks && Array.isArray(this.synclistTracks)) {
      return this.synclistTracks.some(x => x.uuid == trackId)
    }
    return false;
  }

  filterTracks(tracks: any[]): any[] {
    return tracks.filter(track => this.synclistChecked(track.uuid));
  }

  updateTrackList(newTracks: any[]) {
    const matchedTracks = newTracks.filter(track => this.synclistChecked(track.uuid));
    const unmatchedTracks = newTracks.filter(track => !this.synclistChecked(track.uuid));
    const persistentMatchedTracks = this.trackList.filter(track => this.synclistChecked(track.uuid));
    if (!this.searchForm.get('searchText')?.value) {
      return persistentMatchedTracks;
    }
    const combinedMatchedTracks = [...persistentMatchedTracks, ...matchedTracks].filter((track, index, self) =>
      index === self.findIndex(t => t.uuid === track.uuid)
    );
    return [...combinedMatchedTracks, ...unmatchedTracks];
  }

  manageTags($event: any, trackId: string) {
    if (!this.synclistTracks) {
      this.synclistTracks = []
    }
    const tagManageType = $event.checked ? this._myArtistService.addSynclistTrack(this.synclistId, trackId) : this._myArtistService.removeSynclistTrack(this.synclistId, trackId)
    tagManageType.subscribe({
      next: response => {
        if ($event.checked) {
          this.synclistTracks.push(this.trackList.find(x => x.uuid == trackId) as any)
        } else {
          this.synclistTracks = this.synclistTracks.filter(x => x.uuid != trackId);
        }
      },
      error: () => {
        $event.checked = false;
      }
    });
  }
}
