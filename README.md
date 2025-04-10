# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c296ac8d-5976-4fd3-afae-c25721b57602

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c296ac8d-5976-4fd3-afae-c25721b57602) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c296ac8d-5976-4fd3-afae-c25721b57602) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Syndicate Mind Vault

A personal knowledge management system with AI capabilities.

## Waitlist System

The application now includes a waitlist system that restricts access to the main app while collecting email addresses from interested users.

### How it works:

1. All visitors are redirected to the `/waitlist` page
2. The waitlist page collects email addresses and stores them in Vercel KV
3. Authorized users can bypass the waitlist by setting a flag in localStorage
4. The system uses React Router for routing and Vercel KV for storing waitlist emails

### Setting up in Vercel:

1. Deploy your project to Vercel
2. Set up Vercel KV Database:
   - Go to Storage tab in your Vercel project
   - Create a new KV database
   - Vercel will automatically set the required environment variables

3. Configure environment variables:
   - The following will be set automatically by Vercel KV:
     - `VERCEL_KV_URL`
     - `VERCEL_KV_REST_API_TOKEN`
     - `VERCEL_KV_REST_API_URL`
     - `VERCEL_KV_REST_API_READ_ONLY_TOKEN`

4. Add an admin user (optional):
   - For testing or admin access, you can set `localStorage.setItem('syndicateAuth', 'true')` in your browser console
   - The waitlist page includes a "Bypass Waitlist" button in development mode

### Accessing collected emails:

To view the collected email addresses:

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to the Storage tab
4. Select your KV database
5. Look for keys with the pattern `waitlist:*`
6. Each key is in the format `waitlist:[timestamp]:[email]`

## Development

```
npm install
npm run dev
```

## Building

```
npm run build
```

## Deployment

```
npm run build
vercel deploy
```
