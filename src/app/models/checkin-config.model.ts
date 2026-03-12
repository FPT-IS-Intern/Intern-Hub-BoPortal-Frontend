export interface IPRange {
  id: string;
  branchId: string;
  name: string;
  ipPrefix: string;
  isActive: boolean;
  description: string;
}

export interface AttendanceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  branchId: string;
}

export interface BranchCheckinConfig {
  id: string;
  name: string;
  isActive: boolean;
  description: string;
  allowedIpRanges: IPRange[];
  attendanceLocations: AttendanceLocation[];
}

export interface CheckinConfigResponse {
  data: BranchCheckinConfig[];
  status: string;
  message: string;
}
