import { Component, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PublicProfileComponent } from './public-profile/public-profile.component';
import { ProfileSecurityComponent } from './profile-security/profile-security.component';
import { ProfileNotificationComponent } from './profile-notification/profile-notification.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'acrylic-edit-profile',
  standalone: true,
  imports: [NgClass],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent implements OnInit {
  @ViewChild('acrylicEditProfileRef', { static: true, read: ViewContainerRef }) acrylicEditProfileRef!: ViewContainerRef;
  componentRefs!: ComponentRef<any>;

  activeProfileIndex: number = 1;

  ngOnInit(): void {
    this.loadComponent(this.activeProfileIndex);
  }

  editProfileTab(index: number) {
    this.activeProfileIndex = index;
    this.loadComponent(this.activeProfileIndex);
  }

  async loadComponent(step: number) {
    this.acrylicEditProfileRef.clear();
    switch (step) {
      case 1:
        const { PublicProfileComponent } = await import('./public-profile/public-profile.component');
        this.componentRefs = this.acrylicEditProfileRef.createComponent(PublicProfileComponent);
        break;
      case 2:
        const { ProfileSecurityComponent } = await import('./profile-security/profile-security.component');
        this.componentRefs = this.acrylicEditProfileRef.createComponent(ProfileSecurityComponent);
        break;
      case 3:
        const { ProfileNotificationComponent } = await import('./profile-notification/profile-notification.component');
        this.componentRefs = this.acrylicEditProfileRef.createComponent(ProfileNotificationComponent);
        break;
      default:
        const { PublicProfileComponent: DefaultComponent } = await import('./public-profile/public-profile.component');
        this.componentRefs = this.acrylicEditProfileRef.createComponent(DefaultComponent);
    }
  }
}
