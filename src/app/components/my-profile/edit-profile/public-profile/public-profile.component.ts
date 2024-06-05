import { Component, OnInit, effect, inject } from '@angular/core';
import { MyArtistService } from '../../../../services/my-artist.service';
import { IMyArtist } from '../../../../interfaces/response/my-artist.response';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'acrylic-public-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.scss'
})
export class PublicProfileComponent implements OnInit {
  publicProfileForm!: FormGroup;
  private _myArtistService = inject(MyArtistService);
  private _alertService = inject(AlertService);
  private _fb = inject(FormBuilder);

  myArtist: IMyArtist | undefined | null;

  constructor() {
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
      this.publicProfileForm.patchValue({
        uuid: this.myArtist?.uuid,
        name: this.myArtist?.name,
        slug: this.myArtist?.slug,
        bio: this.myArtist?.bio,
        soundcloud_url: this.myArtist?.soundcloud_url,
        spotify_url: this.myArtist?.spotify_url,
        itunes_url: this.myArtist?.itunes_url,
        tiktok_url: this.myArtist?.tiktok_url,
        instagram_url: this.myArtist?.instagram_url,
      });
    })
  }

  ngOnInit(): void {
    this.publicProfileForm = this._fb.group({
      uuid: [null],
      name: [null, Validators.required],
      slug: [null, Validators.required],
      bio: [null, Validators.required],
      soundcloud_url: [null, Validators.required],
      spotify_url: [null, Validators.required],
      itunes_url: [null, Validators.required],
      tiktok_url: [null, Validators.required],
      instagram_url: [null, Validators.required],
    });
  }

  saveProfile() {
    const payload = {
      ...this.myArtist,
      ...this.publicProfileForm.value
    }
    delete payload.background_image
    delete payload.image
    this._myArtistService.updateMyArtist(payload).subscribe({
      next: response => {
        this._alertService.success('Saved successfully!!')
      }
    })
  }
}
