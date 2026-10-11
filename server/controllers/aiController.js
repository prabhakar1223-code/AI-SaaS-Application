// import OpenAI from 'openai';
// import sql from '../configs/db.js';
// import { clerkClient } from '@clerk/express';
// import axios from 'axios';
// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';
// import { CanvasFactory } from 'pdf-parse/worker';
// import { PDFParse } from 'pdf-parse';

// const AI = new OpenAI({
//   apiKey: process.env.GEMINI_API_KEY,
//   baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
// });

// export const generateArticle = async (req, res) => {
//   console.log('generateArticle controller reached');

//   try {
//     const { userId } = req.auth();
//     const { prompt, length } = req.body;

//     const plan = req.plan;
//     const free_usage = Number(req.free_usage ?? 0);

//     // Validate prompt
//     if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide a valid prompt.',
//       });
//     }

//     // Validate article length
//     const articleLength = Number(length ?? 500);

//     if (
//       !Number.isInteger(articleLength) ||
//       articleLength < 100 ||
//       articleLength > 3000
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'Length must be between 100 and 3000 words.',
//       });
//     }

//     // Check free plan limit
//     if (plan !== 'premium' && free_usage >= 10) {
//       return res.status(403).json({
//         success: false,
//         message: 'Limit reached. Upgrade to continue.',
//       });
//     }

//     // Generate article using Gemini
//     console.log('Starting Gemini request');

//     const response = await AI.chat.completions.create({
//       model: 'gemini-3.8-flash',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are a professional article writer. Write clear, engaging, well-structured articles with an appropriate title and headings. Aim for the requested word count.',
//         },
//         {
//           role: 'user',
//           content: `Write an article of approximately ${articleLength} words about: ${prompt.trim()}`,
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: Math.min(articleLength * 2, 8192),
//     });

//     console.log('Gemini response received');

//     const article = response.choices[0]?.message?.content;

//     if (!article || !article.trim()) {
//       return res.status(502).json({
//         success: false,
//         message: 'The AI did not return an article. Please try again.',
//       });
//     }

//     console.log('Saving article to database');

//     // Save article to Neon PostgreSQL
//     await sql`
//       INSERT INTO creations (user_id, prompt, content, type)
//       VALUES (${userId}, ${prompt.trim()}, ${article}, 'article')
//     `;

//     console.log('Article saved successfully');

//     // Increment free usage
//     if (plan !== 'premium') {
//       console.log('Updating Clerk usage');

//       await clerkClient.users.updateUserMetadata(userId, {
//         privateMetadata: {
//           free_usage: free_usage + 1,
//         },
//       });

//       console.log('Clerk usage updated successfully');
//     }

//     // Return article to frontend
//     return res.status(200).json({
//       success: true,
//       content: article,
//       userId,
//     });
//   } catch (error) {
//     console.error('Article generation error:', error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to generate article.',
//     });
//   }
// };

// export const generateBlogTitle = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const { prompt } = req.body;

//     const plan = req.plan;
//     const free_usage = Number(req.free_usage ?? 0);

//     // Validate prompt
//     if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide a valid prompt.',
//       });
//     }

//     // Check free plan limit
//     if (plan !== 'premium' && free_usage >= 10) {
//       return res.status(403).json({
//         success: false,
//         message: 'Limit reached. Upgrade to continue.',
//       });
//     }

//     // Generate blog titles using Gemini
//     const response = await AI.chat.completions.create({
//       model: 'gemini-3.8-flash',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'Generate 5 creative, engaging blog titles for the given topic. Return only the titles as a numbered list.',
//         },
//         {
//           role: 'user',
//           content: prompt.trim(),
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: 300,
//     });

//     const content = response.choices[0]?.message?.content;

//     if (!content) {
//       return res.status(502).json({
//         success: false,
//         message: 'The AI did not return any blog titles.',
//       });
//     }

//     // Save generated titles to Neon PostgreSQL
//     await sql`
//       INSERT INTO creations (user_id, prompt, content, type)
//       VALUES (${userId}, ${prompt.trim()}, ${content}, 'blog-title')
//     `;

//     // Increment free usage
//     if (plan !== 'premium') {
//       await clerkClient.users.updateUserMetadata(userId, {
//         privateMetadata: {
//           free_usage: free_usage + 1,
//         },
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       content,
//       userId,
//     });
//   } catch (error) {
//     console.error('Blog title generation error:', error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to generate blog titles.',
//     });
//   }
// };

// export const removeImageBackground = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const image = req.file;
//     const plan = req.plan;

//     // Validate image
//     if (!image) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload an image.',
//       });
//     }

//     // Check premium plan
//     if (plan !== 'premium') {
//       return res.status(403).json({
//         success: false,
//         message: 'This feature is only available for premium subscriptions.',
//       });
//     }

