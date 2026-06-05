import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../../../../services/projects.service';
import { IFavoriteResult, IProjectResult } from '../../../../../interfaces/response/projects.response';

@Component({
  selector: 'acrylic-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent implements OnInit {
  private projectsService = inject(ProjectsService);

  projects: IProjectResult[] = [];
  favorites: IFavoriteResult[] = [];
  loading = false;
  expandedUuid: string | null = null;
  isCreating = false;
  newProjectName = '';
  newProjectDesc = '';
  errorMsg: string | null = null;

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    this.projectsService.getProjects().subscribe({
      next: (res) => {
        this.projects = Array.isArray(res) ? res as any : (res.results ?? []);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.projectsService.getFavorites().subscribe({
      next: (res) => {
        this.favorites = Array.isArray(res) ? res as any : (res.results ?? []);
      }
    });
  }

  toggleExpand(uuid: string): void {
    this.expandedUuid = this.expandedUuid === uuid ? null : uuid;
  }

  startCreating(): void {
    this.isCreating = true;
  }

  cancelCreate(): void {
    this.isCreating = false;
    this.newProjectName = '';
    this.newProjectDesc = '';
  }

  submitCreate(): void {
    const name = this.newProjectName.trim();
    if (!name) return;
    const desc = this.newProjectDesc.trim() || undefined;
    this.projectsService.createProject(name, desc).subscribe({
      next: (project) => {
        this.projects.unshift(project);
        this.cancelCreate();
      }
    });
  }

  removeTrack(project: IProjectResult, track: IFavoriteResult): void {
    this.projectsService.removeTrackFromProject(project.uuid, track.uuid).subscribe({
      next: () => {
        project.tracks = project.tracks.filter(t => t.uuid !== track.uuid);
      }
    });
  }

  addToProject(event: Event, fav: IFavoriteResult): void {
    const select = event.target as HTMLSelectElement;
    const projectUuid = select.value;
    if (!projectUuid) return;
    this.projectsService.addTrackToProject(projectUuid, fav.uuid).subscribe({
      next: () => {
        const project = this.projects.find(p => p.uuid === projectUuid);
        if (project && !project.tracks.find(t => t.uuid === fav.uuid)) {
          project.tracks = [...project.tracks, fav];
        }
        select.value = '';
      }
    });
  }

  unfavorite(fav: IFavoriteResult): void {
    this.projectsService.toggleFavorite(fav.track_uuid).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(f => f.uuid !== fav.uuid);
        this.projects.forEach(p => {
          p.tracks = p.tracks.filter(t => t.track_uuid !== fav.track_uuid);
        });
      }
    });
  }

  getEmptySlots(project: IProjectResult): number[] {
    return Array(Math.max(0, 3 - project.tracks.length)).fill(0);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }

  isFavoritedInProject(project: IProjectResult, fav: IFavoriteResult): boolean {
    return project.tracks.some(t => t.uuid === fav.uuid);
  }
}
