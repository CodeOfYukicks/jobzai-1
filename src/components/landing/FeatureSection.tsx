import { motion } from 'framer-motion';
import { ArrowRight, Rocket, FileText, BarChart3, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

// Hero Feature Card Component
function HeroFeatureCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Content */}
        <div className="p-8 lg:p-12 flex flex-col">
          {/* Label + Badge */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-medium text-gray-500">AI Campaigns</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
              New
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            You set the target.<br />
            AI does the outreach.
          </h2>

          {/* CTA Button */}
          <Link
            to="/signup"
            className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors mb-8"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Feature List */}
          <div className="mt-auto space-y-0 divide-y divide-gray-100">
            <div className="py-4">
              <h4 className="font-semibold text-gray-900 mb-1">Hand off repetitive applications</h4>
              <p className="text-sm text-gray-500">What used to take days in minutes. Tell it your goal and watch it work.</p>
            </div>
            <div className="py-4">
              <h4 className="font-semibold text-gray-900 mb-1">Personalized at scale</h4>
              <p className="text-sm text-gray-500">Each application is tailored to the company and role.</p>
            </div>
            <div className="py-4">
              <h4 className="font-semibold text-gray-900 mb-1">Track everything</h4>
              <p className="text-sm text-gray-500">Real-time updates on opens, replies, and interviews.</p>
            </div>
          </div>
        </div>

        {/* Right Preview */}
        <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 min-h-[400px] lg:min-h-0">
          {/* Decorative stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-b from-emerald-200/50 via-teal-300/30 to-emerald-200/50" />
          
          {/* Mockup Preview */}
          <div className="absolute inset-8 lg:inset-12 bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              </div>
            </div>
            {/* Content */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="h-3 w-24 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 w-16 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-2 w-full bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 w-2/3 bg-gray-100 rounded"></div>
                    </div>
                    <div className="h-5 w-16 bg-emerald-100 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Grid Feature Card Component
interface GridCardProps {
  label: string;
  title: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  href: string;
  delay?: number;
}

function GridFeatureCard({ label, title, icon: Icon, accentColor, accentBg, href, delay = 0 }: GridCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <Link
            to={href}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      </div>

      {/* Preview Zone */}
      <div className={`relative h-48 ${accentBg}`}>
        {/* Accent stripe at top */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${accentColor}`} />
        
        {/* Mini Mockup */}
        <div className="absolute inset-4 top-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-md ${accentBg} flex items-center justify-center`}>
                <Icon className={`w-3 h-3 ${accentColor.replace('bg-', 'text-').replace('-500', '-600').replace('-400', '-600')}`} />
              </div>
              <div className="h-2 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-100 rounded"></div>
              <div className="h-2 w-4/5 bg-gray-100 rounded"></div>
              <div className="h-2 w-3/5 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeatureSection() {
  const gridFeatures = [
    {
      label: 'AI Writing',
      title: 'AI-crafted applications.',
      icon: FileText,
      accentColor: 'bg-blue-400',
      accentBg: 'bg-blue-50',
      href: '/signup',
    },
    {
      label: 'Application Tracking',
      title: 'Every application, tracked.',
      icon: BarChart3,
      accentColor: 'bg-orange-400',
      accentBg: 'bg-orange-50',
      href: '/signup',
    },
    {
      label: 'Smart Analytics',
      title: 'Data-driven insights.',
      icon: BarChart3,
      accentColor: 'bg-violet-400',
      accentBg: 'bg-violet-50',
      href: '/signup',
    },
    {
      label: 'Job Search',
      title: 'Find jobs that find you.',
      icon: Search,
      accentColor: 'bg-emerald-400',
      accentBg: 'bg-emerald-50',
      href: '/signup',
    },
  ];

  return (
    <section id="features" className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero Feature Card */}
        <HeroFeatureCard />

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {gridFeatures.map((feature, index) => (
            <GridFeatureCard
              key={feature.label}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
