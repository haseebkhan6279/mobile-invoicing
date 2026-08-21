import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { LookupsModule } from "./lookups/lookups.module";
import { CustomersModule } from "./customers/customers.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PurchaseOrdersModule } from "./purchase-orders/purchase-orders.module";
import { StockModule } from "./stock/stock.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { RmaModule } from "./rma/rma.module";
import { ShipmentsModule } from "./shipments/shipments.module";
import { SearchModule } from "./search/search.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    LookupsModule,
    CustomersModule,
    InvoicesModule,
    PurchaseOrdersModule,
    StockModule,
    SuppliersModule,
    RmaModule,
    ShipmentsModule,
    SearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
