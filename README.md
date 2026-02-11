# OvinTrack backend

Development stack :

-[TypeScript](https://www.typescriptlang.org) - Langage de programmation

-[Next.js](https://nextjs.org) - Framework de développement web

-[Node.js](https://nodejs.org) - Serveur de développement

-[Tailwind CSS](https://tailwindcss.com) - Framework CSS

-[Prisma](https://www.prisma.io) - ORM

-[NeonDB](https://neon.tech) - Base de données (PostgreSQL)

-[Vercel](https://vercel.com) - Platforme de déploiement

-[Auth.js](https://authjs.dev) ou simple gestion de session via cookies - Authentication

-[Resend](https://resend.com) - Envoi d'Email

-[Stripe](https://stripe.com) - Gestion des Paiements

-[Leaflet(JS)](https://leafletjs.com) - Carte

-[OpenStreetMap](https://www.openstreetmap.org) - Carte OpenStreetMap

-[Next-Intl](https://next-intl.dev/) - Gestion de la traduction

## Configuration

Un fichier `.env` est utilisé pour configurer les variables d'environnement.
Il doit contenir les variables suivantes :

-`DATABASE_URL="file:./data/dev.db"`
-`TRACCAR_BASE_URL="http://51.44.57.214:8082/"`

## Description

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
