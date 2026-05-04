import React from 'react';
import { GraduationCap, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="flex flex-col">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <GraduationCap size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">EduLearn</span>
            </div>
            <p className="mb-6 text-slate-500 leading-relaxed">
              Empowering learners globally with high-quality, accessible, and forward-thinking education. Building the leaders of tomorrow.
            </p>
            <div className="flex gap-4">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="mb-6 font-bold text-slate-900">About</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Company Info</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Careers</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Press & Media</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Our Blog</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="mb-6 font-bold text-slate-900">Courses</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Web Development</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Data Science</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Digital Marketing</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">UI/UX Design</Link></li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div>
            <h4 className="mb-6 font-bold text-slate-900">Support</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Help Center</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Contact Us</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Terms of Service</Link></li>
              <li><Link href="#" className="text-slate-500 hover:text-blue-600">Privacy Policy</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-100 flex flex-col md:flex-row items-center justify-between pt-8 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} EduLearn. All rights reserved.</p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link href="#" className="hover:text-slate-900">Privacy</Link>
            <Link href="#" className="hover:text-slate-900">Terms</Link>
            <Link href="#" className="hover:text-slate-900">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
