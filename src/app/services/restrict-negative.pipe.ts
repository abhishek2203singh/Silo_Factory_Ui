import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'restrictNegative',
    standalone: true,
})
export class RestrictNegativePipe implements PipeTransform {

    transform(value: number): number {
        return value < 0 ? 0 : value;
    }

}
