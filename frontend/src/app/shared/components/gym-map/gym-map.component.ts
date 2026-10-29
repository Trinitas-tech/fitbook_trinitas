import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { GymCard } from '../../../core/models';

export interface MapPosition {
  lat: number;
  lng: number;
}

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

/** Marqueur CSS maison (orange) – évite les soucis de chemins d'images de Leaflet. */
const GYM_ICON = L.divIcon({
  className: 'fb-pin-wrap',
  html: '<span class="fb-pin"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -34],
});

/** Marqueur distinct (bleu nuit, halo) pour la position de l'utilisateur. */
const USER_ICON = L.divIcon({
  className: 'fb-pin-wrap',
  html: '<span class="fb-pin-user"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hasCoords(g: GymCard): g is GymCard & { latitude: number; longitude: number } {
  return typeof g.latitude === 'number' && typeof g.longitude === 'number';
}

/**
 * US-21 : carte Leaflet (tuiles OpenStreetMap) avec un marqueur par salle géolocalisée
 * et, en option, la position de l'utilisateur. Réutilisable (recherche, fiche salle).
 */
@Component({
  selector: 'app-gym-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    #map
    class="map"
    [style.height]="height()"
    role="region"
    aria-label="Carte des salles"
  ></div>`,
  styles: `
    :host {
      display: block;
    }
    .map {
      width: 100%;
      min-height: 200px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow);
      background: #e2e8f0;
      z-index: 0;
    }
  `,
})
export class GymMapComponent implements OnDestroy {
  private readonly router = inject(Router);

  /** Salles à afficher (celles sans coordonnées sont ignorées). */
  readonly gyms = input.required<GymCard[]>();
  /** Position de l'utilisateur (marqueur distinct), ou null. */
  readonly userPosition = input<MapPosition | null>(null);
  readonly height = input('420px');

  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private map: L.Map | null = null;
  private readonly gymLayer = L.layerGroup();
  private userMarker: L.Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    // Leaflet manipule le DOM : initialisation seulement une fois la vue rendue (navigateur).
    afterNextRender(() => this.init());
    effect(() => {
      const gyms = this.gyms();
      const position = this.userPosition();
      if (this.map) {
        this.render(gyms, position);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.map?.remove();
    this.map = null;
  }

  private init(): void {
    const el = this.mapEl().nativeElement;
    this.map = L.map(el, { center: [46.6, 2.4], zoom: 5, scrollWheelZoom: false });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(this.map);
    this.gymLayer.addTo(this.map);

    // Lien de la popup → navigation Angular (pas de rechargement complet).
    this.map.on('popupopen', (e: L.PopupEvent) => {
      const link = e.popup.getElement()?.querySelector<HTMLAnchorElement>('a[data-gym-id]');
      link?.addEventListener('click', (ev) => {
        ev.preventDefault();
        this.router.navigate(['/salles', Number(link.dataset['gymId'])]);
      });
    });

    this.render(this.gyms(), this.userPosition());

    // La carte peut être affichée après un bascule Liste/Carte : recalcul de la taille.
    setTimeout(() => this.map?.invalidateSize(), 0);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
      this.resizeObserver.observe(el);
    }
  }

  private render(gyms: GymCard[], position: MapPosition | null): void {
    if (!this.map) {
      return;
    }
    this.gymLayer.clearLayers();
    const points: L.LatLngExpression[] = [];

    for (const gym of gyms) {
      if (!hasCoords(gym)) {
        continue;
      }
      const latLng: L.LatLngExpression = [gym.latitude, gym.longitude];
      points.push(latLng);
      L.marker(latLng, { icon: GYM_ICON, title: gym.name, alt: gym.name })
        .bindPopup(this.popupHtml(gym), { closeButton: true, maxWidth: 240 })
        .addTo(this.gymLayer);
    }

    if (this.userMarker) {
      this.userMarker.remove();
      this.userMarker = null;
    }
    if (position) {
      this.userMarker = L.marker([position.lat, position.lng], {
        icon: USER_ICON,
        title: 'Votre position',
        alt: 'Votre position',
        zIndexOffset: 1000,
      })
        .bindPopup('<strong>Votre position</strong>')
        .addTo(this.map);
      points.push([position.lat, position.lng]);
    }

    if (points.length === 1) {
      this.map.setView(points[0], 15);
    } else if (points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15 });
    }
  }

  private popupHtml(gym: GymCard): string {
    const rating =
      gym.averageRating !== null && gym.averageRating !== undefined
        ? `★ ${gym.averageRating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (${gym.reviewCount} avis)`
        : "Pas encore d'avis";
    const distance =
      gym.distanceKm !== null && gym.distanceKm !== undefined
        ? `<div class="fb-popup-distance">à ${gym.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km</div>`
        : '';
    return `
      <div class="fb-popup">
        <strong class="fb-popup-title">${escapeHtml(gym.name)}</strong>
        <div class="fb-popup-city">📍 ${escapeHtml(gym.city)}</div>
        <div class="fb-popup-rating">${rating}</div>
        ${distance}
        <a href="/salles/${gym.id}" data-gym-id="${gym.id}" class="fb-popup-link">Voir la salle →</a>
      </div>`;
  }
}
