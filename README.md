# Pixora

Pixora is a social photo marketplace app. Users can create posts, like, comment, reply, message each other, receive notifications, save posts, and sell downloadable images through a store workflow.

The store currently supports demo card payments and manual receipt approval. It is ready as a prototype/demo marketplace, but it does not yet include a real payment gateway.

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Cloud_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image_Uploads-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)

## Portfolio Project

This project is intended as a portfolio/demo project to show full-stack development skills. Payment features are simulated for demonstration purposes. A real payment gateway and production security review would be required before real users or real transactions.

See [PORTFOLIO.md](./PORTFOLIO.md) for the project summary, screenshot checklist, and demo video script.

## Screenshots

### Login

![Login](portfolio-assets/screenshots/01-login.png)

### Register

![Register](portfolio-assets/screenshots/02-register.png)

### Feed

![Feed](portfolio-assets/screenshots/03.1-feed.png)

![Feed post detail](portfolio-assets/screenshots/03.2-feed.png)

![Feed comments](portfolio-assets/screenshots/03.3-feed.png)

### Create Post

![Create post](portfolio-assets/screenshots/04-create-post.png)

### Profile

![Profile](portfolio-assets/screenshots/05-profile.png)

### Search

![Search](portfolio-assets/screenshots/06-search.png)

### Messages

![Messages](portfolio-assets/screenshots/07-messages.png)

### Notifications

![Notifications](portfolio-assets/screenshots/08-notifications.png)

### Store

![Store](portfolio-assets/screenshots/09.1-store.png)

![Store item](portfolio-assets/screenshots/09.2-store.png)

### Purchases

![Purchases](portfolio-assets/screenshots/10-purchases.png)

### Orders

![Orders](portfolio-assets/screenshots/11-orders.png)

### Admin

![Admin](portfolio-assets/screenshots/12-admin.png)

## Features

- User register and login with JWT authentication
- Profile pages with editable profile details
- Feed posts with text and image uploads
- Likes, comments, replies, post detail pages, and saved posts
- User search by name or username
- Direct messaging with live updates
- Notifications with unseen count
- Store marketplace for downloadable images
- Store categories and hashtag search
- Store item detail pages
- Manual receipt payment flow with seller approval
- Demo card payment flow for prototype testing
- Buyer purchases page
- Seller orders summary
- Download tracking for paid/approved images
- Admin dashboard foundation with protected admin-only access
- Pixora Midnight Teal UI theme

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, Prisma
- Database: Supabase PostgreSQL
- Image uploads: Cloudinary
- Auth: JWT access token and refresh token cookie

## Folder Structure

```text
apps/
  api/
    prisma/
    scripts/
    src/
      config/
      db/
      middleware/
      modules/
  web/
    app/
    components/
    lib/
```

## Environment Variables

Backend file:

```text
apps/api/.env
```

Use:

```env
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
CLIENT_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Frontend file:

```text
apps/web/.env.local
```

Use:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Local Setup

Install backend dependencies:

```bash
cd apps/api
npm install
```

Install frontend dependencies:

```bash
cd apps/web
npm install
```

Generate Prisma Client:

```bash
cd apps/api
npx prisma generate
```

Run backend:

```bat
cd "apps\api"
set NODE_TLS_REJECT_UNAUTHORIZED=0&&npm run dev
```

Run frontend:

```bash
cd apps/web
npm run dev
```

Open:

```text
http://localhost:3000
```

## Admin Account

First register a normal user in the app. Then promote that existing user by email:

```bash
cd apps/api
node scripts/make-admin.mjs user@example.com
```

After that, logout and login again. The `Admin` link will appear in the navbar.

## Demo Payment Note

Pixora currently includes:

- Demo card payment
- Manual receipt upload
- Seller approval/rejection
- Download unlock after paid or approved status

It does not yet include a real payment gateway, card processor, seller payout system, or automatic bank verification.

Before production marketplace use, connect a real payment provider such as PayHere, Stripe, or another supported gateway and verify payments server-side.

## Deployment Plan

Recommended prototype deployment:

- Frontend: Vercel
- Backend: Render, Railway, or Fly.io
- Database: Supabase
- Images: Cloudinary

Deployment reminders:

- Set `NEXT_PUBLIC_API_URL` in frontend hosting.
- Set `CLIENT_ORIGIN` in backend hosting to the deployed frontend URL.
- Use strong production JWT secrets.
- Never commit `.env` files.
- Keep Supabase and Cloudinary secrets only in hosting environment variables.

## Future Improvements

- Connect a real payment gateway such as Stripe or PayHere for live card payments.
- Add email verification and password reset.
- Add production-ready image moderation for uploaded content.
- Improve real-time messaging with WebSockets.
- Add advanced admin analytics and reporting.
- Deploy the frontend, backend, and database for a public live demo.
- Add automated tests for backend APIs and frontend user flows.

## Useful Commands

Frontend lint:

```bash
cd apps/web
npm run lint
```

Frontend production build:

```bash
cd apps/web
npm run build
```

Backend TypeScript check:

```bash
cd apps/api
npx tsc --noEmit
```
