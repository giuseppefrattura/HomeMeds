"use server";

import { query } from "@/lib/db";
import type { Medication, MedicationRow } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getMedicationsAction(): Promise<{
  success: boolean;
  data?: Medication[];
  error?: string;
}> {
  try {
    const result = await query<MedicationRow>(
      "SELECT id, name, quantity, expiry_date, created_at FROM medications ORDER BY expiry_date ASC;"
    );

    const data: Medication[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      expiryDate: new Date(row.expiry_date),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    }));

    return { success: true, data };
  } catch (err: any) {
    console.error("Error fetching medications from PostgreSQL:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch medications from database",
    };
  }
}

export async function addMedicationAction(data: {
  name: string;
  quantity: number;
  expiryDate: Date | string;
}): Promise<{
  success: boolean;
  data?: Medication;
  error?: string;
}> {
  try {
    const expiryDateObj = new Date(data.expiryDate);
    const formattedDate = expiryDateObj.toISOString().split("T")[0];

    const result = await query<MedicationRow>(
      `INSERT INTO medications (name, quantity, expiry_date)
       VALUES ($1, $2, $3)
       RETURNING id, name, quantity, expiry_date, created_at;`,
      [data.name.trim(), data.quantity, formattedDate]
    );

    const row = result.rows[0];
    const newMedication: Medication = {
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      expiryDate: new Date(row.expiry_date),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };

    revalidatePath("/");
    return { success: true, data: newMedication };
  } catch (err: any) {
    console.error("Error adding medication to PostgreSQL:", err);
    return {
      success: false,
      error: err.message || "Failed to add medication to database",
    };
  }
}

export async function deleteMedicationAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await query("DELETE FROM medications WHERE id = $1;", [id]);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting medication from PostgreSQL:", err);
    return {
      success: false,
      error: err.message || "Failed to delete medication from database",
    };
  }
}
