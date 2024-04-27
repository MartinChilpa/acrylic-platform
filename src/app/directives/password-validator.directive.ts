import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[acrylicPasswordValidator]',
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: PasswordValidatorDirective, multi: true }]
})
export class PasswordValidatorDirective implements Validator {

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    // Regular expressions for validation
    const minLength = 8; // Minimum password length
    const hasLetter = /[a-zA-Z]/.test(value); // Check for at least one letter
    const hasNumber = /[0-9]/.test(value); // Check for at least one number
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value); // Check for at least one special character

    // Check if the password meets all criteria
    const isStrongPassword = (value.length >= minLength) && hasLetter && hasNumber && hasSpecialChar;

    if (isStrongPassword) {
      return null; // Valid password
    } else {
      return {
        invalidPassword: {
          requiredLength: value.length <= minLength,
          hasLetter: !hasLetter,
          hasNumber: !hasNumber,
          hasSpecialChar: !hasSpecialChar
        }
      };
    }
  }
}