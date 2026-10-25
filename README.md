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

Mangalore Bus Routes is a route finder for Mangalore city. It searches the local bus network and suggests direct journeys or transfer-based itineraries using a graph traversal algorithm.

The application is designed for practical day-to-day use: route data is stored in a readable CSV file, results show the buses and stops needed for a journey, and the community can suggest corrections through GitHub-backed pull requests.

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
- npm installed

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

3. **Configure GitHub-backed corrections (optional)**

   Copy `.env.example` to `.env.local` and fill in the GitHub token and repository settings if you want the correction form to open pull requests automatically. The token needs Contents (read/write) and Pull Requests (read/write) access for the target repository.

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:9002`

The GitHub configuration is only needed for submitting route corrections. Browsing routes and searching for journeys works without these variables.

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

This project is a bus route finder and journey planner for Mangalore city. It is built around the real bus route data in [public/data/bus-data.csv](public/data/bus-data.csv), which the app loads and parses on the server to power route search, route browsing, and correction workflows.

The main experience is the home page route finder: you enter a source stop and a destination stop, and the app searches the route network for direct trips or journeys with transfers using a deterministic graph traversal algorithm. The results are then presented with the exact buses, stops, and transfer points so a user can actually follow the trip.

Beyond route search, the project includes a full browse-and-manage flow:

- The [All Routes](src/app/routes/page.tsx) page lets you search the complete route list by bus number, description, or stop name.
- The [Saved Journeys](src/app/saved/page.tsx) page stores favorite routes in the browser so they can be reopened later on the same device.
- The [Settings](src/app/settings/page.tsx) page handles theme switching and route feedback.
- The correction form submits proposed CSV updates through a GitHub-backed pull request flow, so route data can be edited, added, or removed without changing the app manually.

This was built as part of my **Google Developer Groups (GDG) Lead application** to show a practical product, not a demo shell: a real data source, a local routing engine, responsive UI, saved state, and a contribution path for keeping the route database current.

### Route data and corrections

The route network is maintained in [public/data/bus-data.csv](public/data/bus-data.csv). Each row contains a bus identifier, its description, and the stops served by that route. Changes to this file should preserve the existing CSV structure so the parser and route finder can continue to load it correctly.

For smaller corrections, use the form on the Settings page. When GitHub integration is configured, the form creates a branch and pull request containing the proposed CSV change. Review the generated diff and confirm the route details before merging it.

## 🤝 Contributing

Contributions are welcome! Please open an issue first for major changes so the approach can be discussed before implementation. For route-data updates, include the affected bus number, stops, and the source or reason for the correction in the pull request description.

1. Fork the project and create a feature branch (`git checkout -b feature/AmazingFeature`).
2. Install dependencies with `npm install`.
3. Make the change and run `npm run typecheck` and `npm run lint`.
4. Commit your changes with a descriptive message.
5. Push the branch (`git push origin feature/AmazingFeature`) and open a pull request.

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
