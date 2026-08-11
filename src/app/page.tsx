"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AddMedicationDialog } from "@/components/medication-form";
import { MedicationList } from "@/components/medication-list";
import type { Medication } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getExpiryStatus, type ExpiryStatus } from "@/lib/utils";
import {
  getMedicationsAction,
  addMedicationAction,
  deleteMedicationAction,
} from "@/lib/actions";

type FilterStatus = "all" | ExpiryStatus;

export default function Home() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadMedications = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const res = await getMedicationsAction();
      if (res.success && res.data) {
        setMeds(res.data);
      } else {
        setDbError(res.error || "Could not connect to PostgreSQL database.");
      }
    } catch (err: any) {
      setDbError(err.message || "An unexpected error occurred while connecting to database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const handleAddMedication = async (newMedData: Omit<Medication, "id">) => {
    const res = await addMedicationAction(newMedData);
    if (res.success && res.data) {
      setMeds((prev) => [...prev, res.data!].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()));
      toast({
        title: "Medication Added",
        description: `${res.data.name} has been saved to the database.`,
      });
    } else {
      toast({
        title: "Error saving medication",
        description: res.error || "Failed to insert record into PostgreSQL.",
        variant: "destructive",
      });
      throw new Error(res.error);
    }
  };

  const handleDeleteMedication = async (id: string) => {
    const medToDelete = meds.find((m) => m.id === id);
    const res = await deleteMedicationAction(id);
    if (res.success) {
      setMeds((prev) => prev.filter((m) => m.id !== id));
      if (medToDelete) {
        toast({
          title: "Medication Removed",
          description: `${medToDelete.name} has been deleted from the database.`,
        });
      }
    } else {
      toast({
        title: "Error deleting medication",
        description: res.error || "Failed to remove record from PostgreSQL.",
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    let expired = 0;
    let soon = 0;
    let safe = 0;

    for (const med of meds) {
      const { status } = getExpiryStatus(med.expiryDate);
      if (status === "expired") expired++;
      else if (status === "soon") soon++;
      else safe++;
    }

    return { total: meds.length, expired, soon, safe };
  }, [meds]);

  const filteredMeds = useMemo(() => {
    return meds
      .filter((med) => {
        const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (filterStatus === "all") return true;
        const { status } = getExpiryStatus(med.expiryDate);
        return status === filterStatus;
      })
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [meds, searchTerm, filterStatus]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 shadow-xs">
        <nav className="flex items-center gap-2.5 text-lg font-semibold md:text-base">
          <Image
            src="/icon.png"
            alt="HomeMeds Logo"
            width={32}
            height={32}
            className="rounded-lg shrink-0 shadow-xs border border-primary/20"
          />
          <span className="text-xl font-bold tracking-tight">HomeMeds Manager</span>
        </nav>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border">
          <Database className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-mono">PostgreSQL: truenas.giuseppefrattura.it:5433</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-4 md:gap-6 md:p-8 max-w-6xl w-full mx-auto">
        {/* Database Error Banner */}
        {dbError && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertOctagon className="h-5 w-5 shrink-0" />
              <span>Database Connection Error: {dbError}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMedications}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry Connection
            </Button>
          </div>
        )}

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`p-3 rounded-lg border text-left transition-all ${
              filterStatus === "all"
                ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary"
                : "bg-card hover:bg-muted/50"
            }`}
          >
            <span className="text-xs text-muted-foreground font-medium">Total</span>
            <div className="text-2xl font-bold">{stats.total}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("safe")}
            className={`p-3 rounded-lg border text-left transition-all ${
              filterStatus === "safe"
                ? "bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
                : "bg-card hover:bg-muted/50"
            }`}
          >
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Safe
            </span>
            <div className="text-2xl font-bold text-emerald-900">{stats.safe}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("soon")}
            className={`p-3 rounded-lg border text-left transition-all ${
              filterStatus === "soon"
                ? "bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500"
                : "bg-card hover:bg-muted/50"
            }`}
          >
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Expiring Soon
            </span>
            <div className="text-2xl font-bold text-amber-900">{stats.soon}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("expired")}
            className={`p-3 rounded-lg border text-left transition-all ${
              filterStatus === "expired"
                ? "bg-rose-50 border-rose-500 shadow-xs ring-1 ring-rose-500"
                : "bg-card hover:bg-muted/50"
            }`}
          >
            <span className="text-xs text-rose-700 font-medium flex items-center gap-1">
              <AlertOctagon className="h-3.5 w-3.5" /> Expired
            </span>
            <div className="text-2xl font-bold text-rose-900">{stats.expired}</div>
          </button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>My Medications</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Track and manage household medicine expiration dates.
                </p>
              </div>
              <AddMedicationDialog onAdd={handleAddMedication} />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search medications..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadMedications}
                disabled={isLoading}
                title="Refresh from PostgreSQL"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm">Loading medications from database...</span>
              </div>
            ) : (
              <MedicationList medications={filteredMeds} onDelete={handleDeleteMedication} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
