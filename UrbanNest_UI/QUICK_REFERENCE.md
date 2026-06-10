# Form Validation - Quick Reference Guide

## 🚀 Quick Start

### Using Custom Validators

```typescript
import { 
  gstNumberValidator, 
  panNumberValidator,
  contactNumberValidator,
  passwordStrengthValidator,
  nameValidator
} from '../../validators/custom-validators';

// In your form
myForm = this.fb.group({
  gstNumber: ['', [Validators.required, gstNumberValidator()]],
  panNumber: ['', [Validators.required, panNumberValidator()]],
  contactNumber: ['', [Validators.required, contactNumberValidator()]],
  password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
  name: ['', [Validators.required, nameValidator()]]
});
```

---

## 📋 Validator Reference

### GST Number Validator
```typescript
gstNumberValidator()
```
- **Input**: `27AAPZU9603R1Z5`
- **Format**: 15 characters, Indian GST format
- **Error Key**: `invalidGst`

### PAN Number Validator
```typescript
panNumberValidator()
```
- **Input**: `AAAAA9999A`
- **Format**: 5 letters + 4 digits + 1 letter
- **Error Key**: `invalidPan`

### Contact Number Validator
```typescript
contactNumberValidator()
```
- **Input**: `9876543210`
- **Format**: 10 digits, starts with 6-9
- **Error Key**: `invalidContact`

### Password Strength Validator
```typescript
passwordStrengthValidator()
```
- **Requirements**: 8+ chars, uppercase, lowercase, digit
- **Error Key**: `weakPassword`

### Name Validator
```typescript
nameValidator()
```
- **Allows**: Letters and spaces only
- **Error Key**: `invalidName`

---

## 🎨 Template Pattern

### Complete Form Example

```html
<!-- Error/Success Messages -->
<div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
<div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

<!-- Form Field -->
<div class="mb-3">
  <label>Field Name <span class="text-danger">*</span></label>
  
  <input 
    type="text"
    class="form-control"
    [class.is-invalid]="form.get('fieldName')?.touched && form.get('fieldName')?.invalid"
    formControlName="fieldName"
    placeholder="Enter value"
    (blur)="form.get('fieldName')?.markAsTouched()"
  />
  
  <!-- Error Messages -->
  <small class="text-danger" *ngIf="form.get('fieldName')?.touched && form.get('fieldName')?.invalid">
    <span *ngIf="form.get('fieldName')?.errors?.['required']">Field is required</span>
    <span *ngIf="form.get('fieldName')?.errors?.['invalidXxx']">Invalid format</span>
  </small>
  
  <!-- Helper Text -->
  <small class="text-muted">Format example here</small>
</div>

<!-- Submit Button -->
<button 
  type="submit" 
  class="btn btn-primary"
  [disabled]="form.invalid"
>
  Submit
</button>
```

---

## 💻 Component Pattern

### TypeScript

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { gstNumberValidator } from '../../validators/custom-validators';

@Component({
  selector: 'app-my-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './my-form.html',
  styleUrl: './my-form.css'
})
export class MyForm implements OnInit {
  private fb = inject(FormBuilder);
  
  myForm!: FormGroup;
  errorMessage = '';
  successMessage = '';
  
  ngOnInit() {
    this.myForm = this.fb.group({
      gstNumber: ['', [Validators.required, gstNumberValidator()]]
    });
  }
  
  submit() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.myForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }
    
    // Submit logic
    this.service.submit(this.myForm.value).subscribe({
      next: () => {
        this.successMessage = 'Submitted successfully ';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed. Try again.';
      }
    });
  }
}
```

---

##  Testing Validators

### Valid Inputs
```
GST:      27AAPZU9603R1Z5
PAN:      AAAAA9999A
Contact:  9876543210
Password: MyPass123
Name:     John Doe
```

### Invalid Inputs
```
GST:      27AAPZU9603R1Z (too short)
PAN:      123456789A (starts with digits)
Contact:  1234567890 (starts with 1)
Password: password123 (no uppercase)
Name:     John123 (has digits)
```

---

## 🎯 Error Display Patterns

### Show Error Only After Interaction
```html
<small *ngIf="form.get('field')?.touched && form.get('field')?.invalid">
  Error message
</small>
```

### Show Error Immediately (not recommended for UX)
```html
<small *ngIf="form.get('field')?.invalid">
  Error message
</small>
```

### Show Specific Error Based on Validation Rule
```html
<small *ngIf="form.get('field')?.touched && form.get('field')?.invalid">
  <span *ngIf="form.get('field')?.errors?.['required']">Required</span>
  <span *ngIf="form.get('field')?.errors?.['invalidGst']">Invalid GST</span>
  <span *ngIf="form.get('field')?.errors?.['pattern']">Wrong format</span>
