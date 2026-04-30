import { Injectable } from '@angular/core';
import { TeamConfigDto } from './teams-config.service';

export interface TeamBranding {
  slug: string;
  teamName: string;
  teamLogo: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  authPromo: {
    imageSrc: string;
    imageAlt: string;
    tagline: string;
    bodyClass?: string;
  };
  sidenav: {
    background: string;
    border: string;
    activeBackground: string;
    activeBorder: string;
    text: string;
    mutedText: string;
  };
}

const DEFAULT_TEAM_SLUG = 'cfmontreal';

const TEAM_BRANDING: Record<string, TeamBranding> = {
  cfmontreal: {
    slug: 'cfmontreal',
    teamName: 'CF Montréal',
    teamLogo: 'assets/images/icons/logoMontreal.png',
    tagline: 'Tous ensemble, droit devant',
    primaryColor: '#003DA6',
    secondaryColor: '#FFFFFF',
    authPromo: {
      imageSrc: 'assets/images/icons/Montreal.png',
      imageAlt: 'CF Montréal',
      tagline: 'TOUS ENSEMBLE, DROIT DEVANT',
      bodyClass: 'bg-primary-gradient-montreal'
    },
    sidenav: {
      background: '#000000',
      border: '#404040',
      activeBackground: '#262626',
      activeBorder: '#FFFFFF',
      text: '#E5E5E5',
      mutedText: '#A3A3A3'
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class TeamBrandingService {
  private readonly activeTeamKey = 'active_team_slug';
  private remoteBranding: Record<string, TeamBranding> = {};

  getBranding(teamSlug: string | null | undefined): TeamBranding {
    const slug = (teamSlug ?? '').toString().trim().toLowerCase();
    return this.remoteBranding[slug] ?? TEAM_BRANDING[slug] ?? TEAM_BRANDING[DEFAULT_TEAM_SLUG];
  }

  setActiveTeamSlug(teamSlug: string): void {
    const slug = (teamSlug ?? '').toString().trim().toLowerCase();
    if (!slug) {
      return;
    }
    try {
      localStorage.setItem(this.activeTeamKey, slug);
    } catch {
      // ignore
    }
  }

  getActiveTeamSlug(): string {
    try {
      const fromStorage = localStorage.getItem(this.activeTeamKey);
      return (fromStorage ?? DEFAULT_TEAM_SLUG).toString().trim().toLowerCase() || DEFAULT_TEAM_SLUG;
    } catch {
      return DEFAULT_TEAM_SLUG;
    }
  }

  getStoredTeamSlugOrNull(): string | null {
    try {
      const fromStorage = localStorage.getItem(this.activeTeamKey);
      const slug = (fromStorage ?? '').toString().trim().toLowerCase();
      return slug || null;
    } catch {
      return null;
    }
  }

  getActiveBranding(): TeamBranding {
    return this.getBranding(this.getActiveTeamSlug());
  }

  applyCssVars(branding: TeamBranding): void {
    const root = document.documentElement;
    root.style.setProperty('--team-primary', branding.primaryColor);
    root.style.setProperty('--team-secondary', branding.secondaryColor);
    const primaryRgb = this.toRgbTriplet(branding.primaryColor);
    if (primaryRgb) {
      root.style.setProperty('--team-primary-rgb', primaryRgb);
    }
    // Sidenav background is always black across clubs.
    root.style.setProperty('--sidenav-bg', '#000000');
    root.style.setProperty('--sidenav-border', branding.sidenav.border);
    // Sidenav button highlight uses team primary.
    root.style.setProperty('--sidenav-active-border', branding.primaryColor);
    if (primaryRgb) {
      root.style.setProperty('--sidenav-active-bg', `rgba(${primaryRgb}, 0.16)`);
    } else {
      root.style.setProperty('--sidenav-active-bg', branding.sidenav.activeBackground);
    }
    root.style.setProperty('--sidenav-text', branding.sidenav.text);
    root.style.setProperty('--sidenav-muted-text', branding.sidenav.mutedText);
  }

  private toRgbTriplet(color: string | null | undefined): string | null {
    const raw = (color ?? '').toString().trim();
    if (!raw) {
      return null;
    }

    if (raw.startsWith('#')) {
      const hex = raw.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        if ([r, g, b].every((n) => Number.isFinite(n))) {
          return `${r}, ${g}, ${b}`;
        }
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if ([r, g, b].every((n) => Number.isFinite(n))) {
          return `${r}, ${g}, ${b}`;
        }
      }
      return null;
    }

    const match = raw.match(/rgba?\(([^)]+)\)/i);
    if (match?.[1]) {
      const parts = match[1].split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        if ([r, g, b].every((n) => Number.isFinite(n))) {
          return `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
        }
      }
    }

    return null;
  }

  upsertRemoteBrandingFromDto(dto: TeamConfigDto): TeamBranding {
    const slug = (dto?.slug ?? '').toString().trim().toLowerCase() || DEFAULT_TEAM_SLUG;
    const fallback = this.getBranding(slug);

    const teamName = (dto?.team_name ?? '').toString().trim() || fallback.teamName;
    const teamLogo =
      (dto?.team_logo_url ?? '').toString().trim() ||
      (dto?.auth_promo?.image_url ?? '').toString().trim() ||
      fallback.teamLogo;
    const tagline = (dto?.tagline ?? '').toString().trim() || fallback.tagline;

    const primaryColor = (dto?.colors?.primary ?? '').toString().trim() || fallback.primaryColor;
    const secondaryColor = (dto?.colors?.secondary ?? '').toString().trim() || fallback.secondaryColor;

    const promoImageSrc = (dto?.auth_promo?.image_url ?? '').toString().trim() || fallback.authPromo.imageSrc;
    const promoImageAlt = (dto?.auth_promo?.image_alt ?? '').toString().trim() || fallback.authPromo.imageAlt;
    const promoTagline = (dto?.auth_promo?.tagline ?? '').toString().trim() || fallback.authPromo.tagline;

    const branding: TeamBranding = {
      ...fallback,
      slug,
      teamName,
      teamLogo,
      tagline,
      primaryColor,
      secondaryColor,
      authPromo: {
        ...fallback.authPromo,
        imageSrc: promoImageSrc,
        imageAlt: promoImageAlt,
        tagline: promoTagline,
        bodyClass: fallback.authPromo.bodyClass ?? (slug === 'cfmontreal' ? 'bg-primary-gradient-montreal' : 'bg-primary-gradient')
      },
      sidenav: {
        background: '#000000',
        border: (dto?.sidenav?.border ?? '').toString().trim() || fallback.sidenav.border,
        activeBackground: fallback.sidenav.activeBackground,
        activeBorder: fallback.sidenav.activeBorder,
        text: (dto?.sidenav?.text ?? '').toString().trim() || fallback.sidenav.text,
        mutedText: (dto?.sidenav?.muted_text ?? '').toString().trim() || fallback.sidenav.mutedText,
      }
    };

    this.remoteBranding = { ...this.remoteBranding, [slug]: branding };
    return branding;
  }
}
