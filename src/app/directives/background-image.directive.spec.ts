import { BackgroundImageDirective } from './background-image.directive';

describe('BackgroundImageDirective', () => {
  it('should create an instance', () => {
    const directive = new BackgroundImageDirective({} as any, {} as any);
    expect(directive).toBeTruthy();
  });
});
