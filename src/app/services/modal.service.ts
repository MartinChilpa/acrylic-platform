import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor() {}

  showModal(id: string) {
    const modal = document.getElementById(id);
    if (!modal) {
      return;
    }

    const bootstrap = (window as any).bootstrap;
    const Modal = bootstrap?.Modal;
    if (!Modal) {
      return;
    }

    const instance = typeof Modal.getOrCreateInstance === 'function'
      ? Modal.getOrCreateInstance(modal)
      : new Modal(modal);
    instance.show();
  }

  hideModal(id: string) {
    const modal = document.getElementById(id);
    const bootstrap = (window as any).bootstrap;
    const Modal = bootstrap?.Modal;
    if (modal && Modal) {
      const instance = typeof Modal.getOrCreateInstance === 'function'
        ? Modal.getOrCreateInstance(modal)
        : new Modal(modal);
      instance.hide();
    }
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
  }
}
