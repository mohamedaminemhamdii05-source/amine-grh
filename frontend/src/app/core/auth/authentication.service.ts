import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor() { }

  // logged in = a token exists and it has not expired
  isLoggedIn(){
    let data = this.getDataFromToken();
    if(!data){
      return false;
    }
    if(data.exp && data.exp * 1000 <= Date.now()){
      localStorage.removeItem('token');
      return false;
    }
    return true;
  }

  getDataFromToken(){
    let token = localStorage.getItem('token');
    if(token){
      try {
        // JWT uses base64url; convert to base64 and decode as UTF-8 (names with accents)
        let base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        base64 += '='.repeat((4 - base64.length % 4) % 4);
        const bytes = Uint8Array.from(window.atob(base64), (c) => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
      } catch (e) {
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  }

  logout(){
    localStorage.removeItem('token');
  }

}
