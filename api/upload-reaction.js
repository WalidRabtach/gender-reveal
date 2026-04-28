// api/upload-reaction.js
// Vercel serverless function — receives WebM video, uploads to Cloudinary, returns MP4 link

export const config = {
  api: { bodyParser: false, sizeLimit: '100mb' }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(500).json({ error: 'Cloudinary not configured' }); return;
    }

    // Read raw body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // Generate signature for authenticated upload
    const timestamp = Math.round(Date.now() / 1000);
    const folder    = 'gender-reveal-reactions';

    // Build signature string
    const crypto = await import('crypto');
    const sigStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.default
      .createHash('sha256')
      .update(sigStr)
      .digest('hex');

    // Upload to Cloudinary via multipart form
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file',      buffer,    { filename: 'reaction.webm', contentType: 'video/webm' });
    form.append('api_key',   apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('folder',    folder);
    form.append('resource_type', 'video');
    // Auto-transcode to MP4 H.264/AAC on delivery
    form.append('eager', 'vc_h264:baseline:3.0,ac_aac,br_128k/f_mp4');
    form.append('eager_async', 'true');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body:   form,
      headers: form.getHeaders()
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('Cloudinary error:', err);
      res.status(500).json({ error: 'Upload failed', details: err }); return;
    }

    const data = await uploadRes.json();

    // Build MP4 URL — Cloudinary auto-converts via URL transformation
    const mp4Url = `https://res.cloudinary.com/${cloudName}/video/upload/vc_h264,ac_aac,br_128k,f_mp4/${data.public_id}.mp4`;

    // Return both URLs
    res.status(200).json({
      success:  true,
      mp4Url,                          // Direct MP4 link (shareable on WhatsApp)
      webmUrl:  data.secure_url,       // Original WebM
      publicId: data.public_id,
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
