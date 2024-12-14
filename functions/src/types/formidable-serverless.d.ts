declare module 'formidable-serverless' {
    import { IncomingMessage } from 'http';

    export interface FormidableFile {
        size: number;
        path: string;
        name: string;
        type: string;
        mtime: string;
    }

    export type Fields = { [key: string]: string | string[] };
    export type Files = { [key: string]: FormidableFile };

    interface Options {
        multiples?: boolean;
        uploadDir?: string;
        keepExtensions?: boolean;
        maxFileSize?: number;
        maxFieldsSize?: number;
        maxFields?: number;
        hash?: boolean | 'sha1' | 'md5';
        fileWriteStreamHandler?: any;
    }

    export class IncomingForm {
        constructor(options?: Options);

        parse(
            req: IncomingMessage,
            callback: (err: Error | null, fields: Fields, files: Files) => any
        ): void;
    }

    export default IncomingForm;
}
