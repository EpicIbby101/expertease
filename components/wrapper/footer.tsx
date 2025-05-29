'use client';

import Link from 'next/link';
import { Bug } from 'lucide-react';
import { TITLE_TAILWIND_CLASS } from '@/utils/constants';
import { Button } from '@/components/ui/button';

export const Footer = () => {
  const navigationItems = [
    {
      title: 'Product',
      items: [
        {
          title: 'Features',
          href: '#',
        },
        {
          title: 'Documentation',
          href: '#',
        },
        {
          title: 'Pricing',
          href: '#',
        },
        {
          title: 'Roadmap',
          href: '#',
        },
      ],
    },
    {
      title: 'Company',
      items: [
        {
          title: 'About',
          href: '#',
        },
        {
          title: 'Blog',
          href: '#',
        },
        {
          title: 'GitHub',
          href: 'https://github.com',
        },
        {
          title: 'Contact',
          href: '#',
        },
      ],
    },
  ];

  return (
    <footer className="w-full py-12 border-t">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="flex gap-8 flex-col items-start">
            <div className="flex gap-2 flex-col">
              <h2
                className={`${TITLE_TAILWIND_CLASS} tracking-tighter max-w-xl font-regular text-left`}
              >
                Titan
              </h2>
              <p className="text-lg max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                Performant NextJS Boilerplate for Startups
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-20">
              <div className="flex flex-col text-sm max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                <Link
                  href="https://x.com/_7obaid_"
                  target="_blank"
                  className="hover:text-primary transition-colors mt-2"
                >
                  Created by @_7obaid_
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 mt-2"
                  onClick={() => window.open('https://userjot.com/', '_blank')}
                >
                  <Bug className="h-4 w-4" />
                  Report Bug / Request Feature
                </Button>
              </div>
              <div className="flex flex-col text-sm max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left mt-4 sm:mt-0">
                <Link href="#" className="hover:text-primary transition-colors">
                  Terms of service
                </Link>
                <Link href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="hover:text-primary transition-colors">
                  Security
                </Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 items-start mt-6 lg:mt-0">
            {navigationItems.map((item) => (
              <div key={item.title} className="flex text-base gap-1 flex-col items-start">
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-medium">{item.title}</p>
                  {item.items &&
                    item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="flex justify-between items-center hover:text-primary transition-colors py-1"
                      >
                        <span className="text-muted-foreground">{subItem.title}</span>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
