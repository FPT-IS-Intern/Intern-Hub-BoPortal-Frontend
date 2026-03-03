import { Routes } from '@angular/router';
import { BoPortalPageComponent } from './features/bo-portal-page/bo-portal-page.component';
import { BoPortalLayoutComponent } from './layouts/main-layout/bo-portal-layout.component';
import { Error404LayoutComponent } from './layouts/error-404/error-404.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: BoPortalLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: BoPortalPageComponent,
        data: {
          title: 'Tổng quan BoPortal',
          subtitle: 'Đây là điểm vào nội bộ của BoPortal, chạy như một ứng dụng độc lập.',
          metrics: [
            { label: 'Mode', value: 'Standalone', tone: 'brand' },
            { label: 'Routing', value: 'Local', tone: 'neutral' },
            { label: 'Triển khai', value: 'BoPortal', tone: 'success' },
          ],
        },
      },
      {
        path: 'users',
        component: BoPortalPageComponent,
        data: {
          title: 'Quản trị người dùng',
          subtitle: 'Khu vực này sẵn sàng để gắn các module quản trị người dùng nội bộ của BoPortal.',
          metrics: [
            { label: 'Phân hệ', value: 'Users', tone: 'brand' },
            { label: 'Quyền truy cập', value: 'Back Office', tone: 'neutral' },
            { label: 'Tích hợp', value: 'Nội bộ', tone: 'success' },
          ],
        },
      },
      {
        path: 'training',
        component: BoPortalPageComponent,
        data: {
          title: 'Quản trị đào tạo',
          subtitle: 'Điểm vào dành cho các chức năng quản trị nội dung, khóa học và vận hành đào tạo.',
          metrics: [
            { label: 'Phân hệ', value: 'Training', tone: 'brand' },
            { label: 'Nguồn dữ liệu', value: 'API nội bộ', tone: 'neutral' },
            { label: 'Trạng thái', value: 'Sẵn sàng mở rộng', tone: 'success' },
          ],
        },
      },
      {
        path: 'reports',
        component: BoPortalPageComponent,
        data: {
          title: 'Báo cáo vận hành',
          subtitle: 'Không gian này dành cho dashboard báo cáo, thống kê và theo dõi hiệu suất nội bộ.',
          metrics: [
            { label: 'Phân hệ', value: 'Reports', tone: 'brand' },
            { label: 'Định dạng', value: 'Dashboard', tone: 'neutral' },
            { label: 'Mục tiêu', value: 'Theo dõi vận hành', tone: 'success' },
          ],
        },
      },
      {
        path: 'settings',
        component: BoPortalPageComponent,
        data: {
          title: 'Cấu hình hệ thống',
          subtitle: 'Thiết lập môi trường, phân quyền và cấu hình nghiệp vụ của BoPortal được gom tại đây.',
          metrics: [
            { label: 'Phân hệ', value: 'Settings', tone: 'brand' },
            { label: 'Môi trường', value: 'BoPortal', tone: 'neutral' },
            { label: 'Quản trị', value: 'Tập trung', tone: 'success' },
          ],
        },
      },
      {
        path: '404',
        component: Error404LayoutComponent,
      },
      {
        path: '**',
        redirectTo: '404',
      },
    ],
  },
];
