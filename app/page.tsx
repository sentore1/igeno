import HeroSection from '@/components/sections/HeroSection';
import CoursesSection from '@/components/sections/CoursesSection';

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left side - Hero content */}
        <HeroSection />
        
        {/* Right side - Courses */}
        <div className="p-8 lg:p-12 lg:pt-24">
          <CoursesSection />
        </div>
      </div>
    </main>
  );
}
