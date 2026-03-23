import { Component, Input, OnInit, inject, ViewChild, ElementRef, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AttendanceLocation } from '@/models/checkin-config.model';
import { environment } from '@env/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '@/services/common/toast.service';
import { ModalPopup } from '@/components/popups/modal-popup/modal-popup';

type LocationFormValue = Pick<
  AttendanceLocation,
  'id' | 'name' | 'latitude' | 'longitude' | 'radiusMeters' | 'isActive'
>;

interface GoogleLatLngLike {
  lat(): number;
  lng(): number;
}

interface GoogleMapsMouseEvent {
  latLng: GoogleLatLngLike;
}

interface GoogleMap {
  addListener(eventName: string, handler: (event: GoogleMapsMouseEvent) => void): void;
  fitBounds(bounds: unknown): void;
  panTo(latLng: GoogleLatLngLike): void;
  setCenter(latLng: GoogleLatLngLike | { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
}

interface GoogleMarker {
  addListener(eventName: string, handler: (event: GoogleMapsMouseEvent) => void): void;
  setPosition(latLng: GoogleLatLngLike): void;
}

interface GoogleCircle {
  setCenter(latLng: GoogleLatLngLike): void;
  setRadius(radius: number): void;
}

interface GoogleGeocoderResult {
  formatted_address?: string;
  name?: string;
  types?: string[];
}

interface GoogleGeocoder {
  geocode(
    request: { location: { lat: number; lng: number } },
    callback: (results: GoogleGeocoderResult[], status: string) => void,
  ): void;
}

interface GooglePlaceResult {
  name?: string;
  geometry?: {
    location?: GoogleLatLngLike;
    viewport?: unknown;
  };
}

interface GoogleAutocomplete {
  addListener(eventName: string, handler: () => void): void;
  bindTo(key: string, target: GoogleMap | null): void;
  getPlace(): GooglePlaceResult;
}

interface GoogleMapsApi {
  maps?: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    Marker: new (options: Record<string, unknown>) => GoogleMarker;
    Circle: new (options: Record<string, unknown>) => GoogleCircle;
    Geocoder: new () => GoogleGeocoder;
    LatLng: new (lat: number, lng: number) => GoogleLatLngLike;
    Animation: { DROP: unknown };
    places: {
      Autocomplete: new (element: HTMLInputElement, options: Record<string, unknown>) => GoogleAutocomplete;
    };
  };
}

declare const google: GoogleMapsApi;

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
  private readonly ngZone = inject(NgZone);

  @Input() isVisible = false;
  @Input() data: AttendanceLocation | null = null;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<LocationFormValue>();

  @ViewChild('searchInput') searchElementRef!: ElementRef<HTMLInputElement>;

  protected form!: FormGroup;
  private map: GoogleMap | null = null;
  private marker: GoogleMarker | null = null;
  private radiusCircle: GoogleCircle | null = null;
  private geocoder: GoogleGeocoder | null = null;
  protected isLocating = false;
  protected searchInputValue = '';

  private get mapsApi() {
    return google.maps!;
  }

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
    this.map.addListener('click', (event) => {
      this.updatePosition(event.latLng);
    });

    this.marker.addListener('dragend', (event) => {
      this.updatePosition(event.latLng);
    });

