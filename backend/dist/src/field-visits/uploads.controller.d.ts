export declare class UploadsController {
    uploadImage(req: any, file: any): Promise<{
        error: string;
        url?: undefined;
        filename?: undefined;
    } | {
        url: string;
        filename: string;
        error?: undefined;
    }>;
}
