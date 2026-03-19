import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SharedDropdownCoordinatorService {
  private readonly openedSubject = new Subject<string>();
  readonly opened$: Observable<string> = this.openedSubject.asObservable();

  notifyOpened(instanceId: string): void {
    this.openedSubject.next(instanceId);
  }
}

