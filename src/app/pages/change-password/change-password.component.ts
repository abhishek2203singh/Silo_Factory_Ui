import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@services/Socket.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit, AfterViewInit {
  form: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private webSockets: SocketService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: matchingPasswords('newPassword', 'confirmPassword') }
    );
  }

  ngOnInit(): void {
    this.webSockets.listen('user:changePassword').subscribe((res: any) => {
      if (res.success) {
        this.toastr.success('Password changed successfully!');
        this.webSockets.Logout();

        this.router.navigate(['/login']);

      } else {
        if (res?.data?.validationErrors) {
          res.data.validationErrors.forEach((err: any) => {
            this.toastr.error(err.message, err.field);
          });
        } else {
          this.toastr.error(res.message || 'Failed to change password');
        }
      }
    });
  }

  ngAfterViewInit(): void {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hide');
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { currentPassword, newPassword, confirmPassword } = this.form.value;
      const payload = { currentPassword, newPassword, confirmPassword };
      this.webSockets.emit('user:changePassword', payload);
    }
  }
}

export function matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirmPassword = group.get(confirmPasswordKey)?.value;

    if (password !== confirmPassword) {
      group.get(confirmPasswordKey)?.setErrors({ mismatchedPasswords: true });
    } else {
      const errors = group.get(confirmPasswordKey)?.errors;
      if (errors) {
        delete errors['mismatchedPasswords'];
        if (Object.keys(errors).length === 0) {
          group.get(confirmPasswordKey)?.setErrors(null);
        } else {
          group.get(confirmPasswordKey)?.setErrors(errors);
        }
      }
    }
    return null;
  };
}
