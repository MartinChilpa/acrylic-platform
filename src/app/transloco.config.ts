import { Translation, TranslocoLoader, provideTransloco, TranslocoService } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { Injectable, APP_INITIALIZER } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
	constructor(private http: HttpClient) {}

	getTranslation(lang: string): Observable<Translation> {
		return this.http.get<Translation>(`/assets/i18n/${lang}.json`).pipe(
			catchError((err) => {
				console.error(`Failed to load i18n/${lang}.json:`, err);
				throw err;
			})
		);
	}
}

@Injectable({ providedIn: 'root' })
export class TranslocoInitializer {
	constructor(private transloco: TranslocoService) {}

	init(): void {
		const storedLang = localStorage.getItem('activeLanguage') || 'en';
		this.transloco.setDefaultLang(storedLang);
		this.transloco.setActiveLang(storedLang);
	}
}

export const translocoProviders = [
	provideTransloco({
		config: {
			availableLangs: ['en', 'es', 'fr'],
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
