# 🚀 Vercel Deployment Guide

This project is optimized for high-performance deployment on Vercel. Follow these steps to get your **Design & Build** platform live.

## 1. Project Configuration in Vercel

When importing your repository into Vercel, use the following settings:

- **Framework Preset:** Vite
- **Root Directory:** `app`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## 2. Environment Variables

You **must** configure the following environment variables in the Vercel Dashboard (Settings > Environment Variables):

| Variable | Description | Source |
| :--- | :--- | :--- |
| `VITE_GEMINI_API_KEY` | Primary AI Key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `VITE_NANO_PANANA_API_KEY` | 3D Visualization Key | Use the same Gemini Key |
| `VITE_CLOUDCONVERT_API_KEY` | (Optional) DXF Conversion | [CloudConvert](https://cloudconvert.com/api/v2) |

## 3. Deployment Steps

1. Push your code to GitHub/GitLab/Bitbucket.
2. Connect the repository to Vercel.
3. Ensure the **Root Directory** is set to `app`.
4. Add the Environment Variables.
5. Deploy!

## 4. Troubleshooting

- **Routing Issues:** If you encounter 404 errors on page refresh, ensure the `app/vercel.json` file is present (it handles SPA rewrites).
- **Build Failures:** Ensure you are using Node.js 18+ (standard on Vercel).
- **Local Bridge:** Note that `local_bridge.py` and other root-level Python scripts are for local development/processing only and are not required for the web visualization.
