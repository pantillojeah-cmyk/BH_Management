import { Link } from "@tanstack/react-router";
import { MapPin, BedDouble, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type BH = Database["public"]["Tables"]["boarding_houses"]["Row"];

interface Props {
  house: BH;
  vacantRooms?: number;
  totalRooms?: number;
  minRent?: number | null;
}

const typeLabel: Record<string, string> = {
  mixed: "Mixed",
  male_only: "Male only",
  female_only: "Female only",
  family: "Family",
};

export function BoardingHouseCard({ house, vacantRooms = 0, totalRooms = 0, minRent }: Props) {
  const cover =
    house.cover_photo ||
    (house.photos && house.photos[0]) ||
    "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800";

  const distance =
    house.distance_meters < 1000
      ? `${house.distance_meters} m`
      : `${(house.distance_meters / 1000).toFixed(1)} km`;

  return (
    <Link
      to="/boarding-house/$id"
      params={{ id: house.id }}
      className="group block"
    >
      <Card className="overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-elegant">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={cover}
            alt={house.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant={vacantRooms > 0 ? "default" : "secondary"} className={vacantRooms > 0 ? "bg-success text-success-foreground" : ""}>
              {vacantRooms > 0 ? `${vacantRooms} vacant` : "Full"}
            </Badge>
            <Badge variant="outline" className="bg-background/80 backdrop-blur">
              {typeLabel[house.house_type] ?? house.house_type}
            </Badge>
          </div>
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-display text-lg font-bold">{house.name}</h3>
            {minRent != null && (
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold text-primary">₱{Number(minRent).toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">from /mo</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{house.address}</span>
          </div>
          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {totalRooms} rooms
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {distance} from campus
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
