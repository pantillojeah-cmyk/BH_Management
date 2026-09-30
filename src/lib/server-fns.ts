import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// ─── Helper: get current user from request ───────────────────────────────────
async function getSessionUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

// ─── Boarding Houses ──────────────────────────────────────────────────────────

export const getApprovedListings = createServerFn({ method: "GET" }).handler(async () => {
  const houses = await prisma.boardingHouse.findMany({
    where: { status: "approved" },
    select: {
      id: true, name: true, address: true, landmark: true,
      monthlyFee: true, numRooms: true, availableVacancies: true,
      amenities: true, coverPhotoUrl: true, latitude: true, longitude: true,
      reviews: { select: { rating: true } },
      photos: { select: { url: true }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: "desc" },
  });
  return houses.map((h) => {
    const reviewCount = h.reviews.length;
    const avgRating = reviewCount > 0
      ? Math.round((h.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
      : null;
    return {
      id: h.id, name: h.name, address: h.address, landmark: h.landmark,
      monthly_fee: h.monthlyFee, num_rooms: h.numRooms,
      available_vacancies: h.availableVacancies, amenities: h.amenities,
      cover_photo_url: h.coverPhotoUrl,
      latitude: h.latitude, longitude: h.longitude,
      photos: h.photos.map(p => p.url),
      avg_rating: avgRating, review_count: reviewCount,
    };
  });
});

export const getListingPhotos = createServerFn({ method: "GET" })
  .validator((data: { boardingHouseId: string }) => data)
  .handler(async ({ data }) => {
    const photos = await prisma.boardingHousePhoto.findMany({
      where: { boardingHouseId: data.boardingHouseId },
      orderBy: { sortOrder: "asc" },
      select: { url: true },
    });
    return photos.map((p) => p.url);
  });

export const getListingById = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const bh = await prisma.boardingHouse.findUnique({ where: { id: data.id } });
    if (!bh) return null;
    const [photos, reviews] = await Promise.all([
      prisma.boardingHousePhoto.findMany({
        where: { boardingHouseId: data.id },
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      }),
      prisma.review.findMany({
        where: { boardingHouseId: data.id },
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      }),
    ]);
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
      : null;
    return {
      bh: {
        id: bh.id, owner_id: bh.ownerId, name: bh.name, address: bh.address,
        landmark: bh.landmark, contact_number: bh.contactNumber,
        description: bh.description, monthly_fee: bh.monthlyFee,
        num_rooms: bh.numRooms, available_vacancies: bh.availableVacancies,
        amenities: bh.amenities, cover_photo_url: bh.coverPhotoUrl,
        latitude: bh.latitude, longitude: bh.longitude,
        avg_rating: avgRating, review_count: reviewCount,
      },
      photos: photos.map((p) => p.url),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.createdAt.toISOString(),
        customer_name: r.customer.name ?? "Anonymous",
        customer_id: r.customerId,
      })),
    };
  });

// ─── Favorites ────────────────────────────────────────────────────────────────

export const getUserFavorites = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const favs = await prisma.favorite.findMany({
      where: { customerId: data.userId },
      select: { boardingHouseId: true },
    });
    return favs.map((f) => f.boardingHouseId);
  });

