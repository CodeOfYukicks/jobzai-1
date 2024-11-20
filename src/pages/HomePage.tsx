import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, BrainCog, Mail, Lock, LineChart, Target, Users, Rocket, Search, Calendar, Globe, Save, Bell, Share2, Clock } from 'lucide-react';
import Hero from '../components/Hero';
import WordRotator from '../components/WordRotator';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';
import RainbowButton from '../components/RainbowButton';
import FirebaseImage from '../components/FirebaseImage';
import { BentoGrid, BentoCard } from '../components/ui/bento-grid';
import GlobeComponent from '../components/ui/globe';
import { AnimatedBeam } from '../components/ui/animated-beam';
import { useRef } from 'react';
import Particles from '../components/ui/particles';
import AnimatedCircularProgressBar from '../components/ui/animated-circular-progress-bar';
import SparklesText from '../components/ui/sparkles-text';
import ShineBorder from '../components/ui/shine-border'
import Meteors from '../components/ui/meteors';
import GridPattern from '../components/ui/grid-pattern';
import RetroGrid from '../components/ui/retro-grid';
import HeroVideoDialog from '../components/ui/hero-video-dialog';

const tiers = [
  {
    name: 'Free',
    price: '€0',
    period: 'month',
    description: 'Perfect for trying out the basics of Jobz.ai',
    features: [
      '25 Credits / month',
      'Access to Basic Job Application Templates',
      'AI-Powered Cover Letter Assistance',
      'Application Tracking Dashboard',
      'Standard Email Support',
    ],
    cta: 'Try Free',
    href: '/signup',
  },
  {
    name: 'Standard',
    price: '€39',
    period: 'month',
    description: 'Ideal for regular job seekers who need more credits.',
    features: [
      '500 Credits / month',
      'All Free Features, plus:',
      'Automated Campaigns for targeted job applications',
      'Basic Analytics (open rates, response rates)',
      'AI-Generated Personalized Content',
      'Priority Email Support',
    ],
    cta: 'Get Started',
    href: '/signup',
    mostPopular: true,
  },
  {
    name: 'Premium',
    price: '€69',
    period: 'month',
    description: 'Designed for power users needing high-volume applications.',
    features: [
      'Unlimited Credits',
      'Premium AI Templates',
      'Advanced Analytics Dashboard',
      'Custom Integration Options',
      'Priority Support 24/7',
      'Team Collaboration Tools',
      'API Access',
    ],
    cta: 'Get Started',
    href: '/signup',
    isDark: true,
  },
];

const features = [
  {
    title: 'Dashboard Analytics',
    description: 'Track your job applications with real-time insights on opens, responses, and campaign performance.',
    icon: 'images/dashboard-icon.png',
  },
  {
    title: 'Credit-Based System',
    description: 'Manage your applications with flexible credits tailored to your job search intensity. 1 credit = 1 application',
    icon: 'images/credit-icon.png',
  },
  {
    title: 'Automated Tracking',
    description: 'Keep tabs on all applications sent, avoiding duplicates and managing follow-ups easily.',
    icon: 'images/tracking-icon.png',
  },
];

// D├®finir la configuration du globe en dehors du composant
const GLOBE_CONFIG = {
  width: 800,
  height: 800,
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.55, 0.46, 0.9],    // #8D75E6
  markerColor: [1, 1, 1],          // Blanc
  glowColor: [0.55, 0.46, 0.9],    // #8D75E6
  pointSize: 1.5,
  pointsData: [],
  backgroundColor: '#544582',
  globeColor: [0.55, 0.46, 0.9],
  atmosphereColor: [0.55, 0.46, 0.9],
  markers: [
    { location: [40.7128, -74.006], size: 0.05 },  // New York
    { location: [48.8566, 2.3522], size: 0.05 },   // Paris
    { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
  ],
  onRender: () => {},
};

