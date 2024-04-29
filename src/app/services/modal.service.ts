import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor() { }

  showModal(id: string) {
    const modal = document.getElementById(id)
    if (modal) {
      const liveUpload = new (window as any).bootstrap.Modal(modal);
      liveUpload.show();
    }
  }

  hideModal(id: string) {
    const modal = document.getElementById(id)
    if (modal) {
      const liveUpload = new (window as any).bootstrap.Modal(modal);
      liveUpload.hide();
    }
    document.querySelector('.modal-backdrop')?.remove()
  }
}
