'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Send,
  Timer
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Interface definitions
interface Exam {
  id: number;
  name: string;
  duration_minutes: number;
  open_at: string;
  close_at: string;
}

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'essay';
  options: string[] | null;
  score: number;
  order_number: number;
}

interface ExamResponse {
  success: boolean;
  message: string;
  data: {
    exam: Exam;
    questions: Question[];
  };
}

const CustomProgress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`h-1.5 w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full bg-primary transition-all duration-700 ease-in-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export default function ExamQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.exam_id;

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<{ exam: Exam; questions: Question[] } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        const response = await api.get<ExamResponse>(`/student/exams/${examId}/questions`);
        if (response.data.success) {
          setExamData(response.data.data);
          setTimeLeft(response.data.data.exam.duration_minutes * 60);
          const savedAnswers = localStorage.getItem(`exam_answers_${examId}`);
          if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        }
      } catch (error) {
        console.error('Failed to fetch exam questions:', error);
        toast.error('Không thể tải bộ câu hỏi.');
      } finally {
        setLoading(false);
      }
    };
    if (examId) fetchExamData();
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (examData && !loading) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, examData, loading]);

  useEffect(() => {
    if (examId && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(answers));
    }
  }, [answers, examId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (examData && currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const endpoint = `/student/exams/${examId}/submit`;
    const payload = {
      answers: answers, // { question_id: answer_content }
    };

    console.group('🚀 [SUBMITTING EXAM]');
    console.log('📍 URL:', `http://127.0.0.1:8000/api${endpoint}`);
    console.log('📦 Body:', payload);
    console.groupEnd();

    try {
      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        toast.success(response.data.message || 'Nộp bài thành công!');
        localStorage.removeItem(`exam_answers_${examId}`);
        // router.push(`/student/exams/${examId}/result`);
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi nộp bài.');
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng kiểm tra lại kết nối.');
      }
    } finally {
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = useMemo(() => {
    if (!examData) return 0;
    return (Object.keys(answers).length / examData.questions.length) * 100;
  }, [answers, examData]);

  if (loading || !examData) return <div className="p-8">Đang tải...</div>;

  const currentQuestion = examData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === examData.questions.length - 1;

  return (
    <div className="flex flex-col h-screen bg-[#fdfdfd] overflow-hidden">
      {/* Mini Header */}
      <header className="h-14 border-b bg-white px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-sm font-bold truncate max-w-[200px]">{examData.exam.name}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-mono font-bold ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-700'
            }`}>
            <Timer className="w-4 h-4" />
            <span className="text-base">{formatTime(timeLeft)}</span>
          </div>
          <Button size="sm" onClick={() => setIsSubmitDialogOpen(true)} className="rounded-lg h-9 px-4 font-bold">
            <Send className="w-3.5 h-3.5 mr-2" />
            Nộp bài
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-6">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>TIẾN ĐỘ: {Math.round(progress)}%</span>
                <span>{Object.keys(answers).length}/{examData.questions.length} CÂU</span>
              </div>
              <CustomProgress value={progress} />
            </div>

            <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
              <CardHeader className="bg-slate-50/50 py-3 px-5 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    {currentQuestion.order_number}
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-black py-0 px-2 h-5">
                    {currentQuestion.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                  </Badge>
                </div>
                <span className="text-[11px] font-bold text-slate-400">{currentQuestion.score} điểm</span>
              </CardHeader>
              <CardContent className="p-5 md:p-8">
                <div
                  className="text-base md:text-lg font-medium text-slate-800 leading-relaxed mb-6"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
                />

                <div className="space-y-2.5">
                  {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
                    currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion.id] === option;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerChange(currentQuestion.id, option)}
                          className={`w-full flex items-center text-left p-3 rounded-xl border-2 transition-all ${isSelected
                            ? 'border-primary bg-primary/[0.02] ring-2 ring-primary/5'
                            : 'border-slate-100 hover:border-slate-200'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 shrink-0 ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300'
                            }`}>
                            {isSelected ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[10px]">{String.fromCharCode(65 + idx)}</span>}
                          </div>
                          <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                            {option}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Nhập nội dung bài làm..."
                        className="min-h-[200px] text-base p-4 rounded-xl border-2 border-slate-100 focus:border-primary resize-none"
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center py-2">
              <Button variant="outline" disabled={currentQuestionIndex === 0} onClick={handlePrevious} className="h-10 rounded-xl px-4 font-bold text-slate-600">
                <ChevronLeft className="w-4 h-4 mr-1.5" /> Câu trước
              </Button>
              <Button onClick={isLastQuestion ? () => setIsSubmitDialogOpen(true) : handleNext} className={`h-10 rounded-xl px-6 font-bold ${isLastQuestion ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90 text-white'}`}>
                {isLastQuestion ? 'Nộp bài' : 'Câu sau'} <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </main>

        {/* Compact Sidebar */}
        <aside className={`w-64 border-l bg-white flex flex-col shrink-0 transition-all ${isSidebarOpen ? '' : 'hidden'}`}>
          <div className="p-3 border-b bg-slate-50/30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách câu hỏi</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 grid grid-cols-6 gap-1.5">
              {examData.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentQuestionIndex === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all border ${isCurrent ? 'bg-primary border-primary text-white shadow-md' :
                      isAnswered ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-3 bg-slate-50 border-t space-y-3">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">ĐÃ LÀM:</span>
              <span className="text-emerald-600">{Object.keys(answers).length}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">CÒN LẠI:</span>
              <span className="text-red-400">{examData.questions.length - Object.keys(answers).length}</span>
            </div>
            <Button variant="ghost" className="w-full justify-start h-8 px-2 text-[10px] font-bold text-red-500 hover:bg-red-50" onClick={() => router.push('/student/dashboard')}>
              <LogOut className="w-3.5 h-3.5 mr-2" /> THOÁT PHÒNG THI
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận nộp bài?</DialogTitle>
            <DialogDescription>
              {Object.keys(answers).length < examData.questions.length ? 'Bạn chưa làm hết các câu hỏi. ' : ''}
              Bạn có chắc muốn kết thúc phần thi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)} className="flex-1 rounded-xl">Hủy</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 rounded-xl">{isSubmitting ? 'Đang nộp...' : 'Đồng ý'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
