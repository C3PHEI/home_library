import * as coversService from '../services/covers.service.js'

// POST /api/covers/upload
export async function upload(req, res) {
    const result = await coversService.saveUpload(req.file)
    res.status(201).json(result)
}