import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton({ fetchUrl, fileName }: { fetchUrl: string; fileName: string }) {
  const handleExport = async () => {
    try {
      const res = await fetch(fetchUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" /> Export CSV
    </Button>
  );
}
