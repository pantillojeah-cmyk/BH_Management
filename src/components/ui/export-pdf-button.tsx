import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { getAdminListings } from "@/lib/server-fns";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPdfButtonProps {
  fileName?: string;
  className?: string;
}

export function ExportPdfButton({
  fileName = `boarding-houses-report-${new Date().toISOString().slice(0, 10)}.pdf`,
  className,
}: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // 1. Fetch listings with a 30-second timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 30000)
      );

      const listings = await Promise.race([
        getAdminListings({ data: { filter: "all" } }),
        timeoutPromise,
      ]);

      if (!listings || listings.length === 0) {
        toast.info("No boarding house listings found to export.");
        return;
      }

      // 2. Compute summaries
      const totalHouses = listings.length;
      const approvedCount = listings.filter((l) => l.status === "approved").length;
      const pendingCount = listings.filter((l) => l.status === "pending").length;
      const totalVacancies = listings.reduce((sum, l) => sum + (l.available_vacancies || 0), 0);
      const totalRooms = listings.reduce((sum, l) => sum + (l.num_rooms || 0), 0);

      // 3. Initialize Landscape PDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header Banner Background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 26, "F");

      // Accent Stripe
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(0, 26, pageWidth, 2, "F");

      // Header Titles
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("ZDSPGC BOARDING HOUSE VACANCY TRACKER", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("Zamboanga del Sur Provincial Government College — Dimataling Campus", 14, 18);

      const generatedAt = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      doc.text(`Generated: ${generatedAt}`, pageWidth - 14, 18, { align: "right" });

      // Sub-header Summary Section
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Boarding House Listings Summary Report", 14, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const summaryText = `Total Listings: ${totalHouses}   |   Approved: ${approvedCount}   |   Pending: ${pendingCount}   |   Total Vacancies: ${totalVacancies}   |   Total Rooms: ${totalRooms}`;
      doc.text(summaryText, 14, 42);

      // 4. Prepare Table Data
      const tableHead = [
        [
          "#",
          "Boarding House Name",
          "Address / Landmark",
          "Monthly Fee",
          "Pricing",
          "Vacancies",
          "Rooms",
          "Status",
          "Date Added",
        ],
      ];

      const tableRows = listings.map((l, index) => {
        const address = [l.address, l.landmark ? `(Near: ${l.landmark})` : ""]
          .filter(Boolean)
          .join(" ");

        const fee = `PHP ${Number(l.monthly_fee || 0).toLocaleString()}`;
        const priceType = l.price_type === "per_room" ? "Per Room" : "Per Person";
        const status = (l.status || "pending").toUpperCase();
        const dateAdded = l.created_at ? new Date(l.created_at).toLocaleDateString() : "—";

        return [
          (index + 1).toString(),
          l.name,
          address,
          fee,
          priceType,
          (l.available_vacancies ?? 0).toString(),
          (l.num_rooms ?? 0).toString(),
          status,
          dateAdded,
        ];
      });

      // 5. Draw AutoTable
      autoTable(doc, {
        head: tableHead,
        body: tableRows,
        startY: 47,
        margin: { left: 14, right: 14, bottom: 18 },
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          valign: "middle",
        },
        headStyles: {
          fillColor: [16, 185, 129], // emerald-600
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" }, // #
          1: { cellWidth: 50, fontStyle: "bold" }, // Name
          2: { cellWidth: 70 }, // Address
          3: { cellWidth: 26, halign: "right" }, // Monthly Fee
          4: { cellWidth: 24, halign: "center" }, // Price Type
          5: { cellWidth: 20, halign: "center" }, // Vacancies
          6: { cellWidth: 18, halign: "center" }, // Rooms
          7: { cellWidth: 24, halign: "center" }, // Status
          8: { cellWidth: 26, halign: "center" }, // Date Added
        },
        didParseCell: (data) => {
          // Color-code Status column
          if (data.section === "body" && data.column.index === 7) {
            const val = String(data.cell.raw).toUpperCase();
            if (val === "APPROVED") {
              data.cell.styles.textColor = [5, 150, 105]; // emerald-600
              data.cell.styles.fontStyle = "bold";
            } else if (val === "PENDING") {
              data.cell.styles.textColor = [217, 119, 6]; // amber-600
              data.cell.styles.fontStyle = "bold";
            } else if (val === "REJECTED") {
              data.cell.styles.textColor = [225, 29, 72]; // rose-600
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = (doc.internal as any).getNumberOfPages
            ? (doc.internal as any).getNumberOfPages()
            : doc.getNumberOfPages();
          const currentPage = data.pageNumber;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // slate-400

          doc.text(
            "Official System Report — ZDSPGC Campus Boarding House Management",
            14,
            pageHeight - 8
          );
          doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 14, pageHeight - 8, {
            align: "right",
          });
        },
      });

      // 6. Save PDF directly to user's downloads
      doc.save(fileName);
      toast.success("PDF report exported successfully!");
    } catch (err) {
      console.error("Export PDF failed:", err);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      disabled={loading}
      className={className}
      title="Export listings report as PDF"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
          <span>Exporting PDF…</span>
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4 text-emerald-600" />
          <span>Export PDF</span>
        </>
      )}
    </Button>
  );
}