    this.initAutocomplete();
    this.initUrlListener();
  }

  private initUrlListener(): void {
    if (!this.searchElementRef) return;

    const input = this.searchElementRef.nativeElement;

    // Listen for input events (handle typing or pasting)
    input.addEventListener('input', (event: Event) => {
      const value = (event.target as HTMLInputElement | null)?.value ?? '';
      this.searchInputValue = value; // Keep track for clear button visibility
      if (this.isGoogleMapsUrl(value)) {
        this.handleUrlPaste(value);
      }
    });

    // Explicit paste event for faster response
    input.addEventListener('paste', (e: ClipboardEvent) => {
      const pasteData = e.clipboardData?.getData('text');
      if (pasteData && this.isGoogleMapsUrl(pasteData)) {
        // Prevent clearing if autocomplete tries to take over
        setTimeout(() => this.handleUrlPaste(pasteData), 50);
      }
    });
  }

  private isGoogleMapsUrl(text: string): boolean {
    return text.includes('google.com/maps') || text.includes('goo.gl/maps') || text.includes('maps.app.goo.gl');
  }

  private handleUrlPaste(url: string): void {
    const coords = this.extractCoordsFromUrl(url);
    if (coords) {
      const { lat, lng } = coords;

      this.form.patchValue({
        latitude: lat,
        longitude: lng
      }, { emitEvent: false });

      if (this.map && this.marker && this.radiusCircle) {
        const latLng = new this.mapsApi.LatLng(lat, lng);
        this.marker.setPosition(latLng);
        this.radiusCircle.setCenter(latLng);
        this.map.setCenter(latLng);
        this.map.setZoom(17);
      }

      // Keep the URL text in the search input and sync the tracked value
      this.searchInputValue = url;
      if (this.searchElementRef) {
        this.searchElementRef.nativeElement.value = url;
      }

      // Step 1: Try to extract place name directly from URL path (instant, no API call)
      const urlName = this.extractNameFromUrl(url);
      if (urlName) {
        this.form.patchValue({ name: urlName });
      }

      // Step 2: Always refine with reverse geocoding (more accurate, async)
      this.reverseGeocode(lat, lng);

      this.toast.success('Đã lấy tọa độ từ link Google Maps!');
    }
  }

  private extractNameFromUrl(url: string): string | null {
    // Extract name from /maps/place/NAME/ pattern (e.g. /maps/place/Eximbank+Ben+Nghe/)
    const placePattern = /\/maps\/place\/([^/@]+)/;
    const match = url.match(placePattern);
    if (match && match[1]) {
      try {
        // Decode URL encoding and replace + with spaces
        return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
      } catch {
        return match[1].replace(/\+/g, ' ').trim();
      }
    }
    return null;
  }

  private extractCoordsFromUrl(url: string): { lat: number, lng: number } | null {
    // Priority 1: !3dlat!4dlng (Internal Google Maps data - highest accuracy for pinned items)
    const paramPattern = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const paramMatch = url.match(paramPattern);
    if (paramMatch) {
      return {
        lat: parseFloat(paramMatch[1]),
        lng: parseFloat(paramMatch[2])
      };
    }

    // Priority 2: q=lat,lng (Query parameters for specific coordinates)
    const qPattern = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = url.match(qPattern);
    if (qMatch) {
      return {
        lat: parseFloat(qMatch[1]),
        lng: parseFloat(qMatch[2])
      };
    }

    // Priority 3: @lat,lng (Map viewport center - fallback)
    const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = url.match(atPattern);
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lng: parseFloat(atMatch[2])
      };
    }

    // Priority 4: Simple lat,lng string (fallback)
    const simplePattern = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const simpleMatch = url.match(simplePattern);
    if (simpleMatch && (url.includes('google.com/maps') || url.includes('goo.gl'))) {
      return {
        lat: parseFloat(simpleMatch[1]),
        lng: parseFloat(simpleMatch[2])
      };
    }

    return null;
  }

  private reverseGeocode(lat: number, lng: number): void {
    if (!this.geocoder) {
      this.geocoder = new this.mapsApi.Geocoder();
    }
    this.geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      this.ngZone.run(() => {
        if (status === 'OK' && results && results.length > 0) {
          // Try to get a meaningful POI name, then fall back to formatted address
          const poiResult = results.find((result) =>
            result.types && (result.types.includes('point_of_interest') || result.types.includes('establishment'))
          );
          const name = poiResult ? poiResult.name : '';
          const address = (poiResult || results[0]).formatted_address || '';
          const finalName = name || address;
          // Always auto-fill with the reverse-geocoded name
          this.form.patchValue({ name: finalName });
        }
      });
    });
  }

  clearSearch(): void {
    this.searchInputValue = '';
    if (this.searchElementRef) {
      this.searchElementRef.nativeElement.value = '';
    }
  }

  private initAutocomplete(): void {
    if (!this.searchElementRef) return;

    const autocomplete = new this.mapsApi.places.Autocomplete(this.searchElementRef.nativeElement, {
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
        this.map?.fitBounds(place.geometry.viewport);
      } else {
        this.map?.setCenter(place.geometry.location);
        this.map?.setZoom(17);
      }

      // Update form and marker
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      this.form.patchValue({
        name: place.name || this.form.get('name')?.value || '',
        latitude: lat,
        longitude: lng
      }, { emitEvent: false });

      this.marker?.setPosition(place.geometry.location);
      this.radiusCircle?.setCenter(place.geometry.location);
    });
  }

  private updatePosition(latLng: GoogleLatLngLike): void {
    const lat = latLng.lat();
    const lng = latLng.lng();

    this.form.patchValue({
      latitude: lat,
      longitude: lng
    }, { emitEvent: false });

    this.marker?.setPosition(latLng);
    this.radiusCircle?.setCenter(latLng);
  }

  private updateMarkerFromForm(): void {
    const lat = this.form.get('latitude')?.value;
    const lng = this.form.get('longitude')?.value;
    if (lat && lng && this.marker && this.radiusCircle && this.map) {
      const latLng = new this.mapsApi.LatLng(lat, lng);
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
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.form.patchValue({ latitude: lat, longitude: lng }, { emitEvent: false });
        if (this.map && this.marker && this.radiusCircle) {
          const latLng = new this.mapsApi.LatLng(lat, lng);
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
      this.save.emit(this.form.getRawValue() as LocationFormValue);
    }
  }

  cancel(): void {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);
  }
}
