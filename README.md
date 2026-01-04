# 🚌 Mangalore Bus Routes Finder

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-161618?style=for-the-badge&logo=radix-ui&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

</div>

An intelligent bus route finder for Mangalore city, designed to provide smart route suggestions and journey planning using advanced graph traversal algorithms.

## ✨ Features

- **⚡ Smart Route Finder** - Efficient algorithmic route finding to get you from A to B.
- **🗺️ Comprehensive Route Database** - Extensive coverage of Mangalore's bus network.
- **🔄 Multi-Transfer Support** - Intelligently calculates routes with necessary transfers.
- **💾 Save Journeys** - Save frequently used routes for quick access.
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices.
- **🚨 Issue Reporting** - Report problems with routes or bus services.
- **🎯 Real-time Suggestions** - Instant route recommendations processed locally.

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

### Form & Validation
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)

### Development Tools
![Turbopack](https://img.shields.io/badge/Turbopack-000000?style=flat-square&logo=vercel&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=flat-square&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black)

</div>

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Logic**: Custom Graph Traversal Algorithm for Route Finding (BFS)
- **State Management**: React Hook Form with Zod validation
- **Development**: Turbopack, ESLint

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mrkushalsm/Mangalore-Bus-Routes.git
   cd Mangalore-Bus-Routes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:9002`

## 📱 Usage

1. **Find Routes**: Enter your source and destination stops.
2. **View Suggestions**: The app will calculate direct routes or routes with transfers.
3. **Save Routes**: Bookmark frequently traveled paths.
4. **Report Issues**: Help improve the data by reporting inaccuracies.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── hooks/                  # Custom React hooks
├── lib/                   # Utilities, bus data (CSV parser), and route finder algorithm
public/
└── data/                  # Bus routes CSV data
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack (Port 9002)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

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

- **[R Ajay Kumar](https://github.com/Rajaykumar12) and [Manas S](https://github.com/Manas-salian)** - For their invaluable help in cleaning and organizing the initial bus routes data.
- **[Vivek](https://github.com/VivekNeer)** - For suggesting this project idea for the technical round of the GDG Lead application.
- **[Yash](https://github.com/JustModo)** - For providing insightful UI/UX feedback that significantly elevated the overall design and user experience.
- **Open Source Community** - For the excellent libraries and tools that made this project possible.

## 📞 Contact

Created by Kushal SM - mrkushalsm@gmail.com

Project Link: [https://github.com/mrkushalsm/Mangalore-Bus-Routes](https://github.com/mrkushalsm/Mangalore-Bus-Routes)

---

**Built with ❤️ for the Mangalore community and as part of my GDG Lead application journey**
