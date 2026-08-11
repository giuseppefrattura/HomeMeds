"use client";

import type { Medication } from "@/lib/types";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getExpiryStatus } from "@/lib/utils";

type MedicationListProps = {
  medications: Medication[];
  onDelete: (id: string) => void;
};

export function MedicationList({ medications, onDelete }: MedicationListProps) {
  if (medications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center">
        <h3 className="text-xl font-medium">No Medications Found</h3>
        <p className="text-sm text-muted-foreground">
          Add a new medication to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead>Expires On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medications.map((med) => {
            const { status } = getExpiryStatus(med.expiryDate);
            return (
              <TableRow key={med.id}>
                <TableCell className="font-medium">{med.name}</TableCell>
                <TableCell className="text-center">{med.quantity}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{format(med.expiryDate, "MMMM d, yyyy")}</span>
                    {status === "expired" && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {status === "soon" && (
                      <Badge className="bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-100">
                        Expires Soon
                      </Badge>
                    )}
                    {status === "safe" && (
                      <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-100">
                        Safe
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${med.name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the medication &quot;{med.name}&quot; from your list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(med.id)}
                          className={cn(buttonVariants({ variant: "destructive" }))}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
