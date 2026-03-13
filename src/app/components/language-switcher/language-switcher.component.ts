import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type LanguageOption = {
  code: string;
  labelKey: string;
  icon: string;
};

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
})
export class LanguageSwitcherComponent {
  private readonly translate = inject(TranslateService);
  private readonly eRef = inject(ElementRef);

  readonly options: LanguageOption[] = [
    { code: 'vi', labelKey: 'language.vi', icon: 'assets/icons/lang_vietnam.png' },
    { code: 'en', labelKey: 'language.en', icon: 'assets/icons/lang_us.png' },
  ];

  readonly currentLang = signal(this.translate.currentLang || this.translate.defaultLang || 'vi');
  isDropdownOpen = false;

  constructor() {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang) {
      this.currentLang.set(savedLang);
    }

    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event?.lang) {
        this.currentLang.set(event.lang);
      }
    });
  }

  get currentOption(): LanguageOption {
    return this.options.find((opt) => opt.code === this.currentLang()) || this.options[0];
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  setLang(lang: string): void {
    if (!lang || lang === this.currentLang()) return;
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem('app_lang', lang);
    document.documentElement.lang = lang;
    this.isDropdownOpen = false;
  }
}
