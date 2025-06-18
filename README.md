# Mini Flight Ops - Part 135 Charter Scheduling Dashboard

A modern, lightweight web application for Part 135 charter operators to manage flight schedules, aircraft availability, and pilot assignments. Built with Next.js 14, React, TypeScript, Tailwind CSS, and Supabase.

![Demo](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=Mini+Flight+Ops+Dashboard)

## ✈️ Features

### Core Features
- **Flight Scheduling**: Create, view, and manage flight schedules with real-time conflict detection
- **Aircraft Management**: Track aircraft availability and utilization
- **Pilot Authentication**: Secure pilot accounts with role-based access
- **Crew Assignment**: Assign captains and first officers to flights
- **Professional Profiles**: Manage pilot credentials, licenses, and flight hours
- **Conflict Prevention**: Automatic detection of scheduling conflicts for aircraft and crew
- **Responsive Design**: Beautiful, modern UI that works on desktop and mobile

### Authentication & User Management
- **Secure Registration/Login**: Email-based authentication with Supabase Auth
- **Pilot Profiles**: Complete professional information management
- **Role-based Access**: Support for pilots, captains, first officers, dispatchers, and admins
- **License Tracking**: Monitor medical certificates and flight review expiry dates
- **Flight Hours Logging**: Track total, PIC, and instrument hours

### Enhanced Flight Operations
- **Crew Scheduling**: Assign and track pilot assignments
- **Flight Types**: Support for charter, positioning, training, and maintenance flights
- **Passenger Tracking**: Monitor passenger counts and aircraft capacity
- **Professional Interface**: Clean, aviation-focused design with proper terminology

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17 or later
- A Supabase account and project
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd mini-flight-ops
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Click "Run" to execute the schema

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the schema
supabase db push
```

### 4. Run the Application
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

The application uses a comprehensive database schema designed for aviation operations:

### Core Tables
- **pilot_profiles**: Extended user profiles with aviation credentials
- **aircraft**: Aircraft fleet management
- **flights**: Flight scheduling with crew assignments
- **flight_crew**: Additional crew member assignments

### Key Features of the Schema
- **Row Level Security (RLS)**: Proper data isolation and access control
- **Foreign Key Constraints**: Data integrity and referential consistency
- **Automatic Triggers**: Profile creation on user signup
- **Performance Indexes**: Optimized queries for flight operations
- **Validation Constraints**: Business rule enforcement

## 🔐 Authentication & Security

### User Roles
- **Pilot**: Basic flight operations access
- **Captain**: Flight command responsibilities
- **First Officer**: Second-in-command duties
- **Dispatcher**: Flight planning and coordination
- **Admin**: Full system administration

### Security Features
- **Supabase Auth**: Industry-standard authentication
- **Row Level Security**: Database-level access control
- **Role-based Permissions**: Graduated access levels
- **Session Management**: Secure token handling

## 🛠️ Development

### Project Structure
```
src/
├── app/                    # Next.js app router
├── components/            
│   ├── auth/              # Authentication components
│   ├── pilot/             # Pilot management
│   └── ui/                # Reusable UI components
├── contexts/              # React contexts (auth)
├── lib/                   # Utilities and configuration
├── services/              # API service layer
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

### Key Technologies
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **State Management**: React Context

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm test             # Run test suite
```

## 🧪 Testing

The application includes comprehensive tests for critical functions:

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

### Test Coverage
- Flight conflict detection algorithms
- Date/time formatting utilities
- Aircraft availability calculations
- Form validation logic

## 🚀 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## 📈 Features Roadmap

### Completed ✅
- Flight scheduling and conflict detection
- Aircraft availability tracking
- Authentication and pilot profiles
- Crew assignment functionality
- Professional UI with aviation theming
- Role-based access control

### Planned Features 🔄
- **Flight History & Analytics**: Historical flight data and utilization reports
- **Maintenance Tracking**: Aircraft maintenance schedules and compliance
- **Real-time Updates**: Live flight status updates via WebSocket
- **Mobile App**: React Native companion app
- **API Integration**: Weather data and flight planning APIs
- **Advanced Reporting**: Custom reports and data export
- **Multi-tenant Support**: Support for multiple operators
- **Integration APIs**: Third-party system integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure responsive design compliance
- Test with different user roles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:
1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed reproduction steps
3. Include environment details and error messages

## 🏆 Acknowledgments

- Built for aviation professionals who understand the importance of safety and precision
- Inspired by modern flight operations management needs
- Designed with feedback from active Part 135 operators

---

**Mini Flight Ops** - Bringing modern technology to aviation operations. ✈️
