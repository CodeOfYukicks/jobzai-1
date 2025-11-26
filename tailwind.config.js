/** @type {import('tailwindcss').Config} */
import tailwindAnimate from 'tailwindcss-animate';
import tailwindTypography from '@tailwindcss/typography';

export default {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: 'true',
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'geist': ['Geist', 'system-ui', 'sans-serif'],
				'inter-tight': ['Inter Tight', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				rainbow: {
					'0%, 100%': {
						'background-position': '0% 50%'
					},
					'50%': {
						'background-position': '100% 50%'
					}
				},
				shine: {
					'0%': {
						'background-position': '200% center'
					},
					'100%': {
						'background-position': '-200% center'
					}
				},
				meteor: {
					'0%': { transform: 'rotate(215deg) translateX(0)', opacity: 1 },
					'70%': { opacity: 1 },
					'100%': {
						transform: 'rotate(215deg) translateX(-500px)',
						opacity: 0
					},
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'float-slow': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-5px)' },
				},
				'glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(141, 117, 230, 0.3), 0 0 40px rgba(141, 117, 230, 0.1)'
					},
					'50%': {
						boxShadow: '0 0 30px rgba(141, 117, 230, 0.5), 0 0 60px rgba(141, 117, 230, 0.2)'
					},
				},
				'pulse-glow': {
					'0%, 100%': {
						opacity: 1,
						boxShadow: '0 0 20px rgba(141, 117, 230, 0.4)'
					},
					'50%': {
						opacity: 0.8,
						boxShadow: '0 0 40px rgba(141, 117, 230, 0.6)'
					},
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					},
				},
				'gradient-shift': {
					'0%, 100%': {
						backgroundPosition: '0% 50%'
					},
					'50%': {
						backgroundPosition: '100% 50%'
					},
				},
				'border-glow': {
					'0%, 100%': {
						borderColor: 'rgba(141, 117, 230, 0.3)'
					},
					'50%': {
						borderColor: 'rgba(141, 117, 230, 0.8)'
					},
				},
				'scale-pulse': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' },
				},
				'fade-in-blur': {
					'0%': {
						opacity: 0,
						filter: 'blur(10px)',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: 1,
						filter: 'blur(0)',
						transform: 'translateY(0)'
					},
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				rainbow: 'rainbow 4s linear infinite',
				shine: 'shine 8s linear infinite',
				'meteor': 'meteor 5s linear infinite',
				'float': 'float 3s ease-in-out infinite',
				'float-slow': 'float-slow 4s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'shimmer': 'shimmer 3s linear infinite',
				'gradient-shift': 'gradient-shift 6s ease infinite',
				'border-glow': 'border-glow 2s ease-in-out infinite',
				'scale-pulse': 'scale-pulse 2s ease-in-out infinite',
				'fade-in-blur': 'fade-in-blur 0.6s ease-out forwards',
			},
			backgroundSize: {
				'shine-size': '200% 200%',
				'200': '200% 100%'
			},
			boxShadow: {
				'premium': '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)',
				'premium-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
				'glow-sm': '0 0 15px rgba(141, 117, 230, 0.3)',
				'glow': '0 0 30px rgba(141, 117, 230, 0.3)',
				'glow-lg': '0 0 50px rgba(141, 117, 230, 0.4)',
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
				'inner-glow': 'inset 0 0 20px rgba(141, 117, 230, 0.1)',
			},
			backdropBlur: {
				'xs': '2px',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-mesh': 'radial-gradient(at 0% 0%, rgb(168, 85, 247) 0px, transparent 50%), radial-gradient(at 100% 100%, rgb(99, 102, 241) 0px, transparent 50%)',
				'gradient-shimmer': 'linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.2) 50%, transparent 60%)',
			}
		}
	},
	plugins: [
		tailwindTypography,
		tailwindAnimate
	],
}