export interface Position {
	title: string
	period: string
	description: string
	responsibilities: string[]
	tags?: string[]
	industry?: string
}

export interface Company {
	name: string
	location: string
	period: string
	website: string
	positions: Position[]
}

export interface Education {
	institution: string
	location: string
	year: string
	website: string
	degree: string
	degreeType: string
	description: string
	thesis?: string
	thesisUrl?: string
	grade?: string
	tags?: string[]
}

export interface Language {
	name: string
	level: string
	isNative?: boolean
	certification?: string
}

export interface Certification {
	year: string
	name: string
	location?: string
	url?: string
}

export interface CompetencyArea {
	category: string
	items: string
}

export interface CVData {
	name: string
	title: string
	location: string
	citizenship: string
	email: string
	website: string
	github: string
	summary: string
	impact: string[]
	competencies: CompetencyArea[]
	experience: Company[]
	earlierExperience: Company[]
	education: Education[]
	languages: Language[]
	certifications: Certification[]
	additionalInfo: {
		drivingLicense: string
		interests: string
	}
}

export const cv: CVData = {
	name: 'Javier Donado',
	title: 'Engineering & People Leader · Solution Architect',
	location: 'Stuttgart, Germany',
	citizenship: 'Spanish and German citizenship',
	email: 'jdonado@jdonado.com',
	website: 'https://www.jdonado.com',
	github: 'https://github.com/mrdonado',

	summary:
		'Solution Architect and Engineering Lead with close to 20 years of experience in software architecture, digital product development, and technical leadership at scale. Applies systems thinking to identify hidden constraints, untangle inter-team dependencies, and design environments where teams can own and deliver end to end. Known for driving engineering culture as a strategic lever — from DORA metrics and communities of practice to feedback culture and AI-driven workflows. Experienced in leading teams of teams, influencing architecture across organisations, and aligning technical strategy with business goals.',

	impact: [
		'Led architecture and technical direction across multiple Porsche.com Agile Release Trains — including PCOM, Brand and Model, and Brand Platform — spanning 5 to 8 product and system teams.',
		'Applied systems thinking to identify hidden bottlenecks — in content delivery chains, homepage dependencies, model pages, and technical data integrations — that silently prevented teams from working in parallel; redesigned both architecture and delivery processes to remove them.',
		'Led the transformation of Porsche.com from a tightly coupled, on-premises setup where strong inter-team dependencies made independent delivery nearly impossible, to a cloud-native, verticalized architecture where teams own and ship their products end to end.',
		'Championed engineering culture as a strategic lever: established communities of practice, introduced DORA metrics and SRE practices, drove AI-driven workflows, normalised blameless post-mortems, and coached engineers on ownership, feedback, and trust.',
		'Architectural patterns established for Porsche.com attracted cross-group interest, with active evaluation by Audi and alignment sessions with Volkswagen Group engineering teams.',
		'Act as direct-line manager (People Lead) for eight colleagues specialised in AI and Software Engineering — conducting 1-on-1s, supporting career development, and writing performance reviews alongside the main Solution Architect role.',
		'Conducted hundreds of technical interviews over the years for roles spanning junior frontend developer to senior architect, across backend, frontend, and all things software engineering — contributing directly to hiring quality and team growth.',
		'Built and led teams of teams across multiple companies and industries over nearly two decades — consistently improving engineering practices and contributing to the delivery of impactful digital products.'
	],

	competencies: [
		{
			category: 'Architecture',
			items:
				'Solution architecture, software architecture, cloud-native systems, frontend architecture, integration architecture, API design, platform modernization, system design, architecture alignment.'
		},
		{
			category: 'Systems Thinking & Culture',
			items:
				'Systems thinking, constraint identification, dependency mapping, organisational design, engineering culture, communities of practice, DORA metrics, SRE, blameless post-mortems, feedback culture, AI-driven workflows.'
		},
		{
			category: 'Technical Leadership',
			items:
				'Technical strategy, team leadership, mentoring, engineering coaching, architecture guidance, code quality, technical decision-making, stakeholder alignment, cross-functional collaboration, technical interviewing.'
		},
		{
			category: 'Product & Delivery',
			items:
				'Digital product development, Lean product development, experimentation, data-driven decision-making, customer-centric solutions, agile delivery, discovery-to-delivery alignment.'
		},
		{
			category: 'Communication & Languages',
			items:
				'Stakeholder management, executive communication, storytelling, negotiation, technical writing. Native Spanish speaker, fluent in English and German, currently learning Greek.'
		},
		{
			category: 'Engineering',
			items:
				'Web (full-stack) and mobile development, TypeScript, Python, TDD, cloud development, DevOps practices, automation, quality assurance, software integration. Familiar with most mainstream frameworks and tooling across the stack.'
		}
	],

	experience: [
		{
			name: 'Porsche Digital GmbH',
			location: 'Ludwigsburg, Germany',
			period: '02/2018 – Present',
			website: 'https://www.porsche.digital/',
			positions: [
				{
					title: 'Solution Architect | Porsche.com Brand and Model ART',
					period: '07/2021 – Present',
					description:
						'As Solution Architect across multiple Porsche.com Agile Release Trains, I lead the technical direction of multidisciplinary product and system teams and ensure alignment between architecture, engineering execution, and business goals.',
					responsibilities: [
						'Led architecture and technical direction across multiple Porsche.com ARTs — including PCOM, Brand and Model, and Brand Platform — spanning 5 to 8 product and system teams.',
						'Applied systems thinking to uncover hidden bottlenecks in content delivery chains, homepage dependencies, and technical data integrations that silently blocked parallel team work; redesigned architecture and delivery processes to remove them.',
						'Led the transformation of Porsche.com from a tightly coupled, on-premises setup to a cloud-native, verticalized architecture where teams own and ship their products end to end.',
						'Championed engineering culture improvements: established communities of practice, introduced DORA metrics and SRE practices, drove AI-driven workflows, and normalised blameless post-mortems.',
						'Drove cross-group architectural alignment, with active evaluation of Porsche.com patterns by Audi and joint sessions with Volkswagen Group engineering teams.',
						'Managed the adoption of modern frontend and cloud technologies, practices, and architecture patterns.',
						'Contributed to significant improvements in performance, accessibility, and reliability.',
						'Helped position Porsche.com as a leading digital platform within the automotive industry.',
						'Act as direct-line manager (People Lead) for eight colleagues specialised in AI and Software Engineering — conducting 1-on-1s, supporting career development, and writing performance reviews alongside the main Solution Architect role.',
						'Support colleagues ranging from junior professionals to seasoned experts with over 20 years of experience.'
					],
					tags: [
						'Systems Thinking',
						'Team Topologies',
						'DDD',
						'AWS',
						'Azure',
						'SAFe',
						'DORA Metrics',
						'SRE',
						'ADRs',
						'Radical Candor',
						'Event Storming',
						'Micro-frontends',
						'CI/CD',
						'Next.js',
						'React',
						'TypeScript',
						'SSR',
						'SSG',
						'Headless CMS',
						'GitHub Copilot',
						'Cursor',
						'Claude Code',
						'Codex'
					],
					industry: 'Automotive'
				},
				{
					title: 'Senior Full-stack Engineer and Tech Lead | New Business and Customer Innovation',
					period: '02/2018 – 06/2021',
					description:
						'As Senior Full-stack Engineer and Tech Lead, I contributed to the creation of innovative digital products by translating early concepts into robust, customer-centric solutions.',
					responsibilities: [
						'Developed digital products in cross-functional teams using Lean principles.',
						'Helped establish a culture of experimentation and data-driven decision-making.',
						'Optimized value delivery while maintaining adaptability in uncertain product environments.',
						'Provided technical leadership across web, mobile, backend, and cloud technologies.',
						'Supported the successful delivery of multiple digital products through hands-on engineering and technical guidance.'
					],
					tags: [
						'iOS development',
						'React Native',
						'React.js',
						'Spring Boot',
						'Node.js',
						'AWS Cognito',
						'AWS DynamoDB',
						'AWS Lambda',
						'Amazon S3',
						'Amazon ECS',
						'AWS Fargate',
						'AWS Amplify',
						'Amazon CloudWatch',
						'CloudFoundry',
						'Kubernetes',
						'JavaScript',
						'TypeScript',
						'Kotlin',
						'Java',
						'MongoDB',
						'RabbitMQ'
					],
					industry: 'Automotive'
				}
			]
		},
		{
			name: 'netvico GmbH',
			location: 'Stuttgart, Germany',
			period: '06/2014 – 01/2018',
			website: 'https://www.netvico.com/',
			positions: [
				{
					title: 'Software Developer | Team Lead from 10/2016',
					period: '06/2014 – 01/2018',
					description:
						'At netvico GmbH, I worked as a software developer and later as Team Lead, combining hands-on development with team coordination, technical planning, and engineering process improvement.',
					responsibilities: [
						'Managed and mentored a team of developers while remaining actively involved in software development.',
						'Contributed to project planning, architecture, and implementation of digital products.',
						'Helped professionalize software development practices by improving processes and methodologies.',
						'Increased engineering efficiency and product quality through more structured development workflows.',
						'Delivered products and solutions for clients including Vögele Shoes, Daimler, and Deutsche Bahn.',
						'Successfully bridged hands-on software engineering, customer needs, and team leadership in a growing product environment.'
					],
					tags: [
						'JavaScript',
						'TypeScript',
						'Angular',
						'React',
						'Node.js',
						'jQuery',
						'Lodash',
						'Meteor',
						'd3.js',
						'SASS',
						'Docker',
						'C#',
						'Python',
						'Git',
						'Jenkins',
						'MySQL',
						'MongoDB'
					],
					industry: 'Connected Business, Digital Signage, Omnichannel'
				}
			]
		},
		{
			name: 'mm-lab GmbH',
			location: 'Kornwestheim, Germany',
			period: '09/2012 – 06/2014',
			website: 'https://www.mmlab.de/',
			positions: [
				{
					title: 'Software Engineer',
					period: '09/2012 – 06/2014',
					description:
						'At mm-lab GmbH, I developed and integrated software solutions for the automotive industry, with a focus on automotive test track management systems and vehicle telematics.',
					responsibilities: [
						'Contributed to the development and integration of automotive software solutions.',
						'Specialized in test track management systems and operational software for vehicle-related environments.',
						'Took responsibility for Linux administration and quality assurance engineering.',
						'Helped ensure stable operation, maintainability, and performance of software products.',
						'Worked successfully in a technically demanding domain that required reliability, integration discipline, and close attention to operational quality.'
					],
					tags: [
						'Linux',
						'Shell Scripting',
						'Virtualization',
						'C++',
						'Git',
						'SVN',
						'MySQL',
						'Perl',
						'PHP'
					],
					industry: 'Vehicle Telematics'
				}
			]
		}
	],

	earlierExperience: [
		{
			name: 'Daedalus – Data, Decisions and Language',
			location: 'Madrid, Spain',
			period: '05/2011 – 08/2012',
			website: 'https://www.meaningcloud.com/',
			positions: [
				{
					title: 'Software Analyst',
					period: '05/2011 – 08/2012',
					description:
						'At Daedalus, I worked on the design, development, and maintenance of products and R&D projects in the field of Natural Language Processing.',
					responsibilities: [
						'Contributed to NLP products and R&D projects involving both frontend and backend development.',
						'Worked across product development, maintenance, and research-oriented implementation tasks.',
						'Applied a broad technical stack across Java, Linux, databases, web technologies, and service integrations.',
						'Succeeded in an R&D-heavy environment by combining analytical thinking, software engineering, and adaptability across different parts of the stack.'
					],
					tags: [
						'Java',
						'Linux',
						'MySQL',
						'PHP',
						'LAMP stack',
						'JavaScript',
						'jQuery',
						'Visual C#',
						'Visual C++',
						'Git',
						'REST',
						'SOAP web services'
					],
					industry: 'Natural Language and Data Processing'
				}
			]
		},
		{
			name: 'Primeur',
			location: 'Madrid, Spain',
			period: '04/2010 – 05/2011',
			website: 'https://www.primeur.com/',
			positions: [
				{
					title: 'Programmer Analyst',
					period: '04/2010 – 05/2011',
					description:
						'At Primeur, I worked on backend development in the area of Service-Oriented Architecture, delivering enterprise integration solutions for large clients.',
					responsibilities: [
						'Developed backend solutions for enterprise integration and SOA environments.',
						'Worked with IBM WebSphere Message Broker, IBM MQ, ESQL, Java, C#, and SQL.',
						'Delivered software integration consulting work for clients including IBM, El Corte Inglés, Repsol/YPF, and Mitsubishi Motors.',
						'Built a strong foundation in enterprise architecture, messaging systems, integration patterns, and backend reliability.',
						'Succeeded by learning complex enterprise technologies quickly and applying them in client-facing delivery contexts.'
					],
					tags: ['IBM WebSphere Message Broker', 'IBM MQ', 'ESQL', 'Java', 'C#', 'SQL'],
					industry: 'Software Integration Consulting, Service-Oriented Architecture'
				}
			]
		},
		{
			name: 'Deimos Space',
			location: 'Tres Cantos, Madrid, Spain',
			period: '03/2008 – 08/2008',
			website: 'http://www.elecnor-deimos.com',
			positions: [
				{
					title: 'Research Internship',
					period: '03/2008 – 08/2008',
					description:
						'At Deimos Space, I worked as an R&D intern on advanced networks and communication systems, particularly in satellite communications and maritime communications.',
					responsibilities: [
						'Participated in R&D activities related to advanced communication systems.',
						'Worked on projects including SESAMO and BAIP2020.',
						'Contributed to research involving satellite mobility systems and wireless sensor networks.',
						'Gained early experience in high-tech engineering environments where rigor, technical curiosity, and structured problem-solving were essential.'
					],
					industry: 'Space Sector, High-Tech Projects'
				}
			]
		}
	],

	education: [
		{
			institution: 'Universidad Carlos III de Madrid',
			location: 'Madrid, Spain',
			year: '09/2009',
			website: 'https://www.uc3m.es',
			degree: 'MS in Telecommunications Engineering, majoring in Telecommunication Systems',
			degreeType: '5-year degree, pre-Bologna system · ISCED 7 / EQF Level 7',
			description:
				'The Telecommunications Engineering degree provided comprehensive theoretical knowledge and practical skills in information transmission and processing. It covered telecommunications technologies, networks, system design, architecture and integration, software engineering, and cybersecurity.',
			thesis:
				'Design and development of a Java application for the harmonic analysis of musical scores',
			thesisUrl: 'https://e-archivo.uc3m.es/handle/10016/10824',
			grade: 'With Honors, MH',
			tags: [
				'Telecommunications',
				'Signal Processing',
				'Networks & Protocols',
				'Computer Architecture',
				'Microprocessors',
				'Electronics',
				'Digital Systems',
				'Software Engineering',
				'C / C++',
				'MATLAB',
				'Linux',
				'Cybersecurity'
			]
		}
	],

	languages: [
		{ name: 'Spanish', level: 'Native', isNative: true },
		{
			name: 'English',
			level: 'C1',
			certification: 'Certificate in Advanced English, CAE, University of Cambridge, 05/2011'
		},
		{ name: 'German', level: 'C1' },
		{ name: 'Greek', level: 'Learning' }
	],

	certifications: [
		{
			year: '2022–present',
			name: 'Hands-on exploration of AI-driven workflows, LLMs, prompt engineering, agentic workflows (OpenClaw, Hermes, and others), and AI-assisted development — applied to professional projects and personal experiments.'
		},
		{
			year: '2023–present',
			name: 'Personal knowledge management with Obsidian — structured note-taking, idea linking, and maintaining a personal knowledge base.',
			url: 'https://obsidian.md'
		},
		{ year: '07/2021', name: 'Certified SAFe 5 Architect' },
		{
			year: '2014–present',
			name: 'Continuous learning via online platforms (50+ courses across cloud architecture, AI/ML, frontend, leadership, and software design).'
		},
		{
			year: '2014–present',
			name: 'Open-source side projects and experiments',
			url: 'https://github.com/mrdonado'
		},
		{
			year: '06/2013',
			name: 'ISTQB Certified Tester, Foundation Level',
			location: 'Stuttgart',
			url: 'https://www.istqb.org'
		},
		{ year: '05/2011', name: 'Certificate in Advanced English, CAE C1', location: 'Madrid' }
	],

	additionalInfo: {
		drivingLicense: 'Category B',
		interests:
			'Science and technology, travel (34 countries and counting), music, photography, guitar playing, music composition, home recording, and foosball (Kicker! ⚽).'
	}
}
