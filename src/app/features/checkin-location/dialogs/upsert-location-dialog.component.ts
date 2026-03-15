import { Component, Input, OnInit, inject, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AttendanceLocation } from '../../../models/checkin-config.model';
import { environment } from '../../../../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../services/toast.service';
import { ModalPopup } from '../../../components/popups/modal-popup/modal-popup';

declare const google: any;

@Component({
  selector: 'app-upsert-location-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TranslateModule,
    ModalPopup
  ],
  templateUrl: './upsert-location-dialog.component.html',
  styleUrl: './upsert-location-dialog.component.scss'
})
export class UpsertLocationDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  @Input() isVisible = false;
  @Input() data: AttendanceLocation | null = null;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<any>();

  @ViewChild('searchInput') searchElementRef!: ElementRef;

  protected form!: FormGroup;
  private map: any;
  private marker: any;
  private radiusCircle: any;
  protected isLocating = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [this.data?.id || null],
      name: [this.data?.name || '', [Validators.required]],
      latitude: [this.data?.latitude || null, [Validators.required]],
      longitude: [this.data?.longitude || null, [Validators.required]],
      radiusMeters: [this.data?.radiusMeters || 100, [Validators.required]],
      isActive: [this.data ? this.data.isActive : true]
    });

    // Load Maps API and then init map
    this.loadGoogleMapsScript().then(() => {
      // Small delay to ensure container is ready
      setTimeout(() => this.initMap(), 100);
    }).catch(err => {
      console.error('Failed to load Google Maps:', err);
    });

    // Watch for coordinate changes to update map
    this.form.get('latitude')?.valueChanges.subscribe(val => this.updateMarkerFromForm());
    this.form.get('longitude')?.valueChanges.subscribe(val => this.updateMarkerFromForm());
    this.form.get('radiusMeters')?.valueChanges.subscribe(val => this.updateRadiusCircle());
  }

  private loadGoogleMapsScript(): Promise<void> {
    if (typeof google !== 'undefined' && google.maps) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  private initMap(): void {
    if (typeof google === 'undefined' || !google.maps) {
      return;
    }

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

    this.initAutocomplete();
  }

  private initAutocomplete(): void {
    if (!this.searchElementRef) return;

    const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
      fields: ['geometry', 'name', 'formatted_address'],
      types: ['establishment', 'geocode']
    });

    autocomplete.bindTo('bounds', this.map);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return; // User entered the name of a Place that was not suggested
      }

      // Update map center and zoom
      if (place.geometry.viewport) {
        this.map.fitBounds(place.geometry.viewport);
      } else {
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(17);
      }

      // Update form and marker
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      this.form.patchValue({
        name: place.name || this.form.get('name')?.value || '',
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6))
      }, { emitEvent: false });

      this.marker.setPosition(place.geometry.location);
      this.radiusCircle.setCenter(place.geometry.location);
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

  locateMe(): void {
    if (!navigator.geolocation) {
      this.toast.warningKey('checkin.locationDialog.alerts.geoUnsupported');
      return;
    }
    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isLocating = false;
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        this.form.patchValue({ latitude: lat, longitude: lng }, { emitEvent: false });
        if (this.map && this.marker) {
          const latLng = new google.maps.LatLng(lat, lng);
          this.marker.setPosition(latLng);
          this.radiusCircle.setCenter(latLng);
          this.map.panTo(latLng);
          this.map.setZoom(16);
        }
      },
      (error) => {
        this.isLocating = false;
        this.toast.warningKey('checkin.locationDialog.alerts.geoFailed');
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  submit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  cancel(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);
  }
}
