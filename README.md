# JobZAI - AI-Powered Job Application & Interview Preparation Platform

JobZAI is a comprehensive web application designed to help job seekers streamline their job application process and prepare for interviews using advanced AI technologies. The platform integrates with OpenAI and Anthropic's Claude AI to provide personalized assistance throughout the job search journey.

![JobZAI Platform](https://via.placeholder.com/1200x600?text=JobZAI+Platform)

## 🌟 Features

### CV Analysis
- AI-powered resume/CV analysis
- Skills and experience extraction
- Personalized improvement suggestions

### Job Application Management
- Track and organize job applications
- Email campaign creation and management
- Customizable email templates

### Interview Preparation
- AI-driven mock interviews
- Industry-specific question preparation
- Real-time feedback and performance analysis
- Calendar integration for interview scheduling

### Smart Matching
- Match your profile with job opportunities
- Identify skill gaps for desired positions
- Personalized job recommendations

### Professional Profile
- Create and maintain a comprehensive professional profile
- Track career progress and achievements
- Customize privacy settings

## 🚀 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router v6
- TanStack Query (React Query)
- Tailwind CSS
- Framer Motion (animations)
- React Hook Form (form handling)

### Backend
- Express.js
- Firebase (Authentication, Firestore, Storage)
- Anthropic Claude AI integration
- OpenAI integration
- Mailgun (email service)

### Development Tools
- ESLint
- TypeScript
- Concurrently (running frontend and backend)

## 📋 Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase account
- Anthropic Claude API key
- OpenAI API key (optional for some features)
- Mailgun account (for email features)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/CodeOfYukicks/jobzai-1.git
cd jobzai-1
```

2. Install dependencies:
```bash
npm install
```

3. Create environment files:

Create a `.env` file in the root directory with the following variables:
```
# Variables d'environnement essentielles
ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
NODE_ENV=development
```

For development, you can create a `.env.development` file:
```
# Configuration pour l'environnement de développement
ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=development
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
MAILGUN_DOMAIN=your_mailgun_domain
```

## 🚀 Running the Application

### Development Mode

To run the frontend and backend concurrently:
```bash
npm run dev:with-server
```

To run only the frontend:
```bash
npm run dev
```

To run only the backend:
```bash
npm run server
```

### Production Mode

For Unix/Linux:
```bash
npm run build
npm run start
```

For Windows:
```bash
npm run build
npm run start:win
```

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for various platforms including:

- Firebase Hosting
- Vercel
- Netlify
- Self-hosted with Nginx

## 📁 Project Structure

```
jobzai/
├── public/             # Static assets
├── src/                # Source code
│   ├── api/            # API utilities
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Library code
│   ├── pages/          # Application pages
│   ├── services/       # Service layer for API calls
│   ├── styles/         # CSS and styling
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Entry point
├── functions/          # Firebase Cloud Functions
├── server.cjs          # Express server for API proxying
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 📚 Key Pages

- `/` - Home page
- `/login` and `/signup` - Authentication
- `/dashboard` - User dashboard
- `/cv-analysis` - CV analysis and improvement
- `/interview-prep/:applicationId/:interviewId` - Interview preparation
- `/applications` - Job application tracking
- `/campaigns` - Email campaign management
- `/email-templates` - Email template management
- `/upcoming-interviews` - Upcoming interviews calendar
- `/professional-profile` - User profile management
- `/settings` - Application settings

## 🔒 Authentication

The application uses Firebase Authentication with the following methods:
- Email/Password
- Google Sign-In

## 🛠 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support, contact support@jobzai.com or open an issue on the GitHub repository.

---

Created with ❤️ by the JobZAI team.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/CodeOfYuki/jobzai)