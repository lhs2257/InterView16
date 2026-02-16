
// pdf-parse is a CommonJS module, so we need to use require or specific import
// To avoid compilation issues with 'import pdf from "pdf-parse"', we use require here.

// @ts-ignore
let pdf: any;

try {
    const lib = require('pdf-parse');
    pdf = typeof lib === 'function' ? lib : lib.default;
    console.log('pdf-parse module loaded successfully, type:', typeof pdf);
} catch (e) {
    console.error('Failed to require pdf-parse:', e);
}

export async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        if (!pdf) {
            console.error('pdf-parse variable is null/undefined');
            throw new Error('pdf-parse module not loaded');
        }

        console.log('Calling pdf-parse with buffer of size:', buffer.length);
        console.log('Buffer isBuffer:', Buffer.isBuffer(buffer));
        console.log('pdf function type:', typeof pdf);

        const data = await pdf(buffer);
        console.log('pdf-parse returned data, text length:', data.text?.length);
        return data.text;
    } catch (error) {
        console.error('PDF Parse Internal Error:', error);
        throw error;
    }
}
