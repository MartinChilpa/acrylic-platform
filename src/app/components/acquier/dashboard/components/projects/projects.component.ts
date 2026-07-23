import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ProjectsService } from '../../../../../services/projects.service';
import { IFavoriteResult, IProjectResult } from '../../../../../interfaces/response/projects.response';
import { TrackRowProjectsComponent } from '../track-row-projects/track-row-projects.component';

@Component({
  selector: 'acrylic-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, TrackRowProjectsComponent],
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

  ngOnInit(): void {
    this.loadAll();
    this.projectsService.favorites$.subscribe((favs) => {
      this.favorites = favs;
    });
  }

  private loadAll(): void {
    this.loading = true;
    this.projectsService.loadFavorites();
    // Temporarily disable projects list fetch (backend endpoint returns 404).
    // this.projectsService.getProjects().subscribe({
    //   next: (res) => {
    //     this.projects = Array.isArray(res) ? (res as any) : (res.results ?? []);
    //     this.loading = false;
    //   },
    //   error: () => { this.loading = false; }
    // });

    // Ensure UI stops showing a loading state while backend is unavailable.
    this.loading = false;
  }

  toggleExpand(uuid: string): void {
    this.expandedUuid = this.expandedUuid === uuid ? null : uuid;
  }

  startCreating(): void {
    this.isCreating = true;
    this.newProjectName = '';
    this.newProjectDesc = '';
  }

  cancelCreate(): void {
    this.isCreating = false;
  }

  submitCreate(): void {
    const name = this.newProjectName.trim();
    if (!name) { return; }
    this.projectsService.createProject(name, this.newProjectDesc.trim() || undefined).subscribe({
      next: (project) => {
        this.projects = [project, ...this.projects];
        this.isCreating = false;
      }
    });
  }

  removeTrack(project: IProjectResult, track: IFavoriteResult): void {
    this.projectsService.removeTrackFromProject(project.uuid, track.uuid).subscribe({
      next: () => {
        project.tracks = project.tracks.filter((t: IFavoriteResult) => t.uuid !== track.uuid);
      }
    });
  }

  addToProject(event: Event, fav: IFavoriteResult): void {
    const select = event.target as HTMLSelectElement;
    const projectUuid = select.value;
    if (!projectUuid) { return; }
    this.projectsService.addTrackToProject(projectUuid, fav.uuid).subscribe({
      next: () => {
        const project = this.projects.find((p) => p.uuid === projectUuid);
        if (project && !project.tracks.find((t) => t.uuid === fav.uuid)) {
          project.tracks = [...project.tracks, fav];
        }
      }
    });
    select.value = '';
  }

  unfavorite(fav: IFavoriteResult): void {
    this.projectsService.toggleFavorite(fav.track_uuid).subscribe();
  }

  isFavoritedInProject(project: IProjectResult, fav: IFavoriteResult): boolean {
    return project.tracks.some((t: IFavoriteResult) => t.uuid === fav.uuid);
  }

  getEmptySlots(project: IProjectResult): null[] {
    return Array(Math.max(0, 3 - project.tracks.length)).fill(null);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/others/default.jpg';
  }

  /**
   * The object to feed the track row.
   * - Optimistic favorites embed the full track object.
   * - Backend favorites may embed nested `track` payloads.
   * - If no rich snapshot exists, render the base favorite row.
   */
  rowTrack(fav: IFavoriteResult): any {
    const candidate = fav.track && typeof fav.track === 'object' ? fav.track : fav;
    return candidate?.track && typeof candidate.track === 'object' ? candidate.track : candidate;
  }
}
