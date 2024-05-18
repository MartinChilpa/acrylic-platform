import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(value: number): string {
    const hours = Math.floor((value / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((value / (1000 * 60)) % 60);
    const seconds = Math.floor((value / 1000) % 60);
    let timeDisplay = '';

    if (hours > 0) {
      timeDisplay += this.padWithZero(hours) + ':';
    }

    timeDisplay += this.padWithZero(minutes) + ':' + this.padWithZero(seconds);
    return timeDisplay;
  }

  private padWithZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}
