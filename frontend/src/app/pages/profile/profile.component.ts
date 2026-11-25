import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FileUrlPipe } from '../../core/pipes/file-url.pipe';
import { UserService } from '../../core/services/user.service';
import { AuthenticationService } from '../../core/auth/authentication.service';
import Swal from 'sweetalert2';

// confirm password must match the new password
const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink, FileUrlPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {


  id: any;
  user: any;
  loading = true;
  loadError = false;

  infoForm: FormGroup;
  passwordForm: FormGroup;

  image: any;
  preview: any = '';

  savingInfo = false;
  savingPassword = false;
  removingPhoto = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private _user: UserService,
    private _auth: AuthenticationService
  ){

    let infoControls = {
      fullname: new FormControl('', [ Validators.required ]),
      email: new FormControl('', [ Validators.required, Validators.email ]),
      tel: new FormControl('', [ Validators.required ])
    }
    this.infoForm = fb.group(infoControls);

    let passwordControls = {
      password: new FormControl('', [ Validators.required, Validators.minLength(6) ]),
      confirm: new FormControl('', [ Validators.required ])
    }
    this.passwordForm = fb.group(passwordControls, { validators: passwordsMatch });

  }

  ngOnInit(): void {
    this.id = this._auth.getDataFromToken()._id;
    this.loadUser();
  }

  loadUser(){
    this.loading = true;
    this.loadError = false;
    this._user.byid(this.id).subscribe({
      next: (res: any)=>{
        this.user = res;
        this.infoForm.reset({ fullname: res.fullname, email: res.email, tel: res.tel });
        this.loading = false;
      },
      error: ()=>{
        this.loading = false;
        this.loadError = true;
      }
    })
  }

  selectImage(e: any){
    const file = e.target.files[0];
    if(!file){
      return;
    }
    if(!file.type.startsWith('image/')){
      Swal.fire({ icon: "error", title: "Oops...", text: "Please choose an image file." });
      e.target.value = '';
      return;
    }
    this.image = file;
    const reader = new FileReader();
    reader.onload = ()=>{ this.preview = reader.result; };
    reader.readAsDataURL(file);
  }

  cancelImage(input: HTMLInputElement){
    this.image = null;
    this.preview = '';
    input.value = '';
  }

  // deletes the current profile photo (a default avatar is shown instead)
  removePhoto(){
    Swal.fire({
      title: "Remove your photo?",
      text: "Your profile will show a default avatar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f46a6a",
      cancelButtonColor: "#74788d",
      confirmButtonText: "Yes, remove it"
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      let fd = new FormData();
      fd.append('removeImage', 'true');

      this.removingPhoto = true;
      this._user.updateProfile(this.id, fd).subscribe({
        next: (res: any)=>{
          this.applyToken(res.myToken);
          this.removingPhoto = false;
          this.loadUser();
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Your photo has been removed",
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: ()=>{
          this.removingPhoto = false;
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong! please try again",
          });
        }
      })
    });
  }

  // stores the fresh token returned by the backend and tells the header to refresh
  applyToken(token: string){
    localStorage.setItem('token', token);
    window.dispatchEvent(new Event('profile-updated'));
  }

  saveInfo(){
    if(this.infoForm.invalid){
      this.infoForm.markAllAsTouched();
      return;
    }

    let fd = new FormData();
    fd.append('fullname', this.infoForm.value.fullname);
    fd.append('email', this.infoForm.value.email);
    fd.append('tel', this.infoForm.value.tel);
    fd.append('tags', JSON.stringify(this.user.tags || []));
    if(this.image){
      fd.append('image', this.image);
    }

    this.savingInfo = true;
    this._user.updateProfile(this.id, fd).subscribe({
      next: (res: any)=>{
        this.applyToken(res.myToken);
        this.savingInfo = false;
        this.image = null;
        this.preview = '';
        this.loadUser();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Your profile has been saved",
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err)=>{
        this.savingInfo = false;
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: typeof err.error === 'string' && err.status !== 500 ? err.error : "Something went wrong! please try again",
        });
      }
    })
  }

  savePassword(){
    if(this.passwordForm.invalid){
      this.passwordForm.markAllAsTouched();
      return;
    }

    let fd = new FormData();
    fd.append('password', this.passwordForm.value.password);

    this.savingPassword = true;
    this._user.updateProfile(this.id, fd).subscribe({
      next: (res: any)=>{
        this.applyToken(res.myToken);
        this.savingPassword = false;
        this.showPassword = false;
        this.passwordForm.reset();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Your password has been changed",
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err)=>{
        this.savingPassword = false;
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: typeof err.error === 'string' && err.status !== 500 ? err.error : "Something went wrong! please try again",
        });
      }
    })
  }

}
