import multer from 'multer'

// Upload im Arbeitsspeicher halten: sharp liest direkt aus dem Buffer und
// schreibt nur das verkleinerte WebP auf die Platte. Grenze 10 MB.
export const uploadCover = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single('file')