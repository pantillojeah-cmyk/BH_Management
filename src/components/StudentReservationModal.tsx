import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  User,
  MapPin,
  Phone,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export interface StudentReservationFormData {
  studentName: string;
  address: string;
  contactNumber: string;
  course: string;
  yearLevel: string;
}

interface StudentReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentReservationFormData) => Promise<void>;
  boardingHouseName: string;
  roomName?: string;
  monthlyFee?: number;
  initialStudentName?: string;
  initialContactNumber?: string;
  isSubmitting?: boolean;
}

const POPULAR_COURSES = [
  { value: "ACT", label: "ACT (Associate in Computer Technology)" },
  { value: "BSIS", label: "BSIS (Bachelor of Science in Information Systems)" },
  { value: "BPED", label: "BPED (Bachelor of Physical Education)" },
  { value: "BSED", label: "BSED (Bachelor of Secondary Education)" },
  { value: "BEED", label: "BEED (Bachelor of Elementary Education)" },
  { value: "BSHM", label: "BSHM (Bachelor of Science in Hospitality Management)" },
  { value: "BSA", label: "BSA (Bachelor of Science in Agriculture)" },
  { value: "Other", label: "Other / Other Course" },
];

const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];

export function StudentReservationModal({
  isOpen,
  onClose,
  onSubmit,
  boardingHouseName,
  roomName,
  monthlyFee,
  initialStudentName = "",
  initialContactNumber = "",
  isSubmitting = false,
}: StudentReservationModalProps) {
  const [studentName, setStudentName] = useState(initialStudentName);
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState(initialContactNumber);
  const [selectedCourse, setSelectedCourse] = useState("ACT");
  const [customCourse, setCustomCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("1st Year");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialStudentName && !studentName) {
        setStudentName(initialStudentName);
      }
      if (initialContactNumber && !contactNumber) {
        setContactNumber(initialContactNumber);
      }
      setError(null);
    }
  }, [isOpen, initialStudentName, initialContactNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentName.trim()) {
      setError("Please enter the student's full name.");
      return;
    }
    if (!address.trim()) {
      setError("Please enter your home/permanent address.");
      return;
    }
    if (!contactNumber.trim()) {
      setError("Please enter your contact number.");
      return;
    }

    const finalCourse =
      selectedCourse === "Other"
        ? customCourse.trim() || "Other"
        : selectedCourse;

    if (selectedCourse === "Other" && !customCourse.trim()) {
      setError("Please specify your course/program.");
      return;
    }

    try {
      await onSubmit({
        studentName: studentName.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        course: finalCourse,
        yearLevel,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to submit reservation.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 border border-white/60 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                Student Reservation Form
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Please fill out your details to secure your reservation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Boarding House Quick Summary */}
        <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 p-3.5 space-y-1 text-xs">
          <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-200">
            <span className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-emerald-600" />
              {boardingHouseName}
            </span>
            {roomName && (
              <span className="rounded-md bg-emerald-600/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300 font-bold">
                {roomName}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-muted-foreground pt-1">
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3 text-emerald-600" /> Hold duration: 48 hours
            </span>
            {monthlyFee !== undefined && monthlyFee > 0 && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ₱{monthlyFee.toLocaleString()}/mo
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="student-name" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <User className="h-3.5 w-3.5 text-emerald-600" /> Full Name
            </Label>
            <Input
              id="student-name"
              placeholder="e.g. Juan Dela Cruz"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="h-10 rounded-xl bg-background/60 text-sm focus:ring-emerald-500"
              required
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-1.5">
            <Label htmlFor="contact-number" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Phone className="h-3.5 w-3.5 text-emerald-600" /> Contact Number
            </Label>
            <Input
              id="contact-number"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="h-10 rounded-xl bg-background/60 text-sm focus:ring-emerald-500"
              required
            />
          </div>

          {/* Home Address */}
          <div className="space-y-1.5">
            <Label htmlFor="student-address" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Address
            </Label>
            <Input
              id="student-address"
              placeholder="e.g. Brgy. Poblacion, Claveria, Misamis Oriental"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 rounded-xl bg-background/60 text-sm focus:ring-emerald-500"
              required
            />
          </div>

          {/* Course / Program */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" /> Student Course
            </Label>
            
            {/* Quick buttons for the most requested courses */}
            <div className="grid grid-cols-3 gap-2">
              {["ACT", "BSIS", "BPED"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCourse(c)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    selectedCourse === c
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Dropdown for other options */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background/60 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {POPULAR_COURSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {selectedCourse === "Other" && (
              <Input
                placeholder="Type your course / program (e.g. BSA, BSED)..."
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                className="h-10 rounded-xl bg-background/60 text-sm focus:ring-emerald-500 mt-2"
                required
              />
            )}
          </div>

          {/* Year Level */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Year Level
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {YEAR_LEVELS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYearLevel(y)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                    yearLevel === y
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/30"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl h-10 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01]"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isSubmitting ? "Submitting…" : "Confirm Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
