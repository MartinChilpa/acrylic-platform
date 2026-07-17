import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  public isLoading = signal(false);
  public hideLoading = signal(false);

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  getHideLoading(): boolean {
    return this.hideLoading();
  }
}