//     // Remove image background using Cloudinary
//     const { secure_url } = await cloudinary.v2.uploader.upload(image.path, {
//       transformation: [
//         {
//           effect: 'background_removal',
//           background_removal: 'remove_the_background',
//         },
//       ],
//     });

//     if (!secure_url) {
//       return res.status(502).json({
//         success: false,
//         message: 'Failed to remove the image background.',
//       });
//     }

//     // Save result to Neon PostgreSQL
//     await sql`
//       INSERT INTO creations (user_id, prompt, content, type)
//       VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
//     `;

//     return res.status(200).json({
//       success: true,
//       content: secure_url,
//     });
//   } catch (error) {
//     console.error('Remove image background error:', error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to remove image background.',
//     });
//   }
// };

// export const generateImage = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const { prompt, publish } = req.body;
//     const plan = req.plan;

//     // Validate prompt
//     if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide a valid prompt.',
//       });
//     }

//     // Check premium plan
//     if (plan !== 'premium') {
//       return res.status(403).json({
//         success: false,
//         message: 'This feature is only available for premium subscriptions.',
//       });
//     }

//     // Generate image using Clipdrop
//     const formData = new FormData();
//     formData.append('prompt', prompt.trim());
//       console.log('Sending request to Clipdrop')
//     const { data } = await axios.post(
//       'https://clipdrop-api.co/text-to-image/v1',
//       formData,
//       {
//         headers: {
//           'x-api-key': process.env.CLIPDROP_API,
//           ...formData.getHeaders?.(),
//         },
//         responseType: 'arraybuffer',
//       }
//     );
//     console.log('Clipdrop image generated successfully')
//     const base64Image = `data:image/png;base64,${Buffer.from(data).toString('base64')}`;
//     console.log('Uploading image to Cloudinary')
   
// console.log('Uploading image to Cloudinary');

// const { secure_url } = await cloudinary.uploader.upload(base64Image, {
//   resource_type: 'image',
//   timeout: 120000,
// });

// console.log('Cloudinary upload completed');

// if (!secure_url) {
//   return res.status(502).json({
//     success: false,
//     message: 'Image upload failed. Please try again.',
//   });
// }

//     // Save generated image to Neon PostgreSQL
//     await sql`
//       INSERT INTO creations (user_id, prompt, content, type, publish)
//       VALUES (${userId}, ${prompt.trim()}, ${secure_url}, 'image', ${publish ?? false})
//     `;

//     return res.status(200).json({
//       success: true,
//       content: secure_url,
//     });
//   } catch (error) {

//     console.error('Image generation error:', error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to generate image.',
//     });

    
//   }
// };

// export const removeImageObject = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const { object } = req.body;
//     const image = req.file;
//     const plan = req.plan;

//     // Validate image
//     if (!image) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload an image.',
//       });
//     }

//     // Check premium plan
//     if (plan !== 'premium') {
//       return res.status(403).json({
//         success: false,
//         message: 'This feature is only available for premium subscriptions.',
//       });
//     }

//     // Remove image object using Cloudinary
//     const { public_id } = await cloudinary.v2.uploader.upload(image.path);

//     if (!public_id) {
//       return res.status(502).json({
//         success: false,
//         message: 'Failed to remove the image object.',
//       });
//     }

//     const imageUrl = cloudinary.url(public_id, {
//       transformation: [{ effect: `gen_remove:${object}` }],
//       resource_type: 'image',
//     });

//     // Save result to Neon PostgreSQL
//     await sql`
//       INSERT INTO creations (user_id, prompt, content, type)
//       VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')
//     `;

//     return res.status(200).json({
//       success: true,
//       content: imageUrl,
//     });
//   } catch (error) {
//     console.error('Remove image object error:', error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to remove image object.',
//     });
//   }
// };

// export const resumeReview = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const resume = req.file;
//     const plan = req.plan;

//     // Validate resume
//     if (!resume) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload a resume.',
//       });
//     }

//     // Check premium plan
//     if (plan !== 'premium') {
//       return res.status(403).json({
//         success: false,
//         message: 'This feature is only available for premium subscriptions.',
//       });
//     }

//     // Check resume file size
//     if (resume.size > 5 * 1024 * 1024) {
//       return res.status(400).json({
//         success: false,
//         message: 'Resume file size exceeds allowed size (5MB).',
//       });
//     }

//     const dataBuffer = fs.readFileSync(resume.path);

//     const parser = new PDFParse({
//       data: dataBuffer,
//       CanvasFactory,
//     });

//     let pdfData;

//     try {
//       pdfData = await parser.getText();
//     } finally {
//       await parser.destroy();
//     }

//     if (!pdfData || !pdfData.text.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Could not extract text from the uploaded resume.',
//       });
//     }

//     const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`;

//     const response = await AI.chat.completions.create({
//       model: 'gemini-3.8-flash',
//       messages: [
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: 4000,
//     });

