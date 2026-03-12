import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AttendanceLocation } from '../../../models/checkin-config.model';

declare const google: any;

@Component({
  selector: 'app-upsert-location-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    NzIconModule
  ],
  templateUrl: './upsert-location-dialog.component.html',
  styleUrl: './upsert-location-dialog.component.scss'
})
export class UpsertLocationDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  readonly data = inject<AttendanceLocation>(NZ_MODAL_DATA, { optional: true });

  protected form!: FormGroup;
  private map: any;
  private marker: any;
  private radiusCircle: any;

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [this.data?.id || null],
      name: [this.data?.name || '', [Validators.required]],
      latitude: [this.data?.latitude || null, [Validators.required]],
      longitude: [this.data?.longitude || null, [Validators.required]],
      radiusMeters: [this.data?.radiusMeters || 100, [Validators.required]],
      isActive: [this.data ? this.data.isActive : true]
    });

    // Load Map after a short delay to ensure container is ready
    setTimeout(() => this.initMap(), 100);

    // Watch for coordinate changes to update map
    this.form.get('latitude')?.valueChanges.subscribe(val => this.updateMarkerFromForm());
    this.form.get('longitude')?.valueChanges.subscribe(val => this.updateMarkerFromForm());
    this.form.get('radiusMeters')?.valueChanges.subscribe(val => this.updateRadiusCircle());
  }

  private initMap(): void {
    const lat = this.form.get('latitude')?.value || 21.0285; // Default Hanoi
    const lng = this.form.get('longitude')?.value || 105.8542;
    const center = { lat, lng };

    const mapElement = document.getElementById('google-map');
    if (!mapElement) return;

    this.map = new google.maps.Map(mapElement, {
      center: center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    this.marker = new google.maps.Marker({
      position: center,
      map: this.map,
      draggable: true,
      animation: google.maps.Animation.DROP
    });

    this.radiusCircle = new google.maps.Circle({
      strokeColor: '#E18308',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#E18308',
      fillOpacity: 0.15,
      map: this.map,
      center: center,
      radius: this.form.get('radiusMeters')?.value || 100
    });

    // Map Events
    this.map.addListener('click', (event: any) => {
      this.updatePosition(event.latLng);
    });

    this.marker.addListener('dragend', (event: any) => {
      this.updatePosition(event.latLng);
    });
  }

  private updatePosition(latLng: any): void {
    const lat = latLng.lat();
    const lng = latLng.lng();

    this.form.patchValue({
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    }, { emitEvent: false });

    this.marker.setPosition(latLng);
    this.radiusCircle.setCenter(latLng);
  }

  private updateMarkerFromForm(): void {
    const lat = this.form.get('latitude')?.value;
    const lng = this.form.get('longitude')?.value;
    if (lat && lng && this.marker) {
      const latLng = new google.maps.LatLng(lat, lng);
      this.marker.setPosition(latLng);
      this.radiusCircle.setCenter(latLng);
      this.map.panTo(latLng);
    }
  }

  private updateRadiusCircle(): void {
    const radius = this.form.get('radiusMeters')?.value;
    if (radius && this.radiusCircle) {
      this.radiusCircle.setRadius(radius);
    }
  }

  submit(): void {
    if ((this as any).form.valid) {
      this.modalRef.close(this.form.value);
    }
  }

  cancel(): void {
    (this as any).modalRef.destroy();
  }
}
