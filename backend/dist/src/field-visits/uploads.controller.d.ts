export declare class UploadsController {
    uploadImage(file: any): Promise<{
        error: string;
        url?: undefined;
        filename?: undefined;
    } | {
        url: string;
        filename: any;
        error?: undefined;
    }>;
}
