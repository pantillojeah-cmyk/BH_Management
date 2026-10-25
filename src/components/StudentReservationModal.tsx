import React, { useState, useEffect, useMemo } from "react";
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
  ChevronDown,
} from "lucide-react";
import { ZAMBOANGA_DEL_SUR_MUNICIPALITIES } from "@/lib/zamboanga-del-sur-data";

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
  initialAddress?: string;
  termsAndConditions?: string | null;
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

function parseFullName(nameStr: string) {
  if (!nameStr) return { last: "", first: "", mi: "" };
  if (nameStr.includes(",")) {
    const [last, rest] = nameStr.split(",");
    const restParts = (rest || "").trim().split(/\s+/);
    if (
      restParts.length > 1 &&
      (restParts[restParts.length - 1].length <= 2 || restParts[restParts.length - 1].endsWith("."))
    ) {
      const mi = restParts.pop() || "";
      return { last: last.trim(), first: restParts.join(" "), mi: mi.replace(/\.?$/, "") };
    }
    return { last: last.trim(), first: (rest || "").trim(), mi: "" };
  }
  const parts = nameStr.trim().split(/\s+/);
  if (parts.length > 2 && (parts[1].length <= 2 || parts[1].endsWith("."))) {
    const first = parts[0];
    const mi = parts[1].replace(/\.?$/, "");
    const last = parts.slice(2).join(" ");
    return { last, first, mi };
  }
  if (parts.length > 1) {
    const last = parts.pop() || "";
    return { last, first: parts.join(" "), mi: "" };
  }
  return { last: nameStr.trim(), first: "", mi: "" };
}

