export type Medication = {
  id: string;
  name: string;
  quantity: number;
  expiryDate: Date;
  createdAt?: Date;
};

export type MedicationRow = {
  id: string;
  name: string;
  quantity: number;
  expiry_date: string | Date;
  created_at?: string | Date;
};

export type CreateMedicationInput = {
  name: string;
  quantity: number;
  expiryDate: Date;
};
