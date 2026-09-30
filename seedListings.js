import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const listings = [
  {
    name: "Sunshine Boarding House",
    description: "A cozy and affordable place for students. Includes daily cleaning and secure access. Perfect for long studying nights.",
    address: "123 Mabini St., Dimataling, Zamboanga del Sur",
    landmark: "Near the Main Gate of ZDSPGC",
    contactNumber: "09123456789",
    monthlyFee: 1500,
    numRooms: 10,
    availableVacancies: 3,
    amenities: ["Wi-Fi", "Water", "Electricity", "Study Area"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Greenery Residences",
    description: "Surrounded by nature, offering a peaceful environment away from the noise of the main road. Fully furnished.",
    address: "Purok 4, Poblacion, Dimataling",
    landmark: "Behind the Municipal Hall",
    contactNumber: "09234567890",
    monthlyFee: 2000,
    numRooms: 15,
    availableVacancies: 5,
    amenities: ["Wi-Fi", "Water", "Electricity", "Parking", "Kitchen"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Dimataling Student Dorm",
    description: "Strictly for students. Very near to the campus. Affordable rates for bedspacing.",
    address: "Rizal Avenue, Dimataling",
    landmark: "Beside 7-Eleven",
    contactNumber: "09345678901",
    monthlyFee: 1200,
    numRooms: 20,
    availableVacancies: 12,
    amenities: ["Water", "Electricity", "CCTV", "Laundry"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "The Executive Rooms",
    description: "Premium rooms for students and employees. Features air-conditioning and private bathrooms.",
    address: "San Jose St., Dimataling",
    landmark: "Near the Plaza",
    contactNumber: "09456789012",
    monthlyFee: 3500,
    numRooms: 8,
    availableVacancies: 2,
    amenities: ["Wi-Fi", "Water", "Electricity", "Air Conditioning", "CCTV"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Cozy Corner Pad",
    description: "A small, quiet boarding house perfect for individuals seeking privacy.",
    address: "Purok 2, Dimataling",
    landmark: "Near the Public Market",
    contactNumber: "09567890123",
    monthlyFee: 1800,
    numRooms: 5,
    availableVacancies: 1,
    amenities: ["Wi-Fi", "Water", "Electricity"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Mabuhay Boarding House",
    description: "Spacious rooms with double deck beds. Well-ventilated and secure compound.",
    address: "Quezon St., Dimataling",
    landmark: "Across the Elementary School",
    contactNumber: "09678901234",
    monthlyFee: 1400,
    numRooms: 12,
    availableVacancies: 0,
    amenities: ["Water", "Electricity", "Study Area", "CCTV"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Star Light Apartments",
    description: "Modern apartment-style living with kitchenettes and private CR for every unit.",
    address: "Bonifacio St., Dimataling",
    landmark: "Near Rural Bank",
    contactNumber: "09789012345",
    monthlyFee: 4000,
    numRooms: 10,
    availableVacancies: 4,
    amenities: ["Wi-Fi", "Water", "Electricity", "Kitchen", "Air Conditioning", "Parking"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1502672260266-1c1e52409818?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Campus View Lodge",
    description: "You can see the ZDSPGC campus right from your window! Extremely convenient for early classes.",
    address: "Campus Drive, Dimataling",
    landmark: "Directly opposite ZDSPGC",
    contactNumber: "09890123456",
    monthlyFee: 1600,
    numRooms: 18,
    availableVacancies: 6,
    amenities: ["Wi-Fi", "Water", "Electricity", "Generator", "Study Area"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Peaceful Haven Dormitory",
    description: "Large dormitory built for budget-conscious students. Free potable water and large communal study areas.",
    address: "Purok 5, Dimataling",
    landmark: "Near the Basketball Court",
    contactNumber: "09901234567",
    monthlyFee: 1000,
    numRooms: 25,
    availableVacancies: 15,
    amenities: ["Water", "Electricity", "Laundry", "Study Area"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  },
  {
    name: "Rose Garden Rooms",
    description: "Safe and secure boarding house specifically for ladies. Curfew hours are strictly implemented.",
    address: "Burgos St., Dimataling",
    landmark: "Behind the Church",
    contactNumber: "09112233445",
    monthlyFee: 1800,
    numRooms: 12,
    availableVacancies: 2,
    amenities: ["Wi-Fi", "Water", "Electricity", "CCTV", "Kitchen"],
    coverPhotoUrl: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800&auto=format&fit=crop",
    status: "approved"
  }
];

async function main() {
  console.log('Seeding 10 boarding houses...');
  for (const listing of listings) {
    await prisma.boardingHouse.create({ data: listing });
  }
  console.log('Seed completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
