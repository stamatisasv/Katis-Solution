import { DatePipe } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

@Pipe({ name: 'athensDate' })
export class AthensDatePipe implements PipeTransform {
  private readonly datePipe = new DatePipe(inject(LOCALE_ID));
  transform(value: string | number | Date | null | undefined, format: string): string | null {
    if (value == null) return null;
    const date = new Date(value);
    const offset = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Athens',
      timeZoneName: 'longOffset',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')!
      .value.replace('GMT', '')
      .replace(':', '');
    return this.datePipe.transform(value, format, offset);
  }
}