export const getFavoriteListings = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const favs = await prisma.favorite.findMany({
      where: { customerId: data.userId },
      include: {
        boardingHouse: {
          select: {
            id: true, name: true, address: true, landmark: true,
            monthlyFee: true, numRooms: true, availableVacancies: true,
            amenities: true, coverPhotoUrl: true, latitude: true, longitude: true,
            photos: { select: { url: true }, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    return favs.map((f) => ({
      id: f.boardingHouse.id, name: f.boardingHouse.name,
      address: f.boardingHouse.address, landmark: f.boardingHouse.landmark,
      monthly_fee: f.boardingHouse.monthlyFee, num_rooms: f.boardingHouse.numRooms,
      available_vacancies: f.boardingHouse.availableVacancies,
      amenities: f.boardingHouse.amenities, cover_photo_url: f.boardingHouse.coverPhotoUrl,
      latitude: f.boardingHouse.latitude, longitude: f.boardingHouse.longitude,
      photos: f.boardingHouse.photos.map(p => p.url),
    }));
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .validator((data: { userId: string; boardingHouseId: string; add: boolean }) => data)
  .handler(async ({ data }) => {
    if (data.add) {
      await prisma.favorite.upsert({
        where: { customerId_boardingHouseId: { customerId: data.userId, boardingHouseId: data.boardingHouseId } },
        create: { customerId: data.userId, boardingHouseId: data.boardingHouseId },
        update: {},
      });
    } else {
      await prisma.favorite.deleteMany({
        where: { customerId: data.userId, boardingHouseId: data.boardingHouseId },
      });
    }
    return { success: true };
  });

// ─── Inquiries ────────────────────────────────────────────────────────────────

export const sendInquiry = createServerFn({ method: "POST" })
  .validator((data: { customerId: string; boardingHouseId: string; message: string; ownerId: string | null; bhName: string }) => data)
  .handler(async ({ data }) => {
    await prisma.inquiry.create({
      data: {
        customerId: data.customerId,
        boardingHouseId: data.boardingHouseId,
        message: data.message,
      },
    });
    if (data.ownerId) {
      await prisma.notification.create({
        data: {
          userId: data.ownerId,
          title: "New inquiry",
          body: `Someone inquired about ${data.bhName}`,
          link: "/owner",
        },
      });
    }
    return { success: true };
  });

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const profile = await prisma.profile.findUnique({ where: { id: data.userId } });
    return profile ? { full_name: profile.fullName, phone: profile.phone } : null;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .validator((data: { userId: string; fullName: string; phone: string | null }) => data)
  .handler(async ({ data }) => {
    await prisma.profile.upsert({
      where: { id: data.userId },
      create: { id: data.userId, fullName: data.fullName, phone: data.phone },
      update: { fullName: data.fullName, phone: data.phone },
    });
    return { success: true };
  });

// ─── Owner ────────────────────────────────────────────────────────────────────

export const getOwnerListings = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const houses = await prisma.boardingHouse.findMany({
      where: { ownerId: data.userId },
      include: { photos: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return houses.map((h) => ({
      id: h.id, name: h.name, address: h.address, landmark: h.landmark,
      contact_number: h.contactNumber, description: h.description,
      monthly_fee: h.monthlyFee, num_rooms: h.numRooms,
      available_vacancies: h.availableVacancies, amenities: h.amenities,
      cover_photo_url: h.coverPhotoUrl, status: h.status.toLowerCase() as "pending" | "approved" | "rejected",
      latitude: h.latitude, longitude: h.longitude,
      extraPhotos: h.photos.map((p) => p.url),
    }));
  });

export const deleteListing = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await prisma.boardingHouse.delete({ where: { id: data.id } });
    return { success: true };
  });

export const updateVacancy = createServerFn({ method: "POST" })
  .validator((data: { id: string; delta: number }) => data)
  .handler(async ({ data }) => {
    const bh = await prisma.boardingHouse.findUnique({
      where: { id: data.id },
      select: { availableVacancies: true, numRooms: true },
    });
    if (!bh) throw new Error("Listing not found");
    const next = Math.min(bh.numRooms, Math.max(0, bh.availableVacancies + data.delta));
    await prisma.boardingHouse.update({
      where: { id: data.id },
      data: { availableVacancies: next },
    });
    return { availableVacancies: next };
  });


export const upsertListing = createServerFn({ method: "POST" })
  .validator((data: {
    id?: string; ownerId: string; name: string; address: string; landmark: string | null;
    contactNumber: string; description: string | null; monthlyFee: number; numRooms: number;
    availableVacancies: number; amenities: string[]; coverPhotoUrl: string | null;
    latitude?: number | null; longitude?: number | null;
    extraPhotos?: string[];
  }) => data)
  .handler(async ({ data }) => {
    const extraPhotos = data.extraPhotos ?? [];
    if (data.id) {
      // Update existing listing
      await prisma.boardingHouse.update({
        where: { id: data.id },
        data: {
          name: data.name, address: data.address, landmark: data.landmark,
          contactNumber: data.contactNumber, description: data.description,
          monthlyFee: data.monthlyFee, numRooms: data.numRooms,
          availableVacancies: data.availableVacancies, amenities: data.amenities,
          coverPhotoUrl: data.coverPhotoUrl,
          latitude: data.latitude !== undefined ? data.latitude : undefined,
          longitude: data.longitude !== undefined ? data.longitude : undefined,
        },
      });
      // Replace extra photos for this listing
      await prisma.boardingHousePhoto.deleteMany({ where: { boardingHouseId: data.id } });
      if (extraPhotos.length > 0) {
        await prisma.boardingHousePhoto.createMany({
  data: extraPhotos.map((url, i) => ({ boardingHouseId: data.id!, url, sortOrder: i })),
});
      }
    } else {
      const created = await prisma.boardingHouse.create({
        data: {
          ownerId: data.ownerId, name: data.name, address: data.address,
          landmark: data.landmark, contactNumber: data.contactNumber,
          description: data.description, monthlyFee: data.monthlyFee,
          numRooms: data.numRooms, availableVacancies: data.availableVacancies,
          amenities: data.amenities, coverPhotoUrl: data.coverPhotoUrl,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          status: "pending",
        },
      });
      if (extraPhotos.length > 0) {
        await prisma.boardingHousePhoto.createMany({
          data: extraPhotos.map((url, i) => ({
            boardingHouseId: created.id,
            url,
            sortOrder: i,
          })),
        });
      }
    }
    return { success: true };
  });

export const getOwnerInquiries = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const bhs = await prisma.boardingHouse.findMany({
      where: { ownerId: data.userId }, select: { id: true, name: true },
    });
    if (bhs.length === 0) return [];
    const bhIds = bhs.map((b) => b.id);
    const bhMap = new Map(bhs.map((b) => [b.id, b]));

    const inquiries = await prisma.inquiry.findMany({
      where: { boardingHouseId: { in: bhIds } },
      orderBy: { createdAt: "desc" },
    });
    const customerIds = [...new Set(inquiries.map((i) => i.customerId))];
    const profiles = customerIds.length > 0
      ? await prisma.profile.findMany({ where: { id: { in: customerIds } } })
      : [];
    const profMap = new Map(profiles.map((p) => [p.id, p]));

    return inquiries.map((i) => {
      const prof = profMap.get(i.customerId);
      return {
        id: i.id, message: i.message,
        status: i.status.toLowerCase() as "new" | "responded" | "closed",
        created_at: i.createdAt.toISOString(), customer_id: i.customerId,
        boarding_houses: bhMap.get(i.boardingHouseId) ?? null,
        profiles: prof ? { full_name: prof.fullName, email: prof.email, phone: prof.phone } : null,
      };
    });
  });

export const updateInquiryStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: "responded" | "closed" }) => data)
  .handler(async ({ data }) => {
    await prisma.inquiry.update({
      where: { id: data.id },
      data: { status: data.status },
    });
    return { success: true };
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  const [houses, pending, owners, customers, allApproved] = await Promise.all([
    prisma.boardingHouse.count(),
    prisma.boardingHouse.count({ where: { status: "pending" } }),
    prisma.userRole.count({ where: { role: "owner" } }),
    prisma.userRole.count({ where: { role: "customer" } }),
    prisma.boardingHouse.findMany({ where: { status: "approved" }, select: { availableVacancies: true } }),
  ]);
  const vacancies = allApproved.reduce((s, h) => s + h.availableVacancies, 0);
  return { houses, pending, owners, customers, vacancies };
});