//     const content = response.choices[0]?.message?.content;

//     if (!content) {
//       return res.status(502).json({
//         success: false,
//         message: 'The AI did not return resume feedback.',
//       });
//     }

//     // Save result to Neon PostgreSQL
//     await sql`
//       INSERT INTO creations (user_id, prompt, content, type)
//       VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
//     `;

//     return res.status(200).json({
//       success: true,
//       content,
//     });
//   } catch (error) {
//     console.error('Resume review error:', error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to review resume.',
//     });
//   }
// };

import OpenAI from 'openai';
import sql from '../configs/db.js';
import { clerkClient } from '@clerk/express';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import FormData from 'form-data';
const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const AI_MODEL = 'gemini-3.8-flash';

// Generate Article
export const generateArticle = async (req, res) => {
  console.log('generateArticle controller reached');

  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;

    const plan = req.plan;
    const free_usage = Number(req.free_usage ?? 0);

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid prompt.',
      });
    }

    // Validate article length
    const articleLength = Number(length ?? 500);

    if (
      !Number.isInteger(articleLength) ||
      articleLength < 100 ||
      articleLength > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Length must be between 100 and 3000 words.',
      });
    }

    // Check free plan limit
    if (plan !== 'premium' && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Limit reached. Upgrade to continue.',
      });
    }

    // Generate article using Gemini
    console.log('Starting Gemini request');

    const response = await AI.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional article writer. Write clear, engaging, well-structured articles with an appropriate title and headings. Aim for the requested word count.',
        },
        {
          role: 'user',
          content: `Write an article of approximately ${articleLength} words about: ${prompt.trim()}`,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(articleLength * 2, 8192),
    });

    console.log('Gemini response received');

    const article = response.choices[0]?.message?.content;

    if (!article || !article.trim()) {
      return res.status(502).json({
        success: false,
        message: 'The AI did not return an article. Please try again.',
      });
    }

    // Save article to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt.trim()}, ${article}, 'article')
    `;

    console.log('Article saved successfully');

    // Increment free usage
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    // Return article to frontend
    return res.status(200).json({
      success: true,
      content: article,
      userId,
    });
  } catch (error) {
    console.error('Article generation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate article.',
    });
  }
};

// Generate Blog Title
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;

    const plan = req.plan;
    const free_usage = Number(req.free_usage ?? 0);

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid prompt.',
      });
    }

    // Check free plan limit
    if (plan !== 'premium' && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Limit reached. Upgrade to continue.',
      });
    }

    // Generate blog titles using Gemini
    const response = await AI.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Generate 5 creative, engaging blog titles for the given topic. Return only the titles as a numbered list.',
        },
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;

    if (!content || !content.trim()) {
      return res.status(502).json({
        success: false,
        message: 'The AI did not return any blog titles.',
      });
    }

    // Save generated titles to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt.trim()}, ${content}, 'blog-title')
    `;

    // Increment free usage
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    return res.status(200).json({
      success: true,
      content,
      userId,
    });
  } catch (error) {
    console.error('Blog title generation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate blog titles.',
    });
  }
};

