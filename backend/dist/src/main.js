"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    if (process.env.STORAGE_PATH) {
        app.useStaticAssets((0, path_1.join)(process.cwd(), process.env.STORAGE_PATH), {
            prefix: '/uploads/',
        });
    }
    else {
        console.warn('STORAGE_PATH environment variable is missing. Local file serving for legacy uploads is disabled.');
    }
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map