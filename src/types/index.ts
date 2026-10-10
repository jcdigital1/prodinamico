export type UserRole = 'admin' | 'buyer';
export type UserStatus = 'pending' | 'approved' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ModelCalibration {
  modelId: string;
  name: string;
  imageUrl: string;
  qrBox: {
    x: number; // percentage from 0 to 100
    y: number; // percentage from 0 to 100
    size: number; // percentage width/height
    clearBg: boolean; // whether to draw a clean solid card to erase previous placeholder QR
    bgColor: string; // background fill color for QR card
    borderRadius: number; // corner radius in % or px
    padding: number; // internal padding around QR code
  };
  numberBox: {
    x: number; // percentage from 0 to 100
    y: number; // percentage from 0 to 100
    fontSize: number; // px relative to 800px base
    fontFamily: string;
    fontWeight: string;
    color: string;
    align: 'center' | 'left' | 'right';
    prefix: string; // e.g. "Nº " or ""
    showBg: boolean;
    bgColor: string;
  };
  updatedAt?: string;
}

export interface PlateBatch {
  id: string;
  name: string;
  buyerId: string;
  buyerEmail: string;
  modelId: string;
  quantity: number;
  startNumber: number;
  endNumber: number;
  createdAt: string;
}

export interface PlateItem {
  id: string;
  plateNumber: number;
  formattedNumber: string; // "000001"
  batchId: string;
  buyerId: string;
  modelId: string;
  qrCodeId: string;
  targetUrl: string;
  title?: string;
  clickCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DynamicQrRecord {
  id: string; // short unique alphanumeric token (e.g. "dnp-k8x1a2")
  plateNumber: number;
  formattedNumber: string;
  buyerId: string;
  targetUrl: string;
  clickCount: number;
  lastClickAt?: string;
  createdAt: string;
  updatedAt?: string;
}