export default function HomePage() {
  // D├®finir tous les refs n├®cessaires
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white dark:bg-[#2A2831] transition-colors duration-200">
      {/* Hero Section */}
      <section className="bg-[#8D75E6] dark:bg-[#2A2831] transition-colors duration-200">
        <Hero />
      </section>

      {/* Bento Grid Section */}
      <section id="features" className="py-24 bg-[#8D75E6] dark:bg-[#2A2831] relative transition-colors duration-200">
        {/* Pattern de points */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0'
          }}
        />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <SparklesText 
            text="Everything you need to succeed"
            colors={{ first: "#FE8BBB", second: "#4D3E78" }}
            className="text-4xl font-bold text-center text-white mb-16"
          />

          <div className="grid grid-cols-12 gap-6">
            {/* Carte Gestion de Campagnes avec Globe */}
            <BentoCard
              name="Campaigns"
              className="col-span-12 md:col-span-7 h-[300px] bg-[#544582] text-white"
              Icon={Rocket}
              iconClassName="text-white"
              nameClassName="text-white"
              descriptionClassName="text-white"
              ctaClassName="text-white hover:text-white"
              description="Create and manage mass job application campaigns. Target companies that interest you and automate your outreach."
              href="/signup"
              cta="Launch Campaign"
              background={
                <div className="absolute inset-0">
                  <GlobeComponent 
                    {...GLOBE_CONFIG}
                    baseColor={[0.55, 0.46, 0.9]}
                    glowColor={[0.55, 0.46, 0.9]}
                    markerColor={[1, 1, 1]}
                    atmosphereColor={[0.55, 0.46, 0.9]}
                    globeColor={[0.55, 0.46, 0.9]}
                    pointColor={[0.55, 0.46, 0.9]}
                  />
                </div>
              }
            />

            {/* Carte Tracking avec AnimatedBeam */}
            <BentoCard
              name="Tracking"
              className="col-span-12 md:col-span-5 h-[300px] bg-[#544582] text-white"
              Icon={LineChart}
              iconClassName="text-white"
              description="Monitor your applications in real-time with our intuitive tracking system."
              href="/signup"
              cta="View Dashboard"
              background={
                <div className="absolute inset-0" ref={containerRef}>
                  <div className="absolute inset-0" />
                  <div ref={div1Ref} className="absolute top-10 left-10 p-3 bg-[#FFB17A] rounded-full shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div ref={div2Ref} className="absolute bottom-10 right-10 p-3 bg-[#9E7AFF] rounded-full shadow-lg">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={div1Ref}
                    toRef={div2Ref}
                    color="#FFB17A"
                  />
                </div>
              }
            />

            {/* Carte Recommandations */}
            <BentoCard
              name="Smart Matching"
              className="col-span-12 md:col-span-5 h-[300px] bg-[#544582] text-white"
              Icon={Target}
              iconClassName="text-white"
              description="Our AI analyzes your profile and suggests the best opportunities tailored to your experience."
              href="/signup"
              cta="View Matches"
              background={
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatedCircularProgressBar
                    max={100}
                    min={0}
                    value={85}
                    gaugePrimaryColor="#FFB17A"
                    gaugeSecondaryColor="rgba(255, 177, 122, 0.2)"
                    className="opacity-30"
                  />
                </div>
              }
            />

            {/* Carte Templates avec Particles */}
            <BentoCard
              name="Templates"
              className="col-span-12 md:col-span-7 h-[300px] bg-[#544582] text-white"
              Icon={Save}
              iconClassName="text-white"
              description="Create and customize application templates for different job types and industries."
              href="/signup"
              cta="Manage Templates"
              background={
                <div className="absolute inset-0">
                  <Particles 
                    className="h-full w-full"
                    quantity={50}
                    staticity={30}
                    ease={50}
                    color="#9E7AFF"
                    size={0.5}
                  />
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* 5 Steps Section */}
      <div id="how-it-works" className="bg-[#8D75E6] dark:bg-[#2A2831] text-white transition-colors duration-200 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SparklesText 
            text="5 steps to get your dream job"
            colors={{ first: "#FFB17A", second: "#9E7AFF" }}
            className="text-4xl font-bold text-center mb-16"
          />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step1.png" alt="Discover & Sign Up" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Discover & Sign Up</h3>
              <p className="text-sm text-gray-100">Alex learns about Jobz.ai and signs up, ready to make job searching faster and easier.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step2.png" alt="Set Your Goals" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Set Your Goals</h3>
              <p className="text-sm text-gray-100">Alex customizes job preferences, choosing industry, location, and job type for a focused search.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step3.png" alt="Launch Your Campaign" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Launch Your Campaign</h3>
              <p className="text-sm text-gray-100">With one click, Jobz.ai's AI creates and sends personalized applications, all tailored to Alex's profile.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step4.png" alt="Track & Improve" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Track & Improve</h3>
              <p className="text-sm text-gray-100">Alex checks the dashboard to see progress and gets tips to boost response rates and refine the search.</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <FirebaseImage path="images/step5.png" alt="Celebrate Progress" className="mx-auto" />
              </div>
              <h3 className="font-bold mb-2">Celebrate Progress</h3>
              <p className="text-sm text-gray-100">With interviews rolling in, Alex is closer than ever to the dream job, thanks to Jobz.ai's smart strategy.</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link 
              to="/signup" 
              className="inline-flex h-11 items-center justify-center rounded-xl px-8 py-2 font-semibold text-white bg-[#4D3E78] hover:bg-[#3D2E68] transition-colors duration-200"
            >
              TRY FOR FREE
            </Link>
            <p className="mt-4 text-sm text-gray-100">25 credits offered</p>
          </div>
        </div>
      </div>

      {/* Innovation Section */}
      <section className="py-24 bg-[#8D75E6] relative transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <SparklesText 
            text="Innovation that flows"
            colors={{ first: "#544582", second: "#544582" }}
            className="text-5xl font-bold text-center mb-16 !text-[#544582]"
            style={{ color: '#544582' }}
          />

          {/* Contenu en deux colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Colonne de gauche avec BentoGrid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Première carte - Statistique */}
              <BentoCard
                name="Hidden Market"
                className="col-span-12 h-[300px] bg-[#544582] text-white"
                Icon={Target}
                iconClassName="text-white"
                nameClassName="text-white font-bold"
                descriptionClassName="text-white/80 font-medium"
                ctaClassName="text-white hover:text-white"
                description="of job opportunities are never posted publicly"
                href="/signup"
                cta="Learn More"
                background={
                  <div className="absolute inset-0 flex items-center justify-center bg-[#544582]">
                    <Particles
                      className="absolute inset-0"
                      quantity={50}
                      staticity={30}
                      ease={50}
                      size={1}
                      color="#FFFFFF"
                    />
                    <div className="relative z-10 text-center">
                      <span className="text-[80px] font-bold text-white" style={{
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                      }}>
                        85%
                      </span>
                    </div>
                  </div>
                }
              />

              {/* Deuxième carte - Temps de réponse */}
              <BentoCard
                name="Response Time"
                className="col-span-12 h-[300px] bg-[#544582] text-white"
                Icon={Clock}
                iconClassName="text-white"
                nameClassName="text-white font-bold"
                descriptionClassName="text-white/80 font-medium"
                ctaClassName="text-white hover:text-white"
                description="average time to first interview with our AI-powered outreach"
                href="/signup"
                cta="Get Started"
                background={
                  <div className="absolute inset-0 flex items-center justify-center bg-[#544582] overflow-hidden">
                    <Meteors number={20} />
                    <div className="relative z-10 text-center">
                      <span className="text-[80px] font-bold text-white" style={{
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                      }}>
                        24h
                      </span>
                    </div>
                  </div>
                }
              />
            </div>

            {/* Colonne de droite avec le texte */}
            <div className="space-y-12">
              <div>
                <h3 className="text-2xl font-bold text-[#544582] mb-4">
                  Seamless Access to the Hidden Job Market
                </h3>
                <p className="text-white/90 font-normal leading-relaxed">
                  Jobz.ai allows you to apply to job opportunities not publicly advertised, 
                  <span className="font-medium">giving you an edge in a competitive market.</span> 
                  Our AI reaches hiring managers directly, ensuring your application is seen by the right people.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#544582] mb-4">
                  Effortless Application Process
                </h3>
                <p className="text-white/90 font-normal leading-relaxed">
                  With just a few clicks, Jobz.ai automates your job applications by 
                  <span className="font-medium">generating personalized emails based on your profile and preferences.</span> 
                  You focus on what matters, while we handle the heavy lifting.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#544582] mb-4">
                  Smart Campaign Management and Insights
                </h3>
                <p className="text-white/90 font-normal leading-relaxed">
                  Our intuitive dashboard gives you 
                  <span className="font-medium">real-time feedback on your applications,</span> 
                  showing which messages are opened and which generate responses. You can easily track and optimize 
                  your job search strategy for better results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#8D75E6] dark:bg-[#2A2831] relative transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <SparklesText 
            text="See how it works"
            colors={{ first: "#FE8BBB", second: "#4D3E78" }}
            className="text-4xl font-bold text-center text-white mb-16"
          />
          
          <HeroVideoDialog
            videoSrc="https://www.youtube.com/embed/your-video-id"
            thumbnailSrc="/images/video-thumbnail.jpg"
            thumbnailAlt="Watch how Jobz.ai works"
            animationStyle="from-bottom"
            className="max-w-4xl mx-auto"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#8D75E6] dark:bg-[#2A2831] text-white relative transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <FirebaseImage
                  path={feature.icon}
                  alt={feature.title}
                  className="w-16 h-16 mx-auto mb-6"
                />
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-100">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/signup"
              className="inline-flex h-11 items-center justify-center rounded-xl px-8 py-2 font-semibold text-white bg-[#4D3E78] hover:bg-[#3D2E68] transition-colors duration-200"
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden bg-gray-50 dark:bg-[#2A2831] transition-colors duration-200">
        <RetroGrid 
          className="opacity-30" 
          angle={45}
        />
        
        <div className="absolute inset-0 bg-gray-50/90 dark:bg-[#2A2831]/90" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <SparklesText 
              text="Simple, transparent pricing"
              colors={{ first: "#9E7AFF", second: "#FFB17A" }}
              className="text-4xl font-bold text-[#4D3E78] dark:text-white"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-gray-600 dark:text-gray-300"
            >
              Choose the plan that best fits your needs
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div key={tier.name}>
                {tier.name === 'Standard' ? (
                  <ShineBorder
                    borderRadius={16}
                    borderWidth={2}
                    duration={8}
                    color={["#8D75E6", "#4D3E78"]}
                    className="w-full h-full"
                  >
                    <PricingCard {...tier} noBorder />
                  </ShineBorder>
                ) : (
                  <PricingCard {...tier} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