export const getAdminListings = createServerFn({ method: "GET" })
  .validator((data: { filter: string; startDate?: string; endDate?: string }) => data)
  .handler(async ({ data }) => {
    const { filter, startDate, endDate } = data;
    const where: any = {};
    if (filter && filter !== "all") {
      where.status = filter as any;
    }
    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = {
        ...(where.createdAt || {}),
        lte: new Date(endDate),
      };
    }
    const houses = await prisma.boardingHouse.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { photos: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return houses.map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      monthly_fee: h.monthlyFee,
      available_vacancies: h.availableVacancies,
      num_rooms: h.numRooms,
      status: h.status.toLowerCase() as "pending" | "approved" | "rejected",
      owner_id: h.ownerId,
      created_at: h.createdAt.toISOString(),
      cover_photo_url: h.coverPhotoUrl ?? null,
      latitude: h.latitude,
      longitude: h.longitude,
      photos: h.photos.map((p) => p.url),
    }));
  });

export const setListingStatus = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: "approved" | "rejected" }) => data)
  .handler(async ({ data }) => {
    await prisma.boardingHouse.update({ where: { id: data.id }, data: { status: data.status } });
    return { success: true };
  });

export const adminDeleteListing = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await prisma.boardingHouse.delete({ where: { id: data.id } });
    return { success: true };
  });

