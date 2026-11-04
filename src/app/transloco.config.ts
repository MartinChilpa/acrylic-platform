import { Translation, TranslocoLoader, provideTransloco, TranslocoService } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { Injectable, APP_INITIALIZER } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const SUPPORTED_LANGS = ['en', 'es', 'fr'];

export function normalizeLanguage(lang: string | null): string {
	if (!lang) return 'en';
	const normalized = lang.toString().trim().toLowerCase();
	if (SUPPORTED_LANGS.includes(normalized)) {
		return normalized;
	}
	const primary = normalized.split(/[-_]/)[0];
	return SUPPORTED_LANGS.includes(primary) ? primary : 'en';
}

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
	constructor(private http: HttpClient) {}

	getTranslation(lang: string): Observable<Translation> {
		return this.http.get<Translation>(`/assets/i18n/${lang}.json`).pipe(
			catchError((err) => {
				console.error(`Failed to load i18n/${lang}.json:`, err);
				if (lang !== 'en') {
					return this.http.get<Translation>(`/assets/i18n/en.json`);
				}
				throw err;
			})
		);
	}
}

@Injectable({ providedIn: 'root' })
export class TranslocoInitializer {
	constructor(private transloco: TranslocoService) {}

	/**
	 * Resolves once the active language is loaded, so the first render never
	 * runs with an empty dictionary. Before, every synchronous translate() in a
	 * template logged a missing-key warning until the file arrived; Sentry's
	 * replay turned each warning into another change detection, and the first
	 * load spun for ~20 s. A failed load still lets the app start.
	 */
	init(): Promise<unknown> {
		const storedLang = normalizeLanguage(localStorage.getItem('activeLanguage'));
		this.transloco.setDefaultLang('en');
		this.transloco.setActiveLang(storedLang);
		return firstValueFrom(this.transloco.load(storedLang)).catch(() => undefined);
	}
}

export const translocoProviders = [
	provideTransloco({
		config: {
			availableLangs: SUPPORTED_LANGS,
			defaultLang: 'en',
			fallbackLang: 'en',
			reRenderOnLangChange: true,
		},
		loader: TranslocoHttpLoader,
	}),
	{
		provide: APP_INITIALIZER,
		useFactory: (initializer: TranslocoInitializer) => () => initializer.init(),
		deps: [TranslocoInitializer],
		multi: true,
	},
];
