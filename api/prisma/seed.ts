import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const grades = [
  { code: "A+", label: "Near new", sortOrder: 1 },
  { code: "A", label: "Excellent", sortOrder: 2 },
  { code: "B", label: "Good", sortOrder: 3 },
  { code: "C", label: "Fair", sortOrder: 4 },
];

const colors = [
  "Black",
  "White",
  "Blue",
  "Gold",
  "Silver",
  "Graphite",
  "Green",
  "Purple",
  "Red",
  "Pink",
  "Yellow",
  "Midnight",
  "Starlight",
  "Space Gray",
  "Natural Titanium",
  "Black Titanium",
  "White Titanium",
  "Desert Titanium",
];

const networks = [
  "Unlocked",
  "Dual SIM",
  "EE",
  "Vodafone",
  "O2",
  "Three",
  "iD Mobile",
  "Sky",
  "Giffgaff",
];

async function main() {
  const passwordHash = await hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@ads.local" },
    update: { passwordHash, name: "ADS Admin" },
    create: {
      email: "admin@ads.local",
      name: "ADS Admin",
      passwordHash,
    },
  });

  for (const grade of grades) {
    await prisma.grade.upsert({
      where: { code: grade.code },
      update: grade,
      create: grade,
    });
  }

  for (const name of colors) {
    await prisma.color.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of networks) {
    await prisma.network.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const key of ["PO", "CL", "INV", "RMA", "SHP"]) {
    await prisma.numberCounter.upsert({
      where: { key },
      update: {},
      create: { key, value: 0 },
    });
  }

  console.log("Seeded admin@ads.local / admin1234 plus grades, colors, networks.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
