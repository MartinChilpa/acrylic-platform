import { HttpInterceptorFn } from '@angular/common/http';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
	const activeLanguage = localStorage.getItem('activeLanguage') || 'en';
	const clonedReq = req.clone({
		headers: req.headers.set('Accept-Language', activeLanguage),
	});
	return next(clonedReq);
};
