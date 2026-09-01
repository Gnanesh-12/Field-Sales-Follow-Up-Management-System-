"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database with permanent records...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const emp1 = await prisma.employee.upsert({
        where: { id: 'se-fs-001' },
        update: { status: 'ACTIVE' },
        create: {
            id: 'se-fs-001',
            name: 'Rahul Sharma',
            phone: '+91 9876543210',
            password: hashedPassword,
            role: 'EMPLOYEE',
            status: 'ACTIVE',
        },
    });
    const emp2 = await prisma.employee.upsert({
        where: { id: 'se-fs-002' },
        update: { status: 'ACTIVE' },
        create: {
            id: 'se-fs-002',
            name: 'Priya Patel',
            phone: '+91 9123456780',
            password: hashedPassword,
            role: 'EMPLOYEE',
            status: 'ACTIVE',
        },
    });
    const site1Id = '507f1f77bcf86cd799439011';
    const site2Id = '507f1f77bcf86cd799439012';
    const site1 = await prisma.customerSite.upsert({
        where: { id: site1Id },
        update: {},
        create: {
            id: site1Id,
            name: 'Prestige Tech Cloud, Phase 2',
            address: 'Outer Ring Rd, Nagavara, Bengaluru',
            geoTag: 'Hebbal, Bengaluru',
        },
    });
    const site2 = await prisma.customerSite.upsert({
        where: { id: site2Id },
        update: {},
        create: {
            id: site2Id,
            name: 'Brigade Gateway Commercial',
            address: 'Dr Rajkumar Rd, Rajajinagar, Bengaluru',
            geoTag: 'Malleshwaram, Bengaluru',
        },
    });
    const visit1Id = '607f1f77bcf86cd799439021';
    const visit2Id = '607f1f77bcf86cd799439022';
    await prisma.fieldVisit.upsert({
        where: { id: visit1Id },
        update: {},
        create: {
            id: visit1Id,
            employeeId: emp1.id,
            customerSiteId: site1.id,
            notes: 'Client requested immediate quotation for electrical cabling and cement bags.',
            remarks: 'STATUS:PENDING | Materials: 5x Cement Bags, 20m PVC Conduits, 2x Switch Panels',
        },
    });
    await prisma.fieldVisit.upsert({
        where: { id: visit2Id },
        update: {},
        create: {
            id: visit2Id,
            employeeId: emp2.id,
            customerSiteId: site2.id,
            notes: 'Followed up on lighting requirements. Sample inspection approved by site engineer.',
            remarks: 'STATUS:APPROVED | Materials: 10x LED Panel Lights, 50m Heavy Duty Cable',
        },
    });
    console.log('✅ Persistent records verified.');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map