// Remove Image Background
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    // Validate image
    if (!image || !image.path) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image.',
      });
    }

    // Check premium plan
    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'This feature is only available for premium subscriptions.',
      });
    }

    // Upload image to Cloudinary
    const { public_id } = await cloudinary.uploader.upload(image.path, {
      resource_type: 'image',
      timeout: 120000,
    });

    if (!public_id) {
      return res.status(502).json({
        success: false,
        message: 'Failed to upload the image.',
      });
    }

    // Remove image background using Cloudinary
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: 'background_removal' }],
      resource_type: 'image',
      secure: true,
    });

    // Save result to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from image', ${imageUrl}, 'image')
    `;

    return res.status(200).json({
      success: true,
      content: imageUrl,
    });
  } catch (error) {
    console.error('Remove image background error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to remove image background.',
    });
  }
};

// Generate Image

export const generateImage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { prompt, publish } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

        // Check user's plan
        const plan = req.plan;

        if (plan !== 'premium') {
            const freeUsage = await sql`
                SELECT free_usage
                FROM users
                WHERE clerk_id = ${userId}
            `;

            if (!freeUsage.length || freeUsage[0].free_usage >= 10) {
                return res.status(403).json({
                    success: false,
                    message: 'Free usage limit reached. Upgrade to premium to continue.'
                });
            }
        }

        // Generate image using Clipdrop
        console.log('Sending request to Clipdrop');

        const formData = new FormData();
        formData.append('prompt', prompt);

        const response = await axios.post(
            'https://clipdrop-api.co/text-to-image/v1',
            formData,
            {
                headers: {
                    'x-api-key': process.env.CLIPDROP_API,
                    ...formData.getHeaders()
                },
                responseType: 'arraybuffer',
                timeout: 120000
            }
        );

     console.log('Clipdrop image generated successfully');
console.log('Response content-type:', response.headers['content-type']);
console.log('Response data size:', Buffer.from(response.data).length);
console.log('Response data first bytes:', Buffer.from(response.data).subarray(0, 16).toString('hex'));

        // Convert generated image to Base64
        const base64Image = `data:${response.headers['content-type'] || 'image/png'};base64,${Buffer.from(response.data).toString('base64')}`;

        // Upload image to Cloudinary
        console.log('Uploading image to Cloudinary');

        let uploadResult;

        try {
            uploadResult = await cloudinary.uploader.upload(base64Image, {
                resource_type: 'image',
                timeout: 120000
            });
        } catch (error) {
            console.error('Cloudinary upload details:', {
                message: error.message,
                http_code: error.http_code,
                name: error.name,
                error: error.error,
                request_id: error.request_id
            });

            return res.status(error.http_code || 500).json({
                success: false,
                message: 'Image generated, but Cloudinary upload failed.',
                error: error.message,
                cloudinaryStatus: error.http_code || 500
            });
        }

        const { secure_url } = uploadResult;

        console.log('Cloudinary upload completed:', secure_url);

        // Save image URL in database
        const content = secure_url;

        await sql`
            INSERT INTO creations (user_id, prompt, content, type, publish)
            VALUES (
                ${userId},
                ${prompt},
                ${content},
                'image',
                ${publish ?? false}
            )
        `;

        // Update free usage
        if (plan !== 'premium') {
            await sql`
                UPDATE users
                SET free_usage = free_usage + 1
                WHERE clerk_id = ${userId}
            `;
        }

        return res.status(200).json({
            success: true,
            content
        });

    } catch (error) {
        console.error('Image generation error:', {
            message: error.message,
            status: error.response?.status,
            response: error.response?.data
                ? Buffer.from(error.response.data).toString('utf8').slice(0, 1000)
                : undefined,
            http_code: error.http_code
        });

        return res.status(error.response?.status || error.http_code || 500).json({
            success: false,
            message: error.response?.status === 401
                ? 'Invalid Clipdrop API key.'
                : error.response?.status === 429
                    ? 'Clipdrop API rate limit exceeded.'
                    : error.message || 'Image generation failed.'
        });
    }
};


// Remove Image Object
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    // Validate image
    if (!image || !image.path) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image.',
      });
    }

    // Validate object
    if (!object || typeof object !== 'string' || !object.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the object to remove.',
      });
    }

    // Check premium plan
    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'This feature is only available for premium subscriptions.',
      });
    }

    // Upload image to Cloudinary
    const { public_id } = await cloudinary.uploader.upload(image.path, {
      resource_type: 'image',
      timeout: 120000,
    });

    if (!public_id) {
      return res.status(502).json({
        success: false,
        message: 'Failed to upload the image.',
      });
    }

    // Remove image object using Cloudinary
    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:prompt_${object.trim()}`,
        },
      ],
      resource_type: 'image',
      secure: true,
    });

    // Save result to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object.trim()} from image`}, ${imageUrl}, 'image')
    `;

    return res.status(200).json({
      success: true,
      content: imageUrl,
    });
  } catch (error) {
    console.error('Remove image object error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to remove image object.',
    });
  }
};

// Resume Review
export const resumeReview = async (req, res) => {
  let parser;

  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    // Validate resume
    if (!resume || !resume.path) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume.',
      });
    }

    // Check premium plan
    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'This feature is only available for premium subscriptions.',
      });
    }

    // Check resume file size
    if (resume.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Resume file size exceeds allowed size (5MB).',
      });
    }

    // Validate PDF file
    if (resume.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF resume.',
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);

    parser = new PDFParse({
      data: dataBuffer,
    });

    const pdfData = await parser.getText();

    if (!pdfData?.text?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from the uploaded resume.',
      });
    }

    const prompt = `
      You are an experienced resume reviewer.
      Review this resume and provide:
      1. Overall assessment
      2. Strengths
      3. Weaknesses
      4. ATS compatibility improvements
      5. Technical skills and project improvements
      6. Formatting and wording suggestions
      7. Actionable recommendations

      Be specific and constructive.

      Resume Content:
      ${pdfData.text}
    `;

    const response = await AI.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content || !content.trim()) {
      return res.status(502).json({
        success: false,
        message: 'The AI did not return resume feedback.',
      });
    }

    // Save result to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
    `;

    return res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    console.error('Resume review error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to review resume.',
    });
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.error('PDF parser cleanup error:', error);
      }
    }

    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch((error) => {
        if (error.code !== 'ENOENT') {
          console.error('Temporary resume cleanup error:', error);
        }
      });
    }
  }
};