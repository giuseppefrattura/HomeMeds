"use client";

import { useState, useEffect, useMemo } from 'react';
import { Pill, Search } from 'lucide-react';
import { AddMedicationDialog } from '@/components/medication-form';
import { MedicationList } from '@/components/medication-list';
import type { Medication } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, isPast } from "date-fns";

export default function Home() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedMeds = localStorage.getItem('homeMeds');
    if (storedMeds) {
      const parsedMeds: Medication[] = JSON.parse(storedMeds).map((med: any) => ({
        ...med,
        expiryDate: new Date(med.expiryDate),
      }));
      setMeds(parsedMeds);

      const expiringSoon = parsedMeds.filter(med => {
        const daysLeft = differenceInDays(med.expiryDate, new Date());
        return !isPast(med.expiryDate) && daysLeft <= 7;
      });
  
      const expired = parsedMeds.filter(med => isPast(med.expiryDate));

      if (expired.length > 0) {
        setTimeout(() => {
          toast({
              title: "Medication Expired!",
              description: `${expired.length} medication(s) have expired. Please check your list.`,
              variant: "destructive",
          });
        }, 500);
      }
  
      if (expiringSoon.length > 0) {
        setTimeout(() => {
          toast({
              title: "Expiring Soon!",
              description: `${expiringSoon.length} medication(s) will expire within a week.`,
          });
        }, 1000);
      }
    }
    setIsLoaded(true);
  }, [toast]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('homeMeds', JSON.stringify(meds));
    }
  }, [meds, isLoaded]);

  const handleAddMedication = (newMedData: Omit<Medication, 'id'>) => {
    const newMed: Medication = {
      id: crypto.randomUUID(),
      ...newMedData,
    };
    setMeds(prevMeds => [...prevMeds, newMed]);
    toast({
      title: "Success!",
      description: `${newMed.name} has been added to your list.`,
      className: "bg-accent text-accent-foreground"
    })
  };

  const handleDeleteMedication = (id: string) => {
    setMeds(prevMeds => prevMeds.filter(med => med.id !== id));
  };

  const filteredMeds = useMemo(() => {
    return meds
      .filter(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [meds, searchTerm]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Pill className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">HomeMeds Manager</span>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>My Medications</CardTitle>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search medications..."
                  className="pl-8 sm:w-[300px]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <AddMedicationDialog onAdd={handleAddMedication} />
            </div>
          </CardHeader>
          <CardContent>
            <MedicationList medications={filteredMeds} onDelete={handleDeleteMedication} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