export const getAdminUsers = createServerFn({ method: "GET" }).handler(async () => {
  const roles = await prisma.userRole.findMany();
  const userIds = [...new Set(roles.map((r) => r.userId))];
  if (userIds.length === 0) return [];
  const profiles = await prisma.profile.findMany({ where: { id: { in: userIds } } });
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const profMap = new Map(profiles.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  return roles.map((r) => {
    const p = profMap.get(r.userId);
    const u = userMap.get(r.userId);
    return {
      id: r.userId,
      full_name: p?.fullName ?? u?.name ?? "—",
      email: p?.email ?? u?.email ?? null,
      phone: p?.phone ?? null,
      role: r.role.toLowerCase(),
    };
  });
});

export const adminUpdateUserRole = createServerFn({ method: "POST" })
  .validator((data: { userId: string; role: "customer" | "owner" | "admin" }) => data)
  .handler(async ({ data }) => {
    await prisma.userRole.deleteMany({ where: { userId: data.userId } });
    await prisma.userRole.create({
      data: {
        userId: data.userId,
        role: data.role as any,
      },
    });
    return { success: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await prisma.user.delete({ where: { id: data.userId } });
    } catch {
      await prisma.userRole.deleteMany({ where: { userId: data.userId } });
      await prisma.profile.deleteMany({ where: { id: data.userId } });
    }
    return { success: true };
  });

export const adminUpdateUserProfile = createServerFn({ method: "POST" })
  .validator((data: { userId: string; fullName: string; email?: string; phone?: string; role: "customer" | "owner" | "admin" }) => data)
  .handler(async ({ data }) => {
    await prisma.profile.upsert({
      where: { id: data.userId },
      update: {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
      },
      create: {
        id: data.userId,
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
      },
    });

    try {
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          name: data.fullName,
          ...(data.email ? { email: data.email } : {}),
        },
      });
    } catch {}

    await prisma.userRole.deleteMany({ where: { userId: data.userId } });
    await prisma.userRole.create({
      data: {
        userId: data.userId,
        role: data.role as any,
      },
    });

    return { success: true };
  });

export const getVacancyReport = createServerFn({ method: "GET" }).handler(async () => {
  const houses = await prisma.boardingHouse.findMany({
    where: { status: "approved" },
    select: { name: true, availableVacancies: true, numRooms: true, monthlyFee: true },
  });
  return houses.map((h) => ({
    name: h.name, available_vacancies: h.availableVacancies,
    num_rooms: h.numRooms, monthly_fee: h.monthlyFee,
  }));
});

// ─── User Role ────────────────────────────────────────────────────────────────

export const getUserRole = createServerFn({ method: "GET" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const role = await prisma.userRole.findFirst({ where: { userId: data.userId } });
    return role ? role.role.toLowerCase() : null;
  });

// ─── Setup ────────────────────────────────────────────────────────────────────

