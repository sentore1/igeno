import Link from 'next/link';
import { Button } from '@/components/ui/button';

const services = [
  { title: 'Personal Care', description: 'Assistance with daily activities, bathing, grooming, and personal hygiene' },
  { title: 'Medical Care', description: 'Professional nursing care, medication management, and health monitoring' },
  { title: 'Companion Care', description: 'Social interaction, companionship, and emotional support' },
  { title: 'Respite Care', description: 'Temporary relief for family caregivers' },
  { title: 'Housekeeping', description: 'Light housekeeping, meal preparation, and household management' },
  { title: 'Transportation', description: 'Safe transportation to appointments and activities' },
];

const steps = [
  { num: '1', title: 'Register', desc: 'Create your account and profile' },
  { num: '2', title: 'Book Service', desc: 'Choose service and schedule' },
  { num: '3', title: 'Get Matched', desc: 'We assign a qualified caregiver' },
  { num: '4', title: 'Receive Care', desc: 'Quality care delivered' },
];

export default function CarePage() {
  return (
    <main>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="py-20 md:py-36">
          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
            <h1 className="mx-auto max-w-2xl text-balance text-4xl font-bold md:text-5xl">
              Care & Family Wellness
            </h1>
            <p className="text-muted-foreground mx-auto my-6 max-w-xl text-balance text-xl">
              Professional care services for your loved ones, delivered with compassion and expertise.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/care/booking" />} nativeButton={false}>
                Book a Service
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/dashboard" />} nativeButton={false}>
                View Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">Our Care Services</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-xl border p-5 transition-shadow hover:shadow-md">
                <h3 className="mb-1 font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/40 border-t border-b">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">How It Works</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="bg-primary text-primary-foreground mx-auto mb-3 flex size-10 items-center justify-center rounded-full font-bold">
                  {s.num}
                </div>
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">Ready to Get Started?</h2>
        <p className="text-muted-foreground my-4">Schedule your first care service today</p>
        <div className="flex justify-center gap-3">
          <Button size="lg" render={<Link href="/care/booking" />} nativeButton={false}>
            Book Now
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/dashboard" />} nativeButton={false}>
            View Dashboard
          </Button>
        </div>
      </section>
    </main>
  );
}
