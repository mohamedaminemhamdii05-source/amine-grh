import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  url = environment.apiUrl + '/project/';
  constructor(private http: HttpClient) {}

  create(data: any) {
    return this.http.post(this.url + 'create', data);
  }

  update(id: any, data: any) {
    return this.http.put(this.url + 'update/' + id, data);
  }

  list() {
    return this.http.get(this.url + 'list');
  }

  byid(id: any) {
    return this.http.get(this.url + 'byid/' + id);
  }

  delete(id: any) {
    return this.http.delete(this.url + 'delete/' + id);
  }

  preview(id: any) {
    return this.http.get(this.url + 'preview/' + id);
  }
}
