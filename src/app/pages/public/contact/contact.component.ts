import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfigModel } from '../../../core/models/config.model';
import { ConfigService } from '../../../infrastructure/services/config.service';
import { SafePipe } from "../../../infrastructure/pipes/safe.pipe";
import { environment } from '../../../../environments/environment';
import { RouterModule } from '@angular/router';

// --- Data Models for Type Safety ---
interface OfficeHour {
  day: string;
  hours: string;
}

// --- Signal-based Form Model ---
interface ContactForm {
  name: WritableSignal<string>;
  email: WritableSignal<string>;
  subject: WritableSignal<string>;
  message: WritableSignal<string>;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, SafePipe],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  // --- Service Injection & State Management ---
  private configService = inject(ConfigService);
  public configData = signal<ConfigModel | null>(null);

  // --- Signal-based Form ---
  public contactForm: ContactForm = {
    name: signal(''),
    email: signal(''),
    subject: signal(''),
    message: signal(''),
  };

  // --- Computed signal for real-time form validation ---
  public isFormValid = computed(() => {
    const form = this.contactForm;
    // Basic validation: check for non-empty required fields and a valid email format.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return form.name().trim() !== '' &&
           emailRegex.test(form.email()) &&
           form.subject().trim() !== '' &&
           form.message().trim() !== '';
  });

  // --- Static Page Data ---
  public officeHours = signal<OfficeHour[]>([
    { day: 'Monday - Friday', hours: '9:00 AM - 5:00 PM' },
    { day: 'Saturday', hours: '10:00 AM - 2:00 PM' },
    { day: 'Sunday', hours: 'Closed for Worship' },
  ]);

  // --- Computed signal for the Google Maps URL ---
  public googleMapsUrl = computed(() => {
    const config = this.configData();
    if (!config) return '';
    const address = `${config.address}, ${config.city}, ${config.state}`;
    const apiKey = environment.GOOGLE_MAPS_API_KEY;
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;
  });

  ngOnInit(): void {
      this.configService.getConfig().subscribe((data) => {
        this.configData.set(data.data);
      });
  }

  // --- Form Submission Logic ---
  onSubmit() {
    if (!this.isFormValid()) {
      console.error('Form is invalid. Submission blocked.');
      return;
    }
    // TODO: Implement actual form submission logic (e.g., HTTP POST request)
    console.log('Form Submitted:', {
      name: this.contactForm.name(),
      email: this.contactForm.email(),
      subject: this.contactForm.subject(),
      message: this.contactForm.message(),
    });
    // Optionally reset form after submission
    this.resetForm();
  }

  private resetForm(): void {
    this.contactForm.name.set('');
    this.contactForm.email.set('');
    this.contactForm.subject.set('');
    this.contactForm.message.set('');
  }

  // Helper to handle input changes for signal-based forms
  onInputChange(field: WritableSignal<string>, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    field.set(inputElement.value);
  }
}