
import OpenAI from 'openai';
import sql from '../configs/db.js';
import { clerkClient } from '@clerk/express';
import axios from 'axios';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { CanvasFactory } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export const generateArticle = async (req, res) => {
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

    if (!Number.isInteger(articleLength) ||
        articleLength < 100 ||
        articleLength > 3000) {
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
    const response = await AI.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional article writer. Write clear, engaging, well-structured articles with an appropriate title and headings.',
        },
        {
          role: 'user',
          content: `Write an article of approximately ${articleLength} words about: ${prompt.trim()}`,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(articleLength * 2, 8192),
    });

    const article = response.choices[0]?.message?.content;

    if (!article) {
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
      article,
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


export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;

    const plan = req.plan;
    const free_usage = Number(req.free_usage ?? 0);

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid prompt.",
      });
    }

    // Check free plan limit
    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    // Generate blog titles using Gemini
    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Generate 5 creative, engaging blog titles for the given topic. Return only the titles as a numbered list.",
        },
        {
          role: "user",
          content: prompt.trim(),
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        success: false,
        message: "The AI did not return any blog titles.",
      });
    }

    // Save generated titles to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt.trim()}, ${content}, 'blog-title')
    `;

    // Increment free usage
    if (plan !== "premium") {
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
    console.error("Blog title generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate blog titles.",
    });
  }
};


export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;

    const plan = req.plan;

    // Validate image
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // Check premium plan
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    // Remove image background using Cloudinary
    const { secure_url } = await cloudinary.v2.uploader.upload(image.path, {
      transformation: [
        {
          effect: 'background_removal',
          background_removal: 'remove_the_background',
        },
      ],
    });

    if (!secure_url) {
      return res.status(502).json({
        success: false,
        message: "Failed to remove the image background.",
      });
    }

    // Save result to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
    `;

    return res.status(200).json({
      success: true,
      content: secure_url,
    });
  } catch (error) {
    console.error('Remove image background error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to remove image background.',
    });
  }
};


export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;

    const plan = req.plan;

    // Validate prompt
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid prompt.",
      });
    }

    // Check premium plan
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    // Generate image using Clipdrop
    const formData = new FormData();
    formData.append('prompt', prompt.trim());

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          'x-api-key': process.env.CLIPDROP_API,
          ...formData.getHeaders?.(),
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data).toString('base64')}`;

    const { secure_url } = await cloudinary.v2.uploader.upload(base64Image);

    if (!secure_url) {
      return res.status(502).json({
        success: false,
        message: "The image could not be generated.",
      });
    }

    // Save generated image to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt.trim()}, ${secure_url}, 'image', ${publish ?? false})
    `;

    return res.status(200).json({
      success: true,
      content: secure_url,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate image.",
    });
  }
};


export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;

    const plan = req.plan;

    // Validate image
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // Check premium plan
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    // Remove image object using Cloudinary
    const { public_id } = await cloudinary.v2.uploader.upload(image.path);

    if (!public_id) {
      return res.status(502).json({
        success: false,
        message: "Failed to remove the image object.",
      });
    }

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: 'image',
    });

    // Save result to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')
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


export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();

    const resume = req.file;

    const plan = req.plan;

    // Validate resume
    if (!resume) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume.",
      });
    }

    // Check premium plan
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    // Check resume file size
    if (resume.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);

    const parser = new PDFParse({
      data: dataBuffer,
      CanvasFactory,
    });

    let pdfData;

    try {
      pdfData = await parser.getText();
    } finally {
      await parser.destroy();
    }

    if (!pdfData || !pdfData.text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from the uploaded resume.",
      });
    }

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`;

    const response = await AI.chat.completions.create({
      model: 'gemini-2.5-flash',
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

    if (!content) {
      return res.status(502).json({
        success: false,
        message: "The AI did not return resume feedback.",
      });
    }

    // Save result to Neon PostgreSQL
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
    `;

    return res.status(200).json({
      success: true,
      content: content,
    });
  } catch (error) {
    console.error('Resume review error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to review resume.',
    });
  }
};
