"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Trophy,
  User,
  Calendar,
  AlertCircle,
  ChevronRight,
  FileText,
  Save,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is available or I'll use simple alert/state if not. Let's check imports.
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardFooter,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useExamStore } from "@/store/exam-store";

interface Question {
  id: string;
  exam_id: number;
  question: string;
  type: "multiple_choice" | "essay";
  options: string[] | null;
  correct_answer: string | null;
  score: number;
  order_number: number;
}

interface Detail {
  id: number;
  exam_result_id: number;
  question_id: string;
  answer_content: string;
  score: number;
  is_correct: boolean | null;
  teacher_comment: string | null;
  created_at: string;
  updated_at: string;
  question: Question;
}

interface ExamResultData {
  id: number;
  exam_id: number;
  student_id: number;
  answers: Record<string, string>;
  score: number;
  status: "not_started" | "grading" | "completed";
  graded_by: number | null;
  graded_at: string | null;
  submitted_at: string;
  details: Detail[];
}

interface APIResponse {
  success: boolean;
  message: string;
  data: ExamResultData;
}

export default function StudentAnswersPage() {
  const params = useParams();
  const router = useRouter();
  const { id: classId, exam_id: examId, student_id: studentId } = params;
  const { currentStudentName: studentName } = useExamStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExamResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Grading state
  const [grades, setGrades] = useState<Record<string, { score: number; comment: string }>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        setLoading(true);
        const response = await api.get<APIResponse>(`/teacher/exams/${examId}/students/${studentId}/answers`);
        if (response.data.success) {
          const resultData = response.data.data;
          setData(resultData);
          
          // Initialize grades state from current data
          const initialGrades: Record<string, { score: number; comment: string }> = {};
          resultData.details.forEach(detail => {
            initialGrades[detail.question_id] = {
              score: detail.score,
              comment: detail.teacher_comment || ""
            };
          });
          setGrades(initialGrades);
        } else {
          setError(response.data.message || "Không thể tải dữ liệu.");
        }
      } catch (err: any) {
        console.error("Error fetching student answers:", err);
        setError(err.response?.data?.message || "Đã có lỗi xảy ra khi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    if (examId && studentId) {
      fetchAnswers();
    }
  }, [examId, studentId]);

  if (loading) {
    return (
      <div className="p-6 space-y-8 animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 md:col-span-1" />
          <Skeleton className="h-32 md:col-span-2" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive opacity-50" />
        <h2 className="text-xl font-semibold">{error || "Không tìm thấy dữ liệu"}</h2>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  const totalPossibleScore = data.details.reduce((acc, detail) => acc + detail.question.score, 0);

  // Calculate current total score from grades state
  const currentTotalScore = Object.values(grades).reduce((acc, g) => acc + (Number(g.score) || 0), 0);

  const handleUpdateGrade = (questionId: string, field: "score" | "comment", value: any) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: field === "score" ? parseFloat(value) || 0 : value
      }
    }));
  };

  const saveGrades = async () => {
    if (!data) return;
    
    try {
      setSaving(true);
      const essayDetails = data.details.filter(d => d.question.type === "essay");
      
      const payload = {
        answers: essayDetails.map(d => ({
          question_id: d.question_id,
          score: grades[d.question_id]?.score || 0,
          teacher_comment: grades[d.question_id]?.comment || ""
        })),
        score: currentTotalScore
      };

      const response = await api.put(`/teacher/results/${data.id}/grade`, payload);
      
      if (response.data.success) {
        toast.success("Chấm điểm thành công!");
        setData(prev => prev ? { ...prev, score: currentTotalScore, status: "completed" } : null);
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error("Error saving grades:", err);
      toast.error(err.response?.data?.message || "Đã có lỗi xảy ra khi lưu điểm.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none px-3 py-1 gap-1.5 shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Chưa làm bài
          </Badge>
        );
      case "grading":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 gap-1.5 shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ chấm điểm
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 gap-1.5 shadow-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đã hoàn thành
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation Header */}
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="group -ml-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Quay lại danh sách
        </Button>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {studentName ? `Bài làm của ${studentName}` : "Chi tiết bài làm"}
              </h1>
              {getStatusBadge(data.status)}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Mã học sinh: <span className="font-medium text-slate-700 dark:text-slate-300">#{data.student_id}</span>
            </p>
          </div>
          
          {(data.status !== "completed" || isEditing) ? (
            <div className="flex gap-2">
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Hủy chỉnh sửa
                </Button>
              )}
              <Button 
                className="shadow-lg shadow-blue-200 dark:shadow-none font-bold px-6 h-11"
                disabled={saving}
                onClick={saveGrades}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu kết quả chấm
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Chỉnh sửa điểm
            </Button>
          )}
        </div>
      </div>

      {/* Summary Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-100 text-sm font-medium uppercase tracking-wider">Tổng điểm hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{currentTotalScore}</span>
              <span className="text-xl text-blue-200">/ {totalPossibleScore}</span>
            </div>
            <p className="text-blue-100/80 text-sm mt-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tỉ lệ chính xác: {totalPossibleScore > 0 ? Math.round((currentTotalScore / totalPossibleScore) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Thông tin nộp bài
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Thời gian nộp
              </p>
              <p className="font-semibold">
                {format(new Date(data.submitted_at), "HH:mm:ss, 'ngày' dd 'tháng' MM, yyyy", { locale: vi })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Trạng thái chấm
              </p>
              <p className="font-semibold">
                {data.status === "completed" && "Đã hoàn thành"}
                {data.status === "grading" && "Đang chờ giáo viên chấm tự luận"}
                {data.status === "not_started" && "Học sinh chưa làm bài"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answers List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chi tiết các câu hỏi</h2>
          <span className="text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            {data.details.length} câu hỏi
          </span>
        </div>

        <div className="space-y-8">
          {data.details.sort((a, b) => a.question.order_number - b.question.order_number).map((detail, index) => {
            const isCorrect = detail.is_correct;
            const isEssay = detail.question.type === "essay";
            
            // Helper to determine if an option is correct or student's choice
            const getOptionStatus = (optionValue: string, optionIndex: number) => {
              const isStudentChoice = detail.answer_content === optionValue;
              
              // Handle correct answer as either index or value
              let isCorrectAnswer = false;
              if (detail.question.correct_answer === optionIndex.toString()) {
                isCorrectAnswer = true;
              } else if (detail.question.correct_answer === optionValue) {
                isCorrectAnswer = true;
              }

              return { isStudentChoice, isCorrectAnswer };
            };

            return (
              <Card 
                key={detail.id} 
                className={cn(
                  "border-none shadow-lg transition-all duration-300 hover:shadow-xl ring-1",
                  isCorrect === true ? "ring-emerald-100 dark:ring-emerald-950/20" : 
                  isCorrect === false ? "ring-rose-100 dark:ring-rose-950/20" : 
                  "ring-slate-100 dark:ring-slate-800"
                )}
              >
                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold">
                          {detail.question.order_number}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold h-6">
                          {isEssay ? "Tự luận" : "Trắc nghiệm"}
                        </Badge>
                        {isCorrect === true && <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none h-6">Đúng</Badge>}
                        {isCorrect === false && <Badge className="bg-rose-500 hover:bg-rose-600 border-none h-6">Sai</Badge>}
                        {isCorrect === null && <Badge className="bg-amber-500 hover:bg-amber-600 border-none h-6">Chờ chấm</Badge>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-sm font-medium text-muted-foreground">Điểm</p>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1 px-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Input 
                          type="number"
                          step="0.1"
                          min="0"
                          max={detail.question.score}
                          className={cn(
                            "w-16 h-8 text-center font-bold border-none focus-visible:ring-0 px-1",
                            (!isEssay || (data.status === "completed" && !isEditing)) && "bg-slate-50 text-slate-500 cursor-not-allowed"
                          )}
                          value={grades[detail.question_id]?.score || 0}
                          disabled={!isEssay || (data.status === "completed" && !isEditing)}
                          onChange={(e) => handleUpdateGrade(detail.question_id, "score", e.target.value)}
                        />
                        <span className="text-slate-400 text-sm">/ {detail.question.score}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Question Content */}
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div 
                      className="text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-200"
                      dangerouslySetInnerHTML={{ __html: detail.question.question }} 
                    />
                  </div>

                  {/* Multiple Choice Options */}
                  {!isEssay && detail.question.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      {detail.question.options.map((option, idx) => {
                        const { isStudentChoice, isCorrectAnswer } = getOptionStatus(option, idx);
                        
                        return (
                          <div 
                            key={idx}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                              isStudentChoice && isCorrectAnswer ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-950/20" : 
                              isStudentChoice && !isCorrectAnswer ? "bg-rose-50 border-rose-500 dark:bg-rose-950/20" :
                              isCorrectAnswer ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-950/20" :
                              "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-bold",
                                isStudentChoice && isCorrectAnswer ? "border-emerald-600 text-emerald-600 bg-white" :
                                isStudentChoice && !isCorrectAnswer ? "border-rose-600 text-rose-600 bg-white" :
                                isCorrectAnswer ? "border-emerald-600 text-emerald-600 bg-white" :
                                "border-slate-300 text-slate-500"
                              )}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className={cn(
                                "text-sm",
                                isStudentChoice && isCorrectAnswer ? "font-bold text-emerald-700 dark:text-emerald-400" :
                                isStudentChoice && !isCorrectAnswer ? "font-bold text-rose-700 dark:text-rose-400" :
                                isCorrectAnswer ? "font-bold text-emerald-700 dark:text-emerald-400" :
                                "text-slate-700 dark:text-slate-300"
                              )}>
                                {option}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Answer */}
                  {isEssay && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                          <MessageSquare className="h-10 w-10" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Câu trả lời của học sinh</p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {detail.answer_content || <span className="italic text-slate-400">Không có câu trả lời</span>}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Teacher Comment Input - Only for Essay */}
                  {isEssay && (
                    <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        <MessageSquare className="h-4 w-4" />
                        Nhận xét của giáo viên
                      </div>
                      <Textarea 
                        placeholder="Nhập nhận xét cho câu trả lời này..."
                        className="min-h-[80px] bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 focus:ring-indigo-500 rounded-xl transition-all"
                        value={grades[detail.question_id]?.comment || ""}
                        disabled={data.status === "completed" && !isEditing}
                        onChange={(e) => handleUpdateGrade(detail.question_id, "comment", e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