export function StudentReservationModal({
  isOpen,
  onClose,
  onSubmit,
  boardingHouseName,
  roomName,
  monthlyFee,
  initialStudentName = "",
  initialContactNumber = "",
  initialAddress = "",
  termsAndConditions,
  isSubmitting = false,
}: StudentReservationModalProps) {
  const [showTerms, setShowTerms] = useState(false);
  // Separated Name Fields
  const initialParsed = parseFullName(initialStudentName);
  const [lastName, setLastName] = useState(initialParsed.last);
  const [firstName, setFirstName] = useState(initialParsed.first);
  const [middleInitial, setMiddleInitial] = useState(initialParsed.mi);

  // Zamboanga del Sur Address Dropdowns
  const [municipality, setMunicipality] = useState("Dimataling");
  const [barangay, setBarangay] = useState("Kagawasan");
  const [purok, setPurok] = useState("");
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState(initialAddress);

  const [contactNumber, setContactNumber] = useState(initialContactNumber);
  const [selectedCourse, setSelectedCourse] = useState("ACT");
  const [customCourse, setCustomCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("1st Year");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialStudentName && (!lastName && !firstName)) {
        const parsed = parseFullName(initialStudentName);
        setLastName(parsed.last);
        setFirstName(parsed.first);
        setMiddleInitial(parsed.mi);
      }
      if (initialContactNumber && !contactNumber) {
        setContactNumber(initialContactNumber);
      }
      if (initialAddress) {
        // Check if initialAddress matches ZDS format
        const matchMuni = ZAMBOANGA_DEL_SUR_MUNICIPALITIES.find((m) =>
          initialAddress.toLowerCase().includes(m.name.toLowerCase())
        );
        if (matchMuni) {
          setMunicipality(matchMuni.name);
          const matchBrgy = matchMuni.barangays.find((b) =>
            initialAddress.toLowerCase().includes(b.toLowerCase())
          );
          if (matchBrgy) setBarangay(matchBrgy);
        } else {
          setCustomAddress(initialAddress);
          setIsCustomAddress(true);
        }
      }
      setError(null);
    }
  }, [isOpen, initialStudentName, initialContactNumber, initialAddress]);

  const currentBarangays = useMemo(() => {
    const found = ZAMBOANGA_DEL_SUR_MUNICIPALITIES.find((m) => m.name === municipality);
    return found ? found.barangays : [];
  }, [municipality]);

  const handleMunicipalityChange = (muniName: string) => {
    setMunicipality(muniName);
    const found = ZAMBOANGA_DEL_SUR_MUNICIPALITIES.find((m) => m.name === muniName);
    if (found && found.barangays.length > 0) {
      if (muniName === "Dimataling") {
        setBarangay(found.barangays.includes("Kagawasan") ? "Kagawasan" : found.barangays[0]);
      } else {
        setBarangay(found.barangays[0]);
      }
    }
  };

  const computedAddress = isCustomAddress
    ? customAddress.trim()
    : `${purok.trim() ? `${purok.trim()}, ` : ""}${barangay}, ${municipality}, Zamboanga del Sur`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lastName.trim()) {
      setError("Please enter the student's last name.");
      return;
    }
    if (!firstName.trim()) {
      setError("Please enter the student's first name.");
      return;
    }

    const cleanLast = lastName.trim();
    const cleanFirst = firstName.trim();
    const cleanMi = middleInitial.trim().toUpperCase().replace(/\.?$/, "");
    const finalStudentName = `${cleanLast}, ${cleanFirst}${cleanMi ? ` ${cleanMi}.` : ""}`;

    if (!computedAddress.trim()) {
      setError("Please specify your home address.");
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
        studentName: finalStudentName,
        address: computedAddress,
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
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border border-white/60 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
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
              <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
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

        {/* Boarding House Terms & Conditions */}
        {termsAndConditions && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                Boarding House Rules & Terms
              </span>
              <button
                type="button"
                onClick={() => setShowTerms((v) => !v)}
                className="text-[11px] font-medium text-amber-700 dark:text-amber-300 underline hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer"
              >
                {showTerms ? "Hide Rules" : "View Rules"}
              </button>
            </div>
            {showTerms && (
              <p className="text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap pt-1.5 border-t border-amber-500/20">
                {termsAndConditions}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Separated Name: Last Name, First Name, Middle Initial */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <User className="h-3.5 w-3.5 text-emerald-600" /> Student Name
            </Label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 sm:col-span-5 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Last Name</span>
                <Input
                  id="student-last-name"
                  placeholder="e.g. Suarez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10 rounded-xl bg-background/60 text-sm focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="col-span-8 sm:col-span-5 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">First Name</span>
                <Input
                  id="student-first-name"
                  placeholder="e.g. Jaber"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10 rounded-xl bg-background/60 text-sm focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">M.I.</span>
                <Input
                  id="student-mi"
                  placeholder="e.g. A."
                  maxLength={4}
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                  className="h-10 rounded-xl bg-background/60 text-sm text-center focus:ring-emerald-500"
                />
              </div>
            </div>
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
              placeholder="09XXXXXXXXX"
              className="h-10 rounded-xl bg-background/60 text-sm focus:ring-emerald-500"
              required
            />
          </div>

          {/* Address: Entire Zamboanga del Sur Dropdowns */}
          <div className="space-y-2 rounded-2xl border border-emerald-500/25 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Address (Zamboanga del Sur)
              </Label>
              <button
                type="button"
                onClick={() => setIsCustomAddress((v) => !v)}
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {isCustomAddress ? "← Use ZDS dropdown selection" : "Outside ZDS / Type custom address"}
              </button>
            </div>

            {isCustomAddress ? (
              <div className="space-y-1.5 pt-1">
                <Input
                  placeholder="Enter complete address (e.g. Brgy. Poblacion, Ipil, Zamboanga Sibugay)"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="h-10 rounded-xl bg-background text-sm focus:ring-emerald-500"
                  required={isCustomAddress}
                />
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Municipality Dropdown */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Municipality / City</span>
                    <div className="relative">
                      <select
                        value={municipality}
                        onChange={(e) => handleMunicipalityChange(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-input bg-background text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                      >
                        {ZAMBOANGA_DEL_SUR_MUNICIPALITIES.map((m) => (
                          <option key={m.name} value={m.name}>
                            {m.name} {m.isCity ? "(City)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Barangay Dropdown */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Barangay</span>
                    <div className="relative">
                      <select
                        value={barangay}
                        onChange={(e) => setBarangay(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-input bg-background text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                      >
                        {currentBarangays.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Optional Purok / Sitio */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">Purok / Sitio / Street (Optional)</span>
                  <Input
                    placeholder="e.g. Purok 4"
                    value={purok}
                    onChange={(e) => setPurok(e.target.value)}
                    className="h-9 rounded-xl bg-background text-xs sm:text-sm focus:ring-emerald-500"
                  />
                </div>

                {/* Live Address Preview */}
                <div className="rounded-xl bg-background/80 border border-emerald-500/20 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-1 shadow-xs">
                  <span className="text-muted-foreground font-medium">Selected Address:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {computedAddress}
                  </span>
                </div>
              </div>
            )}
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
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
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
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-xl border border-input bg-background/60 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                {POPULAR_COURSES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

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
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
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
              className="rounded-xl h-10 px-4 text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.01] cursor-pointer"
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
