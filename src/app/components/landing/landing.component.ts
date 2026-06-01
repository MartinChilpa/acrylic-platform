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
      answer: 'Stock music is easy to license but generic by design. Acrylic connects you with real artists whose music already has fans, so your content carries an identity your audience can actually connect with. Every track is cleared and ready to use. Our campaigns all landed in the 90th percentile for engagement, with music licensed in clicks.'
    },
    {
      question: 'Do I need a music supervisor or legal team?',
      answer: 'No. Acrylic handles rights verification, licensing, and clearance. Your content and social teams pick music that presents no legal bottleneck, no back-and-forth with music rightsholders.'
    },
    {
      question: 'What types of content is Acrylic designed for?',
      answer: 'Mainly for editorial sports social content, in other words content with no intent to sell, no call-to-action. Match highlights, pregame hype, player features, season recaps, behind-the-scenes: content your fans actually watch and share.'
    },
    {
      question: 'How is Acrylic different from TikTok or Instagram commercial music libraries?',
      answer: 'Brands are restricted to a limited, often generic library of music on social platforms with little data to guide their choices. Acrylic licenses fan-backed music brands would not typically have access to, along with data to maximize the performance of every post.'
    }
  ];

  artistsFaqItems: FAQItem[] = [
    {
      question: 'Who can submit music?',
      answer: 'Any artist, songwriter, or rightsholder who controls or can authorize both the master recording and publishing rights for use in third-party content. If you share rights with others, all parties need to agree before you submit.'
    },
    {
      question: "Can’t sports organizations simply use my music if it’s already available on Instagram or TikTok?",
      answer: "No. Sports organizations are commercial entities and don't have access to the music on those platforms the way private users do. They need a direct license. Acrylic is the bridge that makes that easy and legal for everyone."
    },
    {
      question: 'Will I get paid?',
      answer: "Yes. Acrylic pays a fee for every placement. The size of that fee depends on the placement tier you select for each song. For example, our ArtistPromo tier offers a limited fee to prioritize exposure and discovery, giving your music premium visibility in high-engagement sports content with a fanbase that's already primed to care. Our Preclear tier includes more upfront compensation. The terms are always clearly stated in the license offer before you sign anything. You pick the tier and the price, and keep 100% of streaming and publishing royalties generated downstream from the placement."
    },
    {
      question: 'How will my music be used?',
      answer: 'Only in editorial sports social content: highlights, game-day posts, player features, and storytelling. No commercial intent, no call-to-action. Your music scores content that fans watch and replay. Any extended commercial use that is considered non-editorial is offered as an opt-in for music rightsholders at onboarding.'
    },

    {
      question: "What if I don't control all the rights?",
      answer: "Do not submit until every rightsholder involved has agreed. When you submit, you'll need to include the email addresses of any co-owners so they also receive the license offer. It's your responsibility to align with them first."
    },
    {
      question: 'Can I exclude certain sports organizations?',
      answer: 'Yes. During onboarding you can opt out of certain leagues, teams or athletes to ensure they cannot use your music in their content.'
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

