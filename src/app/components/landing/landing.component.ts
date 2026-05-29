import { Component, OnInit, inject, HostListener, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthUtils } from '../../utils/auth.utils';
import { NavigationService } from '../../services/navigation.service';

interface FAQItem {
  question: string;
  answer: string;
}

type FaqTab = 'sports' | 'artists';

@Component({
  selector: 'acrylic-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private authService = inject(AuthService);
  private navigationService = inject(NavigationService);

  // UI State
  menuOpen = false;
  scrollPosition = 0;
  activeFaqTab: FaqTab = 'sports';

  sportsFaqItems: FAQItem[] = [
    {
      question: 'How is Acrylic different from stock music platforms?',
      answer: 'Stock music libraries offer generic tracks with no real fanbase or audience connection. Acrylic gives you access to real artists whose music resonates with specific demographics — all pre-cleared so you can publish instantly.'
    },
    {
      question: 'Do I need a music supervisor or legal team?',
      answer: 'No. Acrylic handles all rights clearances before you access any track. Every license is built into the platform, so your team can move fast without legal overhead.'
    },
    {
      question: 'What types of content is Acrylic designed for?',
      answer: 'Acrylic is built for sports social media content — match highlights, player features, behind-the-scenes, fan engagement campaigns, and live event coverage across Instagram, TikTok, YouTube, and more.'
    },
    {
      question: 'How is Acrylic different from TikTok or Instagram commercial music libraries?',
      answer: 'Platform-native libraries restrict use to their own apps and offer limited licensing. Acrylic gives you cross-platform rights, real artist music, and performance data to match the right track to the right audience.'
    }
  ];

  artistsFaqItems: FAQItem[] = [
    {
      question: 'How do I submit my music to Acrylic?',
      answer: 'Click "Join the Music Catalog" on this page to send us an intro email. Our team reviews submissions and will reach out if your music is a good fit for the platform.'
    },
    {
      question: 'How does licensing revenue work?',
      answer: 'Every time a sports organization uses your track, you earn a licensing fee. Acrylic pays artists directly and transparently — no hidden deductions, no waiting.'
    },
    {
      question: 'What rights do I keep when licensing through Acrylic?',
      answer: 'You retain full ownership of your music. Acrylic only handles sync licensing for specific campaigns — your masters and publishing remain entirely yours.'
    },
    {
      question: 'How is my music matched to sports organizations?',
      answer: 'Our AI analyzes content mood, fanbase demographics, and engagement data to recommend the right track for each campaign. You get exposure to the exact audiences most likely to connect with your sound.'
    }
  ];

  // Legacy - kept for compatibility
  faqItems: FAQItem[] = this.sportsFaqItems;

  @ViewChildren('faqDetails') faqDetails!: QueryList<ElementRef>;

  ngOnInit(): void {
    // Check if user is already authenticated
    const token = this.authService.accessToken;
    if (token && !AuthUtils.isTokenExpired(token)) {
      // Redirect based on user type
      if (this.authService.isLabelUserType()) {
        this.navigationService.navigateToLabelHome();
        return;
      }
      if (this.authService.isArtistUserType()) {
        this.navigationService.navigateToHome();
        return;
      }
      this.navigationService.navigateToAcquierDashboard();
    }
  }

  /**
   * Track scroll position for header effects
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.scrollPosition = window.scrollY;
  }

  /**
   * Toggle mobile navigation menu
   */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Close menu when a link is clicked
   */
  closeMenu(): void {
    this.menuOpen = false;
  }

  /**
   * Smooth scroll to a section
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.closeMenu();
    }
  }

  setFaqTab(tab: FaqTab): void {
    this.activeFaqTab = tab;
  }

  /**
   * Toggle FAQ item
   */
  toggleFAQ(index: number): void {
    const detail = this.faqDetails.get(index);
    if (detail) {
      const detailElement = detail.nativeElement as HTMLDetailsElement;
      detailElement.open = !detailElement.open;
    }
  }
}

