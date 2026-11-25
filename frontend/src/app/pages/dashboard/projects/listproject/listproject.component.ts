import { Component } from '@angular/core';
import { FileUrlPipe } from '../../../../core/pipes/file-url.pipe';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import Swal from 'sweetalert2';
import { AuthenticationService } from '../../../../core/auth/authentication.service';

@Component({
  selector: 'app-listproject',
  standalone: true,
  imports: [ FileUrlPipe, RouterModule ],
  templateUrl: './listproject.component.html',
  styleUrl: './listproject.component.css'
})
export class ListprojectComponent {

  projects : any;
  isAdmin = false;

  constructor( private _project: ProjectService, private _auth: AuthenticationService ){}

  ngOnInit(): void {
    this.isAdmin = this._auth.getDataFromToken()?.role == 'admin';
    this._project.list().subscribe({
      next: (res)=>{
        this.projects = res;
      }
    })
  }

  delete(id: any){
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
       
        this._project.delete(id).subscribe({
          next:(res)=>{
            this.ngOnInit();
          }
        })

      }
    });
  }

}
