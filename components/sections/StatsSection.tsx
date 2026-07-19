const stats = [
  { value: '2,400+', label: 'Clients Served', description: 'Families supported across our care network' },
  { value: '98%', label: 'Satisfaction Rate', description: 'Based on post-service client feedback' },
  { value: '150+', label: 'Certified Caregivers', description: 'Trained and verified professionals' },
  { value: '40+', label: 'Training Courses', description: 'Covering care, compliance & leadership' },
];

export default function StatsSection() {
  return (
    <section className="bg-white py-20 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">By the numbers</p>
          <h2 className="text-4xl font-bold text-gray-900">Trusted by care professionals</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="text-5xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {s.value}
              </div>
              <div className="text-base font-semibold text-gray-800 mb-1">{s.label}</div>
              <div className="text-sm text-gray-500">{s.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
