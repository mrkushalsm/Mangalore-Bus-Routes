# 🚌 Mangalore Bus Routes Finder

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)

![Google AI](https://img.shields.io/badge/Google_AI-Genkit-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-161618?style=for-the-badge&logo=radix-ui&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg?style=for-the-badge)](https://github.com/yourusername)

</div>

An intelligent bus route finder for Mangalore city, powered by AI to provide smart route suggestions and journey planning.

## ✨ Features

- **🤖 AI-Powered Route Suggestions** - Smart route finding using Google's Genkit AI
- **🗺️ Comprehensive Route Database** - Complete bus routes data for Mangalore
- **🔄 Multi-Transfer Support** - Find direct routes and routes with transfers
- **💾 Save Journeys** - Save frequently used routes for quick access
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices
- **🚨 Issue Reporting** - Report problems with routes or bus services
- **🎯 Real-time Suggestions** - Get instant route recommendations

## 🛠️ Tech Stack

<div align="center">

### Frontend Technologies
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

### UI & Design
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat-square&logo=radix-ui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-000000?style=flat-square&logo=lucide&logoColor=white)
![Embla Carousel](https://img.shields.io/badge/Embla_Carousel-FF6B6B?style=flat-square&logo=javascript&logoColor=white)

### AI & Backend
![Google AI](https://img.shields.io/badge/Google_AI-4285F4?style=flat-square&logo=google&logoColor=white)
![Genkit](https://img.shields.io/badge/Genkit-FF6F00?style=flat-square&logo=google&logoColor=white)

### Form & Validation
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)

### Development Tools
![Turbopack](https://img.shields.io/badge/Turbopack-000000?style=flat-square&logo=vercel&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=flat-square&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black)

</div>

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **AI/ML**: Google Genkit AI, Google AI
- **State Management**: React Hook Form with Zod validation
- **Development**: Turbopack, ESLint

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mangalore-bus-routes.git
   cd mangalore-bus-routes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Google AI API keys.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Start the AI development server** (in a separate terminal)
   ```bash
   npm run genkit:dev
   ```

The application will be available at `http://localhost:9002`

## 📱 Usage

## 🔑 API Key Setup

This project uses Google's Gemini API for its AI features. To enable this, you need to provide your API key.

1. Copy the `.env.example` file to `.env.local`: `cp .env.example .env.local`
2. Open `.env.local` and replace `YOUR_GOOGLE_AI_API_KEY` with your actual Gemini API key.

1. **Find Routes**: Enter your source and destination stops to get AI-powered route suggestions
2. **View Route Details**: See detailed information about each route segment including bus numbers and stops
3. **Save Routes**: Save frequently used routes for quick access later
4. **Report Issues**: Report problems with routes or suggest improvements

## 🧠 AI Features

The app uses Google's Genkit AI to:
- Analyze bus route data intelligently
- Find optimal routes including transfers
- Provide contextual journey suggestions
- Handle edge cases and route availability

## 📁 Project Structure

```
src/
├── ai/                     # AI flows and Genkit configuration
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── hooks/                  # Custom React hooks
└── lib/                   # Utilities and bus data
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit in watch mode

## 🌟 About This Project

This project was developed as part of my **Google Developer Groups (GDG) Lead application** to demonstrate:

- **Technical Leadership**: Building a complex full-stack application with modern technologies
- **Community Impact**: Solving real-world transportation challenges for Mangalore residents
- **Innovation**: Integrating AI/ML capabilities for intelligent route suggestions
- **User Experience**: Creating an intuitive, accessible interface for all users
- **Open Source Contribution**: Sharing knowledge and tools with the developer community

The project showcases my ability to lead technical initiatives, work with cutting-edge technologies, and create solutions that benefit the local community - key qualities for a GDG Lead role.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Google Genkit team for the amazing AI capabilities
- Mangalore transport authorities for route information
- Open source community for the excellent libraries and tools
- Google Developer Groups for inspiring community-driven development

## 📞 Contact

Created by Kushal SM - mrkushalsm@gmail.com

Project Link: [https://github.com/mrkushalsm/Mangalore-Bus-Routes](https://github.com/mrkushalsm/Mangalore-Bus-Routes)

---

**Built with ❤️ for the Mangalore community and as part of my GDG Lead application journey**
