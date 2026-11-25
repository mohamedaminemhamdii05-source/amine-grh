import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  url = environment.apiUrl + '/board/';
  constructor( private http: HttpClient ) { }

  byid(id: any){
    return this.http.get(this.url + 'byid/' + id);
  }

  update(id: any, data: any){
    return this.http.put(this.url + 'update/' + id, data);
  }

}