</small>
```

---

## 🔄 Common Tasks

### Add Required Validator
```typescript
formControl: ['', Validators.required]
```

### Add Min Length Validator
```typescript
password: ['', Validators.minLength(8)]
```

### Add Email Validator
```typescript
email: ['', [Validators.required, Validators.email]]
```

### Combine Multiple Validators
```typescript
gst: ['', [Validators.required, Validators.minLength(15), gstNumberValidator()]]
```

### Mark Field as Touched
```typescript
form.get('fieldName')?.markAsTouched();
```

### Reset Form
```typescript
form.reset();
```

### Check if Form is Valid
```typescript
if (form.valid) { }
if (form.invalid) { }
```

### Get Form Value
```typescript
const values = form.value;
const singleField = form.get('fieldName')?.value;
```

### Get Field Errors
```typescript
form.get('fieldName')?.errors
```

---

## 🎨 CSS Classes

| Class | Purpose |
|-------|---------|
| `.is-invalid` | Invalid field styling (red border) |
| `.alert-danger` | Red error alert |
| `.alert-success` | Green success alert |
| `.text-danger` | Red error text |
| `.text-muted` | Gray helper text |

---

## 📚 Form Examples

### Example 1: Simple GST Validation Form
```typescript
form = this.fb.group({
  businessName: ['', [Validators.required]],
  gstNumber: ['', [Validators.required, gstNumberValidator()]]
});
```

### Example 2: Retailer Registration
```typescript
form = this.fb.group({
  shopName: ['', [Validators.required, Validators.minLength(3)]],
  gstNumber: ['', [Validators.required, gstNumberValidator()]],
  panNumber: ['', [Validators.required, panNumberValidator()]],
  contactNumber: ['', [Validators.required, contactNumberValidator()]],
  address: ['', [Validators.required, Validators.minLength(5)]]
});
```

### Example 3: Password Change
```typescript
form = this.fb.group({
  oldPassword: ['', [Validators.required, Validators.minLength(6)]],
  newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
  confirmPassword: ['', Validators.required]
});
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Showing errors without [touched]
```html
<!-- Shows error immediately on page load -->
<small *ngIf="form.get('field')?.invalid">Error</small>
```

** Fix**: Add [touched] check
```html
<small *ngIf="form.get('field')?.touched && form.get('field')?.invalid">Error</small>
```

### ❌ Mistake 2: Using alert() instead of inline messages
```typescript
if (form.invalid) {
  alert('Fill form correctly');  // Jarring popup
}
```

** Fix**: Use inline messages
```typescript
if (form.invalid) {
  this.errorMessage = 'Please fill form correctly';
}
```

### ❌ Mistake 3: Submitting invalid form
```typescript
submit() {
  // Submits even if invalid
  this.service.submit(form.value).subscribe(...);
}
```

** Fix**: Check validity first
```typescript
submit() {
  if (form.invalid) return;
  this.service.submit(form.value).subscribe(...);
}
```

### ❌ Mistake 4: Not importing validators
```typescript
// Validator not imported
form = this.fb.group({
  gst: ['', gstNumberValidator()]  // Error: gstNumberValidator not defined
});
```

** Fix**: Import the validator
```typescript
import { gstNumberValidator } from '../../validators/custom-validators';
```

---

## 📖 Documentation Files

1. **FORM_VALIDATION_GUIDE.md** - Comprehensive reference
2. **BEFORE_AFTER_COMPARISON.md** - Implementation examples
3. **IMPLEMENTATION_SUMMARY.md** - Project completion status
4. **QUICK_REFERENCE.md** - This file (quick lookup)

---

## 🔗 Useful Links

- Angular Forms: https://angular.dev/guide/forms
- Reactive Forms: https://angular.dev/guide/reactive-forms
- Validators: https://angular.dev/api/forms/Validators
- Custom Validators: https://angular.dev/guide/form-validation#custom-validators

---

## 💡 Tips & Tricks

### Auto-dismiss Success Messages
```typescript
this.successMessage = 'Success!';
setTimeout(() => this.successMessage = '', 3000);
```

### Disable Submit Button
```html
<button [disabled]="form.invalid">Submit</button>
```

### Show Required Indicator
```html
<label>Field Name <span class="text-danger">*</span></label>
```

### Focus on Invalid Field
```typescript
const invalidControl = form.get('fieldName');
invalidControl?.markAsTouched();
// Programmatically focus (optional)
```

### Reset Specific Field
```typescript
form.get('fieldName')?.reset();
```

### Set Field Value Programmatically
```typescript
form.patchValue({ fieldName: 'new value' });
form.get('fieldName')?.setValue('new value');
```

---

## 🎓 Learning Path

1.  Understand [touched] state validation
2.  Learn inline error messages
3.  Study custom validators
4.  Practice with GST/PAN examples
5.  Implement in your forms
6.  Test with various inputs
7.  Extend with new validators as needed

---

**Last Updated**: May 22, 2026
**Angular Version**: 21
**Status**:  Production Ready