export const claimAdminIfFirst = createServerFn({ method: "POST" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const count = await prisma.userRole.count({ where: { role: "admin" } });
    if (count > 0) return false;
    await prisma.userRole.create({ data: { userId: data.userId, role: "admin" } });
    // also create profile if missing
    await prisma.profile.upsert({
      where: { id: data.userId },
      create: { id: data.userId, fullName: "Admin" },
      update: {},
    });
    return true;
  });

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const submitReview = createServerFn({ method: "POST" })
  .validator((data: { boardingHouseId: string; customerId: string; rating: number; comment: string }) => data)
  .handler(async ({ data }) => {
    // Check if the customer has a confirmed reservation for this boarding house
    const confirmedRes = await prisma.reservation.findFirst({
      where: {
        boardingHouseId: data.boardingHouseId,
        customerId: data.customerId,
        status: "confirmed",
      },
    });

    if (!confirmedRes) {
      throw new Error("You must have a confirmed reservation to leave a review.");
    }

    const rating = Math.min(5, Math.max(1, Math.round(data.rating)));
    await prisma.review.upsert({
      where: { customerId_boardingHouseId: { customerId: data.customerId, boardingHouseId: data.boardingHouseId } },
      create: { customerId: data.customerId, boardingHouseId: data.boardingHouseId, rating, comment: data.comment || null },
      update: { rating, comment: data.comment || null },
    });
    return { success: true };
  });

export const getMyReview = createServerFn({ method: "GET" })
  .validator((data: { boardingHouseId: string; customerId: string }) => data)
  .handler(async ({ data }) => {
    const review = await prisma.review.findUnique({
      where: { customerId_boardingHouseId: { customerId: data.customerId, boardingHouseId: data.boardingHouseId } },
    });
    return review ? { rating: review.rating, comment: review.comment ?? "" } : null;
  });

// ─── Reservations ─────────────────────────────────────────────────────────────

export const getListingRoomReservations = createServerFn({ method: "GET" })
  .validator((data: { boardingHouseId: string }) => data)
  .handler(async ({ data }) => {
    const now = new Date();
    const reservations = await prisma.reservation.findMany({
      where: {
        boardingHouseId: data.boardingHouseId,
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: now } },
        ],
      },
      select: {
        id: true,
        roomDeck: true,
        status: true,
        customerId: true,
      },
    });
    return reservations;
  });

export const createReservation = createServerFn({ method: "POST" })
  .validator((data: { boardingHouseId: string; customerId: string; roomDeck?: string; price?: number }) => data)
  .handler(async ({ data }) => {
    const now = new Date();
    const roomDeck = data.roomDeck || "Room 1 - Lower Deck";

    // Check if the specific room/deck is already reserved or confirmed
    const roomTaken = await prisma.reservation.findFirst({
      where: {
        boardingHouseId: data.boardingHouseId,
        roomDeck: roomDeck,
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: now } },
        ],
      },
    });
    if (roomTaken) {
      throw new Error(`The room/deck "${roomDeck}" is already reserved or occupied.`);
    }

    // Check if user already has an active reservation for this listing
    const existing = await prisma.reservation.findFirst({
      where: {
        boardingHouseId: data.boardingHouseId,
        customerId: data.customerId,
        status: "pending",
        expiresAt: { gt: now },
      },
    });
    if (existing) throw new Error("You already have an active pending reservation for this boarding house.");

    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 hours
    const reservation = await prisma.reservation.create({
      data: {
        boardingHouseId: data.boardingHouseId,
        customerId: data.customerId,
        roomDeck: roomDeck,
        price: data.price ?? null,
        status: "pending",
        expiresAt,
      },
    });

    try {
      const bh = await prisma.boardingHouse.findUnique({
        where: { id: data.boardingHouseId },
        select: { availableVacancies: true },
      });
      if (bh && bh.availableVacancies > 0) {
        await prisma.boardingHouse.update({
          where: { id: data.boardingHouseId },
          data: { availableVacancies: bh.availableVacancies - 1 },
        });
      }
    } catch {}

    return {
      id: reservation.id,
      roomDeck: reservation.roomDeck,
      price: reservation.price,
      expiresAt: reservation.expiresAt.toISOString(),
    };
  });

