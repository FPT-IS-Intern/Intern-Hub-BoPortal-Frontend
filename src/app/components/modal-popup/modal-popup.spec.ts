import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPopup } from './modal-popup';

describe('ModalPopup', () => {
  let component: ModalPopup;
  let fixture: ComponentFixture<ModalPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
