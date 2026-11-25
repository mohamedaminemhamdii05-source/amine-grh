import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

// Full address of an uploaded file:  {{ user.image | fileUrl }}
// No file (e.g. a removed profile photo) shows the default avatar.
@Pipe({
  name: 'fileUrl',
  standalone: true
})
export class FileUrlPipe implements PipeTransform {
  transform(fileName: string | null | undefined): string {
    if (!fileName) {
      return 'assets/images/default-avatar.svg';
    }
    return environment.apiUrl + '/files/' + fileName;
  }
}
