# 🎮 Puzzle Place

A modern, mobile-responsive Deal or No Deal game platform built with React, TypeScript, and Supabase.

## ✨ Features

- 🎯 **Interactive Game Experience**: Play Deal or No Deal with customizable prize pools
- 👥 **User Authentication**: Secure sign-up and login system
- 🎪 **Event Management**: Create and manage multiple game events
- 🏆 **Leaderboard**: Track player history and achievements
- 📱 **Mobile Responsive**: Optimized for all screen sizes (mobile, tablet, desktop)
- 🎨 **Modern UI/UX**: Beautiful gradient design with smooth animations
- 🎊 **Celebration Effects**: Confetti animations for winners

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📱 Mobile Responsive Design

The application is fully responsive with:
- Adaptive layouts for mobile, tablet, and desktop
- Touch-optimized buttons and interactions
- Mobile-friendly navigation with hamburger menu
- Responsive grid systems for game cases
- Optimized typography and spacing for all screen sizes

## 🎨 Design System

### Theme Color
- Primary: `#E56353` (Coral Red)
- Gradient Background: `#FDF1EF` to `#F7D6D2`

### Key UI Improvements
- **Smooth Animations**: Fade-in, slide-up, and scale-in effects
- **Hover States**: Interactive feedback on all clickable elements
- **Loading States**: Spinner animations for better UX
- **Top 3 Highlighting**: Special styling for top leaderboard entries
- **Custom Scrollbar**: Styled scrollbar for desktop users

## 📂 Project Structure

```
src/
├── pages/              # Page components (separated views)
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── CreateEventPage.tsx
│   ├── GamePlayPage.tsx
│   └── index.ts
├── components/         # Reusable components
│   ├── AuthForm.tsx
│   ├── CongratsConfetti.tsx
│   ├── CreateEvent.tsx
│   ├── Dashboard.tsx
│   ├── GamePlay.tsx
│   └── Leaderboard.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities and configurations
│   ├── supabase.ts
│   └── money.ts
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## 🎮 How to Play

1. **Sign Up/Login**: Create an account or login
2. **Browse Events**: View available game events on the dashboard
3. **Create Event**: Set up a new game with custom prizes
4. **Play Game**:
   - Pick your case
   - Eliminate other cases one by one
   - Make the final decision: Keep or Switch
5. **Win Prizes**: See what you've won with celebration effects!
6. **View Leaderboard**: Check recent plays and top players

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create a .env file with your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev

# Build for production
npm run build
```

## 📊 Database Schema

The application uses Supabase with the following main tables:
- `profiles`: User profiles
- `game_events`: Game event configurations
- `prize_pool`: Prizes for each event
- `game_history`: Player game results

## 🎯 Key Improvements Made

### 1. **Page Separation**
- Split components into dedicated page files
- Better code organization and maintainability
- Easier navigation and routing

### 2. **Mobile Responsiveness**
- Responsive grid layouts (1-10 columns based on screen size)
- Mobile-optimized navigation with hamburger menu
- Touch-friendly button sizes
- Adaptive typography and spacing
- Flexible card layouts

### 3. **Enhanced UX/UI**
- Smooth animations and transitions
- Loading spinners for better feedback
- Empty state designs with helpful messages
- Top 3 leaderboard highlighting
- Improved button styles with shadows
- Better form layouts on mobile

### 4. **Performance Optimizations**
- Efficient component structure
- Optimized re-renders
- Lazy loading considerations
- Smooth scrolling behavior

## 🎨 Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm-lg)
- **Desktop**: > 1024px (lg+)

## 📝 License

MIT

## 👨‍💻 Development

Built with ❤️ using modern web technologies
