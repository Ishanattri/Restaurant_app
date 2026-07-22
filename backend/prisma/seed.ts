import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@tastyhouse.test" },
    update: {},
    create: {
      email: "owner@tastyhouse.test",
      passwordHash,
      name: "Priya Sharma",
      role: "RESTAURANT_OWNER",
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Tasty House",
      description: "Authentic North Indian & Chinese cuisine",
      cuisine: "Indian, Chinese",
      address: "12 MG Road, Bengaluru",
      lat: 12.9716,
      lng: 77.5946,
      rating: 4.5,
    },
  });

  const menuItemsData = [
    { name: "Paneer Butter Masala", category: "Main Course", price: 220, isVeg: true, description: "Creamy tomato gravy with paneer cubes" },
    { name: "Butter Chicken", category: "Main Course", price: 260, isVeg: false, description: "Classic creamy tomato butter chicken" },
    { name: "Veg Hakka Noodles", category: "Chinese", price: 160, isVeg: true, description: "Stir-fried noodles with vegetables" },
    { name: "Chilli Chicken", category: "Chinese", price: 210, isVeg: false, description: "Indo-Chinese style spicy chicken" },
    { name: "Garlic Naan", category: "Breads", price: 45, isVeg: true, description: "Tandoor-baked bread with garlic" },
    { name: "Gulab Jamun", category: "Desserts", price: 90, isVeg: true, description: "Soft milk dumplings in sugar syrup" },
  ];

  for (const item of menuItemsData) {
    const existing = await prisma.menuItem.findFirst({
      where: { restaurantId: restaurant.id, name: item.name },
    });
    if (!existing) {
      await prisma.menuItem.create({ data: { ...item, restaurantId: restaurant.id } });
    }
  }

  const customer = await prisma.user.upsert({
    where: { email: "customer@test.dev" },
    update: {},
    create: {
      email: "customer@test.dev",
      passwordHash,
      name: "Arjun Mehta",
      role: "CUSTOMER",
    },
  });

  const existingAddress = await prisma.address.findFirst({ where: { userId: customer.id } });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: "Home",
        line1: "45 Indiranagar 100ft Road",
        city: "Bengaluru",
        lat: 12.9784,
        lng: 77.6408,
      },
    });
  }

  const rider = await prisma.user.upsert({
    where: { email: "rider@test.dev" },
    update: {},
    create: {
      email: "rider@test.dev",
      passwordHash,
      name: "Karan Singh",
      role: "RIDER",
    },
  });
  await prisma.riderProfile.upsert({
    where: { userId: rider.id },
    update: {},
    create: { userId: rider.id, isAvailable: true },
  });

  console.log("Seed complete. Test accounts (password: password123):");
  console.log("  Restaurant owner: owner@tastyhouse.test");
  console.log("  Customer:         customer@test.dev");
  console.log("  Rider:            rider@test.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
