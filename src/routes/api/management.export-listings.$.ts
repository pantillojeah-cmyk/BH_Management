import { createFileRoute } from "@tanstack/react-router";
import { getAdminListings } from "@/lib/server-fns";

export const Route = createFileRoute("/api/management/export-listings/$")({
  server: {
    handlers: {
      GET: async () => {
        const listings = await getAdminListings({ data: { filter: "all" } });
        const header = "id,name,address,monthly_fee,available_vacancies,num_rooms,status,owner_id,created_at";
        const rows = listings.map(l => `${l.id},"${l.name}","${l.address}",${l.monthly_fee},${l.available_vacancies},${l.num_rooms},${l.status},${l.owner_id ?? ''},${l.created_at}`).join("\n");
        const csv = `${header}\n${rows}`;
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=\"listings.csv\"",
          },
        });
      },
    },
  },
});
