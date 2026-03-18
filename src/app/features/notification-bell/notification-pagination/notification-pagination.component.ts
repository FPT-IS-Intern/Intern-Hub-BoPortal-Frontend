import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../../components/pagination/pagination.component';

@Component({
    selector: 'app-notification-pagination',
    standalone: true,
    imports: [CommonModule, PaginationComponent],
    templateUrl: './notification-pagination.component.html',
    styleUrl: './notification-pagination.component.scss',
})
export class NotificationPaginationComponent implements OnChanges {
    @Input() pageIndex = 1;
    @Input() pageSize = 10;
    @Input() total = 0;
    @Input() pageSizeOptions: number[] = [10, 20, 50];
    @Input() displayRange = '';


    @Output() pageIndexChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();

    ngOnChanges(_changes: SimpleChanges): void {}

}
