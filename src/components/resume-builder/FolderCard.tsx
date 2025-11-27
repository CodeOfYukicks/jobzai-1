// Folder interface - used by multiple components
export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  coverPhoto?: string;
  order: number;
  createdAt: any;
  updatedAt: any;
}
