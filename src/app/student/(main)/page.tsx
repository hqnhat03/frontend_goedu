'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Award,
  DollarSign,
  Laptop, ShieldCheck,
  Star,
  Users
} from 'lucide-react';
import Image from 'next/image';

// --- MOCK DATA ---

const COURSES = [
  {
    id: 1,
    title: 'Thiết kế Web Toàn diện: từ Figma đến Webflow',
    instructor: 'Jane Doe',
    rating: 4.8,
    reviews: 1240,
    price: '$49.99',
    badge: 'Bán chạy nhất',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop',
    category: 'Thiết kế'
  },
  {
    id: 2,
    title: 'Lớp học Lập trình Fullstack React & Next.js',
    instructor: 'John Smith',
    rating: 4.9,
    reviews: 3120,
    price: '$79.99',
    badge: 'Phổ biến',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop',
    category: 'Phát triển'
  },
  {
    id: 3,
    title: 'Chiến lược Tiếp thị Kỹ thuật số & SEO',
    instructor: 'Sarah Lee',
    rating: 4.7,
    reviews: 840,
    price: 'Miễn phí',
    badge: 'Mới',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=600&auto=format&fit=crop',
    category: 'Tiếp thị'
  },
  {
    id: 4,
    title: 'Khóa huấn luyện Khoa học Dữ liệu 2024',
    instructor: 'Michael Chen',
    rating: 4.8,
    reviews: 2150,
    price: '$99.99',
    badge: 'Hot',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
    category: 'Khoa học Dữ liệu'
  }
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Emily Watson',
    role: 'Lập trình viên Front-end',
    text: '"Nền tảng này hoàn toàn thay đổi con đường sự nghiệp của tôi. Các khóa học được cấu trúc hoàn hảo, và đội ngũ giảng viên thật tuyệt vời."',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 2,
    name: 'James Carter',
    role: 'Nhà thiết kế UI/UX',
    text: '"Tôi rất thích những bài học thực tế ở đây. Bạn sẽ được xây dựng các dự án thực tế có thể đưa ngay vào portfolio của mình. Rất đáng để giới thiệu!"',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 3,
    name: 'Sophia Patel',
    role: 'Giám đốc Tiếp thị',
    text: '"Các khóa học tiếp thị đã mang lại cho tôi đúng những nền tảng cần thiết để mở rộng quy mô startup của chúng tôi. Trải nghiệm học tập vô cùng mượt mà."',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150'
  }
];

