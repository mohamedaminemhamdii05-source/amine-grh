import { Component, HostListener } from '@angular/core';
import { FileUrlPipe } from '../../../core/pipes/file-url.pipe';
import { RouterLink } from '@angular/router';
import { AuthenticationService } from '../../../core/auth/authentication.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FileUrlPipe, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  user: any;

  constructor( private _auth: AuthenticationService ){}

  ngOnInit(): void {
    this.user = this._auth.getDataFromToken();
  }

  // the Profile page sends this event after saving, with a fresh token in localStorage
  @HostListener('window:profile-updated')
  refreshUser(){
    this.user = this._auth.getDataFromToken();
  }

  // Menu button: on large screens it shrinks the sidebar to icons, on small screens it shows/hides it
  // (same body classes as the template's own script, which can't reach this button).
  toggleMenu(){
    const body = document.body;
    if (window.innerWidth >= 992) {
      body.classList.toggle('vertical-collpsed');
      body.classList.remove('sidebar-enable');
    } else {
      body.classList.remove('vertical-collpsed');
      body.classList.toggle('sidebar-enable');
    }
  }

  logout(){
    document.body.classList.remove('vertical-collpsed', 'sidebar-enable');
    localStorage.removeItem('token');
    window.location.reload();
  }

}