export const getCustomerReservations = createServerFn({ method: "GET" })
  .validator((data: { customerId: string }) => data)
  .handler(async ({ data }) => {
    const now = new Date();
    const reservations = await prisma.reservation.findMany({
      where: { customerId: data.customerId },
      include: { boardingHouse: { select: { name: true, address: true, coverPhotoUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    // Lazily expire overdue pending reservations
    const expiredIds = reservations
      .filter((r) => r.status === "pending" && r.expiresAt < now)
      .map((r) => r.id);
    if (expiredIds.length) {
      await prisma.reservation.updateMany({ where: { id: { in: expiredIds } }, data: { status: "expired" } });
    }
    return reservations.map((r) => ({
      id: r.id,
      boardingHouseId: r.boardingHouseId,
      boardingHouseName: r.boardingHouse.name,
      boardingHouseAddress: r.boardingHouse.address,
      boardingHouseCover: r.boardingHouse.coverPhotoUrl,
      roomDeck: r.roomDeck,
      price: r.price,
      status: expiredIds.includes(r.id) ? "expired" : r.status,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  });

export const getActiveReservationForListing = createServerFn({ method: "GET" })
  .validator((data: { boardingHouseId: string; customerId: string }) => data)
  .handler(async ({ data }) => {
    const now = new Date();
    const reservation = await prisma.reservation.findFirst({
      where: {
        boardingHouseId: data.boardingHouseId,
        customerId: data.customerId,
        status: "pending",
        expiresAt: { gt: now },
      },
    });
    if (!reservation) return null;
    return {
      id: reservation.id,
      roomDeck: reservation.roomDeck,
      price: reservation.price,
      expiresAt: reservation.expiresAt.toISOString(),
    };
  });

export const getConfirmedReservationForListing = createServerFn({ method: "GET" })
  .validator((data: { boardingHouseId: string; customerId: string }) => data)
  .handler(async ({ data }) => {
    const reservation = await prisma.reservation.findFirst({
      where: {
        boardingHouseId: data.boardingHouseId,
        customerId: data.customerId,
        status: "confirmed",
      },
    });
    return !!reservation;
  });

export const getOwnerReservations = createServerFn({ method: "GET" })
  .validator((data: { ownerId: string }) => data)
  .handler(async ({ data }) => {
    const now = new Date();
    const reservations = await prisma.reservation.findMany({
      where: { boardingHouse: { ownerId: data.ownerId } },
      include: {
        boardingHouse: { select: { name: true, address: true } },
        customer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const expiredIds = reservations
      .filter((r) => r.status === "pending" && r.expiresAt < now)
      .map((r) => r.id);
    if (expiredIds.length) {
      await prisma.reservation.updateMany({ where: { id: { in: expiredIds } }, data: { status: "expired" } });
    }
    return reservations.map((r) => ({
      id: r.id,
      boardingHouseName: r.boardingHouse.name,
      customerName: r.customer.name ?? "Unknown",
      customerEmail: r.customer.email ?? "",
      roomDeck: r.roomDeck,
      price: r.price,
      status: expiredIds.includes(r.id) ? "expired" : r.status,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  });

export const cancelReservation = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const res = await prisma.reservation.findUnique({ where: { id: data.id } });
    await prisma.reservation.update({
      where: { id: data.id },
      data: { status: "cancelled" },
    });
    if (res) {
      try {
        const bh = await prisma.boardingHouse.findUnique({
          where: { id: res.boardingHouseId },
          select: { availableVacancies: true, numRooms: true },
        });
        if (bh && bh.availableVacancies < bh.numRooms) {
          await prisma.boardingHouse.update({
            where: { id: res.boardingHouseId },
            data: { availableVacancies: bh.availableVacancies + 1 },
          });
        }
      } catch {}
    }
    return { success: true };
  });

export const confirmReservation = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await prisma.reservation.update({
      where: { id: data.id },
      data: { status: "confirmed" },
    });
    return { success: true };
  });