// --- COMPONENTS ---

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-20 pb-24 lg:pt-32 lg:pb-36">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-100/50 mix-blend-multiply blur-3xl"></div>
      <div className="absolute top-1/2 right-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-indigo-100/40 mix-blend-multiply blur-3xl"></div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

          {/* Left Content */}
          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 px-4 py-1.5 rounded-full text-sm font-medium">
              Gia nhập cùng 100.000+ học viên trên toàn cầu
            </Badge>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl lg:leading-[1.1]">
              Học Bất cứ điều gì, <span className="text-blue-600">Bất cứ lúc nào</span>, Bất cứ đâu
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-600 md:text-xl">
              Khai phá tiềm năng của bạn với các khóa học đẳng cấp thế giới được giảng dạy bởi các chuyên gia trong ngành. Xây dựng kỹ năng cần thiết cho tương lai, ngay hôm nay.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button size="lg" className="h-14 w-full rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl sm:w-auto">
                Bắt đầu ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 w-full rounded-full border-slate-200 px-8 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto">
                Khám phá Khóa học
              </Button>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4 text-sm text-slate-500 lg:justify-start">
              <div className="flex -space-x-3">
                <Image className="h-10 w-10 rounded-full border-2 border-slate-50" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="Student" width={10} height={10} />
                <Image className="h-10 w-10 rounded-full border-2 border-slate-50" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150" alt="Student" width={10} height={10} />
                <Image className="h-10 w-10 rounded-full border-2 border-slate-50" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" alt="Student" width={10} height={10} />
              </div>
              <p>Được tin tưởng với mức đánh giá <span className="font-semibold text-slate-900">4.9/5</span></p>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative z-10 hidden lg:block">
            <div className="relative rounded-3xl bg-white p-2 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
                alt="Students learning"
                className="rounded-2xl object-cover shadow-inner h-[500px] w-full"
                width={1000}
                height={500}
              />

              {/* Floating Element */}
              <div className="absolute -left-12 bottom-20 flex animate-bounce items-center gap-4 rounded-2xl bg-white p-4 shadow-xl xl:-left-16" style={{ animationDuration: '3s' }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Được Chứng nhận</p>
                  <p className="text-sm text-slate-500">Giảng viên Chuyên gia</p>
                </div>
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: 'Giảng viên Chuyên gia',
      description: 'Học hỏi từ các chuyên gia trong ngành với nhiều năm kinh nghiệm thực tế và kiến thức chuyên sâu.'
    },
    {
      icon: <Laptop className="h-6 w-6 text-indigo-600" />,
      title: 'Học tập Linh hoạt',
      description: 'Học theo nhịp độ của riêng bạn, từ bất cứ đâu, trên bất kỳ thiết bị nào. Lịch trình của bạn, quy tắc của bạn.'
    },
    {
      icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
      title: 'Giá cả Phải chăng',
      description: 'Giáo dục chất lượng cao nên được tiếp cận bởi tất cả mọi người. Chúng tôi cung cấp mức giá rất cạnh tranh.'
    },
    {
      icon: <Award className="h-6 w-6 text-accent-600 text-purple-600" />,
      title: 'Chứng nhận',
      description: 'Nhận chứng chỉ danh giá sau khi hoàn thành để thể hiện kỹ năng của bạn với các nhà tuyển dụng.'
    }
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Tại sao chọn EduLearn?</h2>
          <p className="mt-4 text-lg text-slate-600">Mọi thứ bạn cần để thành thạo các kỹ năng mới và thăng tiến trong sự nghiệp.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item, index) => (
            <Card key={index} className="group border-slate-100 bg-white transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-100">
              <CardContent className="p-8">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-blue-50">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoursesSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Khóa học Phổ biến</h2>
            <p className="mt-4 text-lg text-slate-600">Khám phá những chương trình được tìm kiếm nhiều nhất của chúng tôi, được lựa chọn bởi hàng ngàn người.</p>
          </div>
          <Button variant="outline" className="hidden border-slate-200 text-slate-700 hover:bg-white md:inline-flex">
            Xem Tất cả Khóa học
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {COURSES.map((course) => (
            <Card key={course.id} className="group flex cursor-pointer flex-col overflow-hidden border-slate-100 bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge className="absolute left-4 top-4 bg-white text-slate-900 hover:bg-slate-50 shadow-sm font-semibold">
                  {course.badge}
                </Badge>
                <div className="absolute inset-0 bg-slate-900/10 transition-opacity group-hover:opacity-0" />
              </div>

              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
                  <span className="font-medium text-blue-600">{course.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-700">{course.rating}</span>
                    <span>({course.reviews})</span>
                  </div>
                </div>

                <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>

                <p className="mb-6 text-sm text-slate-600">{course.instructor}</p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xl font-bold text-slate-900">{course.price}</span>
                  <p className="text-sm font-medium text-blue-600 group-hover:underline">Khám phá</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Button variant="outline" className="w-full border-slate-200 text-slate-700">
            Xem Tất cả Khóa học
          </Button>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Đăng ký',
      description: 'Tạo tài khoản miễn phí chỉ trong vài giây và truy cập ngay vào nền tảng của chúng tôi.'
    },
    {
      number: '02',
      title: 'Chọn Khóa học',
      description: 'Duyệt qua danh mục mở rộng của chúng tôi và tìm khóa học hoàn hảo cho mục tiêu của bạn.'
    },
    {
      number: '03',
      title: 'Bắt đầu Học',
      description: 'Theo dõi chương trình học có cấu trúc, hoàn thành các dự án thực tế và đạt được thành công.'
    }
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Cách thức Hoạt động</h2>
          <p className="mt-4 text-lg text-slate-600">Hành trình đến với sự thành thạo qua 3 bước đơn giản</p>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line for desktop */}
          <div className="absolute top-12 left-[16%] hidden w-[68%] border-t-2 border-dashed border-slate-200 md:block"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 border-8 border-white text-3xl font-extrabold text-blue-600 shadow-sm">
                {step.number}
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">{step.title}</h3>
              <p className="text-slate-600 max-w-[280px] mx-auto leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Câu chuyện Thành công của Học viên</h2>
          <p className="mt-4 text-lg text-slate-600">Đừng chỉ nghe từ chúng tôi—hãy lắng nghe từ những học viên đã tốt nghiệp.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.id} className="border-none bg-white p-2 shadow-sm transition-all hover:shadow-md">
              <CardContent className="flex flex-col justify-between p-8">
                <div className="mb-6 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-8 text-lg leading-relaxed text-slate-700 italic">
                  {testimonial.text}
                </p>
                <div className="mt-auto flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-slate-100">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <span className="text-sm text-slate-500">{testimonial.role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 px-6 py-20 text-center shadow-2xl md:px-16 md:py-24">
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"></div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Bắt đầu Học ngay Hôm nay
          </h2>
          <p className="mb-10 text-lg text-blue-100 md:text-xl md:px-8">
            Gia nhập cùng hàng ngàn học viên thành công và bắt đầu hành trình hướng tới một tương lai tươi sáng hơn. Khóa học đầu tiên của bạn chỉ cách một cú nhấp chuột.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-14 w-full rounded-full bg-white px-10 text-lg font-bold text-blue-700 shadow-xl transition-transform hover:-translate-y-1 hover:bg-slate-50 sm:w-auto">
              Tham gia Ngay
            </Button>
            <p className="mt-4 text-sm font-medium text-blue-200 sm:mt-0 sm:ml-4">
              Không yêu cầu thẻ tín dụng
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}



export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <CoursesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection />
    </main>
  );
}
