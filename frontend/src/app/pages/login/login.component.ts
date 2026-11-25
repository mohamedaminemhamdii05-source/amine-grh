import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginForm: FormGroup;

  constructor( private fb: FormBuilder, private _user: UserService, private _router: Router ){

    let controls = {
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    }

    this.loginForm = fb.group(controls);

  }

  // public demo: shows one-click demo logins (the request fails quietly on a normal installation)
  demoAccounts: any[] = [];

  ngOnInit(): void {
    this._user.demoAccounts().subscribe({
      next: (res: any)=>{
        this.demoAccounts = Array.isArray(res) ? res : [];
      },
      error: ()=>{}
    })
  }

  loginAs(account: any){
    this.loginForm.setValue({ email: account.email, password: account.password });
    this.login();
  }

  login(){

    this._user.signin( this.loginForm.value ).subscribe({
      next: (res: any)=>{
       
        localStorage.setItem('token', res.myToken);
        
        this._router.navigate(['/dashboard']);

      },
      error: (err)=>{
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: err.status === 429 ? "Too many login attempts, please try again in 15 minutes."
              : err.status === 401 ? "Wrong email or password."
              : "Something went wrong! please try again",
        });
        
      }
    })

  }

}
