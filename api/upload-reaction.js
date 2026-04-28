export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
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

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || 'video/webm';
    const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;

    const { createHash } = await import('crypto');
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'reactions';
    const signature = createHash('sha256')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          api_key: apiKey,
          timestamp: String(timestamp),
          signature,
          folder,
          resource_type: 'video',
        }),
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      res.status(500).json({ error: 'Upload failed', details: err }); return;
    }

    const data = await uploadRes.json();
    const mp4Url = `https://res.cloudinary.com/${cloudName}/video/upload/vc_h264,ac_aac,f_mp4/${data.public_id}.mp4`;

    res.status(200).json({ success: true, mp4Url, publicId: data.public_id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
