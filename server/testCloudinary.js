
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

console.log('Cloud name configured:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('API key configured:', !!process.env.CLOUDINARY_API_KEY);
console.log('API secret configured:', !!process.env.CLOUDINARY_API_SECRET);

try {
    const result = await cloudinary.uploader.upload(
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        { resource_type: 'image' }
    );

    console.log('UPLOAD SUCCESS:', result.secure_url);
} catch (error) {
    console.log('UPLOAD FAILED');
    console.log('Status:', error.http_code);
    console.log('Message:', error.message);
    console.dir(error, { depth: 5 });
}
