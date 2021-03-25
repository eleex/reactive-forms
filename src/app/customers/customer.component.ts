import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Customer } from './customer';
import {debounceTime} from 'rxjs/operators';

function customRatingRangeValidation(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): {[key: string]: boolean} | null => {
    if (c.value !== null && isNaN(c.value) || c.value < min || c.value > max) {
      return {range: true};
    }
    return null;
  };
}

function emailMatcher(c: AbstractControl): {[key: string]: boolean} | null {
  const emailControl = c.get('email');
  const confirmEmailControl = c.get('confirmEmail');

  if (emailControl.value !== confirmEmailControl.value) {
    return { match: true };
  }
  return null;
}


@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customer = new Customer();
  customerForm: FormGroup;
  emailMessage: string;

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.',
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', [Validators.required]],
      }, { validator: emailMatcher }),
      phone: [''],
      notification: ['email'],
      rating: [null, customRatingRangeValidation(0, 5)],
      sendCatalog: false,
      addresses: this.fb.array([
        this.buildAddress()
      ])
    });

    this.customerForm.get('notification').valueChanges.subscribe(value => {
      if (value === 'text') {
        this.customerForm.get('phone').setValidators(Validators.required);
      } else {
        this.customerForm.get('phone').clearValidators();
      }
      this.customerForm.get('phone').updateValueAndValidity();
    });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(debounceTime(1000)).subscribe(value => this.setMessage(emailControl));
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: ['', [Validators.required]],
      street2: '',
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip: ['', [Validators.required]],
    });
  }

  addAddress(): void {
    (this.customerForm.get('addresses') as FormArray).push(this.buildAddress());
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.dirty || c.touched) && c.errors ) {
      Object.keys(c.errors).map(key => this.emailMessage = this.validationMessages[key]);
    }
  }

  save(): void {}
}
