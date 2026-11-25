import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthenticationService } from '../../../core/auth/authentication.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ RouterModule ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  user: any;

  // which dropdown is open: 'clients' | 'projects' | 'employers' | ''
  openMenu = '';

  private sub?: Subscription;

  constructor( private _auth: AuthenticationService, private _router: Router ){}

  ngOnInit(): void {
    this.user = this._auth.getDataFromToken();

    // open the section of the current page, and again after each navigation
    this.openCurrentSection(this._router.url);
    this.sub = this._router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => this.openCurrentSection(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  isOpen(menu: string){
    return this.openMenu === menu;
  }

  // clicking an open section closes it, clicking another one switches to it
  toggle(menu: string){
    this.openMenu = this.openMenu === menu ? '' : menu;
  }

  // on phones the sidebar slides over the page: hide it after choosing a page
  closeOnMobile(){
    if (window.innerWidth < 992) {
      document.body.classList.remove('sidebar-enable');
    }
  }

  private openCurrentSection(url: string){
    const section = ['clients', 'projects', 'employers'].find((s) => url.startsWith('/dashboard/' + s));
    if (section) {
      this.openMenu = section;
    }
  }

}
