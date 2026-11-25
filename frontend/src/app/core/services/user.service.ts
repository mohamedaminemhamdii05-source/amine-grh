import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  url = environment.apiUrl + '/user/';
  constructor(private http: HttpClient) {}

  create(data: any) {
    return this.http.post(this.url + 'createuseraccount', data);
  }

  signin(data: any) {
    return this.http.post(this.url + 'signin', data);
  }

  // public demo only (404 on a normal installation)
  demoAccounts() {
    return this.http.get(this.url + 'demo-accounts');
  }

  list(){
    return this.http.get(this.url + 'list');
  }

  byid(id: any){
    return this.http.get(this.url + 'byid/' + id);
  }

  delete(id: any){
    return this.http.delete(this.url + 'delete/' + id);
  }

  update(id: any, data: any){
    return this.http.put(this.url + 'update/' + id, data);
  }

  updateProfile(id: any, data: any){
    return this.http.put(this.url + 'updateprofile/' + id, data);
  }

}
