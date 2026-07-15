import { Translation, TRANSLOCO_CONFIG, TRANSLOCO_LOADER, TranslocoConfig, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
	constructor(private http: HttpClient) {}

	getTranslation(lang: string): Observable<Translation> {
		return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
	}
}

export const translocoConfig: TranslocoConfig = {
	availableLangs: ['en', 'es', 'fr'],
	defaultLanguage: 'en',
	fallbackLanguage: 'en',
	reRenderOnLangChange: true,
	missingHandler: {
		useFallbackLanguage: true,
	},
};

export const translocoProviders = [
	{
		provide: TRANSLOCO_CONFIG,
		useValue: translocoConfig,
	},
	{
		provide: TRANSLOCO_LOADER,
		useClass: TranslocoHttpLoader,
	},
];
