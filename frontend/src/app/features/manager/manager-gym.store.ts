import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { GymDetail } from '../../core/models';
import { ManagerService } from '../../core/services/manager.service';

/** Cache des salles du gestionnaire + salle sélectionnée (tableau de bord). */
@Injectable({ providedIn: 'root' })
export class ManagerGymStore {
  private readonly manager = inject(ManagerService);

  readonly gyms = signal<GymDetail[]>([]);
  readonly loaded = signal(false);
  readonly selectedGymId = signal<number | null>(null);

  readonly selectedGym = computed(() => this.gyms().find((g) => g.id === this.selectedGymId()) ?? null);

  load(force = false): Observable<GymDetail[]> {
    return this.manager.gyms().pipe(
      tap((list) => {
        this.gyms.set(list);
        this.loaded.set(true);
        if (force || this.selectedGymId() === null || !list.some((g) => g.id === this.selectedGymId())) {
          this.selectedGymId.set(list[0]?.id ?? null);
        }
      }),
    );
  }

  upsert(gym: GymDetail): void {
    this.gyms.update((list) => {
      const exists = list.some((g) => g.id === gym.id);
      return exists ? list.map((g) => (g.id === gym.id ? gym : g)) : [...list, gym];
    });
    if (this.selectedGymId() === null) {
      this.selectedGymId.set(gym.id);
    }
  }

  byId(id: number): GymDetail | null {
    return this.gyms().find((g) => g.id === id) ?? null;
  }
}
