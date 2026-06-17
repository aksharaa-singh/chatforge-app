# ChatForge

ChatForge is a full-stack AI chat app built with Next.js, TypeScript, Prisma, PostgreSQL, and NextAuth.

## What Works

- Signup
- Signin
- Logout
- Email verification
- Forgot password
- Reset password
- Protected chat page
- Create chats
- Rename chats
- Delete chats
- Save chat history
- Load older messages
- Choose model provider
- Send real AI messages through OpenRouter

## Start The App

Open PowerShell 1:

```powershell
cd $HOME\Documents\chatforge-app
npx.cmd prisma dev
```

Keep it open.

Open PowerShell 2:

```powershell
cd $HOME\Documents\chatforge-app
npm.cmd run dev
```

Open:

```txt
http://localhost:3000
```

## Important Files

- `prisma/schema.prisma` - database models
- `auth.ts` - authentication config
- `components/chat-app.tsx` - main ChatForge UI
- `lib/llm` - LLM provider abstraction
- `.env` - private secrets
- `.env.example` - example environment variables

## Environment Setup

ChatForge currently uses OpenRouter for real AI responses:

```env
OPENROUTER_API_KEY=""
```

The UI shows:

- OpenAI
- Claude
- DeepSeek

For beginner/local development, all three visible choices route through OpenRouter free models behind the scenes.

Optional direct-provider keys can be added later:

```env
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
DEEPSEEK_API_KEY=""
```

Google login needs:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Gmail email sending works without buying a domain:

```env
EMAIL_PROVIDER="gmail"
GMAIL_USER="yourgmail@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"
EMAIL_FROM="ChatForge <yourgmail@gmail.com>"
```

For Gmail, enable 2-Step Verification on the Gmail account and create an App
Password. Use that App Password as `GMAIL_APP_PASSWORD`, not your normal Gmail
password.

Resend can still be used later if you verify a domain:

```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY=""
EMAIL_FROM="ChatForge <noreply@yourdomain.com>"
```

Your local `.env` can contain real working keys for Google login, Gmail email,
and OpenRouter AI responses. The `.env.example` file intentionally keeps those
values blank.

Never share your `.env` file.

## Useful Commands

Run lint:

```powershell
npm.cmd run lint
```

Validate Prisma:

```powershell
npx.cmd prisma validate
```

Push schema changes to the local database:

```powershell
npx.cmd prisma db push
```

Generate Prisma Client:

```powershell
npx.cmd prisma generate
```
