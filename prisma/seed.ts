/**
 * Seed script with Persian sample data.
 * Run with: npm run db:seed
 */
import { PrismaClient, Department, Role } from "@prisma/client";

const db = new PrismaClient();

interface ProfessorSeed {
  email: string;
  name: string;
  department: Department;
  bio: string;
  researchInterests: string[];
  personalLink?: string;
}

const PROFESSORS: ProfessorSeed[] = [
  {
    email: "ahmadi@aut.ac.ir",
    name: "دکتر علی احمدی",
    department: "CS",
    bio: "عضو هیئت علمی دانشکده مهندسی کامپیوتر با بیش از ۱۵ سال سابقه تدریس. تمرکز اصلی ایشان بر طراحی الگوریتم‌های کارآمد و یادگیری ماشین است.",
    researchInterests: ["یادگیری ماشین", "الگوریتم‌ها", "بینایی کامپیوتر"],
    personalLink: "https://ce.aut.ac.ir/~ahmadi",
  },
  {
    email: "rezaei@aut.ac.ir",
    name: "دکتر مریم رضایی",
    department: "MATH",
    bio: "استاد دانشکده ریاضیات و متخصص آنالیز ریاضی. از ایشان به دلیل توضیحات شفاف و رئوس مطالب منظم، بسیار استقبال می‌شود.",
    researchInterests: ["آنالیز حقیقی", "آنالیز تابعی"],
  },
  {
    email: "karimi@aut.ac.ir",
    name: "دکتر حسین کریمی",
    department: "STATS",
    bio: "استادیار گروه آمار با علاقه به آمار استنباطی و تحلیل داده. کلاس‌های ایشان مبتنی بر مثال‌های واقعی صنعت است.",
    researchInterests: ["آمار استنباطی", "تحلیل داده", "سری‌های زمانی"],
  },
  {
    email: "mousavi@aut.ac.ir",
    name: "دکتر زهرا موسوی",
    department: "OR",
    bio: "استاد تحقیق در عملیات با تجربه مشاوره در بهینه‌سازی سیستم‌های حمل‌ونقل و لجستیک.",
    researchInterests: ["بهینه‌سازی خطی", "برنامه‌ریزی عدد صحیح", "زنجیره تأمین"],
  },
  {
    email: "sadeghi@aut.ac.ir",
    name: "دکتر رضا صادقی",
    department: "CS",
    bio: "متخصص مهندسی نرم‌افزار و پایگاه داده. پروژه‌های عملی کلاس‌های ایشان برای ورود به بازار کار بسیار ارزشمند است.",
    researchInterests: ["پایگاه داده", "مهندسی نرم‌افزار", "سیستم‌های توزیع‌شده"],
  },
  {
    email: "nouri@aut.ac.ir",
    name: "دکتر سارا نوری",
    department: "MATH",
    bio: "استاد جبر و نظریه اعداد با رویکرد آموزش مفاهیم پایه از راه حل مسئله.",
    researchInterests: ["جبر مجرد", "نظریه اعداد", "رمزنگاری"],
  },
];

const COURSES = [
  { code: "CS-101", name: "مبانی برنامه‌نویسی", department: "CS" as Department, credits: 3, semester: "پاییز ۱۴۰۴", prof: "ahmadi@aut.ac.ir", description: "آشنایی با مفاهیم پایه برنامه‌نویسی ساخت‌یافته و شیءگرا همراه با تمرین‌های عملی هفتگی." },
  { code: "CS-301", name: "طراحی الگوریتم‌ها", department: "CS" as Department, credits: 3, semester: "پاییز ۱۴۰۴", prof: "ahmadi@aut.ac.ir", description: "طراحی و تحلیل الگوریتم‌ها، پیچیدگی محاسباتی، برنامه‌نویسی پویا و الگوریتم‌های حریصانه." },
  { code: "CS-305", name: "پایگاه داده", department: "CS" as Department, credits: 3, semester: "بهار ۱۴۰۴", prof: "sadeghi@aut.ac.ir", description: "مدل‌سازی داده، جداول نرمال، SQL و تراکنش‌ها همراه با پروژه عملی پایگاه داده." },
  { code: "MATH-201", name: "ریاضی مهندسی", department: "MATH" as Department, credits: 3, semester: "پاییز ۱۴۰۴", prof: "rezaei@aut.ac.ir", description: "تبدیل لاپلاس، سری فوریه، معادلات دیفرانسیل جزئی و کاربردهای مهندسی." },
  { code: "MATH-202", name: "جبر خطی", department: "MATH" as Department, credits: 3, semester: "بهار ۱۴۰۴", prof: "nouri@aut.ac.ir", description: "ماتریس‌ها، فضاهای برداری، مقادیر ویژه و بردارهای ویژه با کاربردها." },
  { code: "STATS-201", name: "آمار و احتمال", department: "STATS" as Department, credits: 3, semester: "پاییز ۱۴۰۴", prof: "karimi@aut.ac.ir", description: "احتمال مقدماتی، متغیرهای تصادفی، توزیع‌ها و آزمون فرض‌های آماری." },
  { code: "OR-301", name: "تحقیق در عملیات", department: "OR" as Department, credits: 3, semester: "پاییز ۱۴۰۴", prof: "mousavi@aut.ac.ir", description: "برنامه‌ریزی خطی، روش سیمپلکس، دوتایی و مدل‌سازی مسائل بهینه‌سازی صنعتی." },
];

const REVIEW_SAMPLES = [
  { rating: 5, difficulty: 2, take: true, anonymous: false, comment: "استاد بی‌نظیری بودند؛ همه مباحث را با مثال‌های ساده توضیح می‌دادند و در جلسات رفع اشکال همیشه پاسخگو بودند. قطعاً باز هم درسی را با ایشان می‌گیرم." },
  { rating: 4, difficulty: 3, take: true, anonymous: true, comment: "کیفیت تدریس خیلی خوب بود و اسلایدها منظم بودند. فقط حجم تمرین‌ها کمی زیاد بود ولی ارزشش را داشت." },
  { rating: 3, difficulty: 4, take: true, anonymous: false, comment: "درس سنگینی بود و امتحان میانترم سخت، اما استاد منصف بود و نمره پایانی با کمک تمرین‌ها قابل جبران بود." },
  { rating: 4, difficulty: 4, take: false, anonymous: false, comment: "محتوای درس عمیق و مفید است اما برای نمره خوب باید مدام مطالعه کنید. طرح سؤالات امتحان کمی غیرمنتظره بود." },
  { rating: 5, difficulty: 1, take: true, anonymous: false, comment: "از بهترین درس‌هایی که گرفتم؛ استاد با حوصله بود، پروژه کاربردی دادیم و یادگیری واقعی اتفاق افتاد." },
  { rating: 2, difficulty: 5, take: false, anonymous: true, comment: "متأسفانه سرعت تدریس خیلی بالا بود و وقت پرسش نداشتیم. برای قبولی باید تمام مطالب را خودمان از منابع دیگر بخوانیم." },
];

async function main() {
  console.log("Seeding database with Persian sample data...");

  // Admin user
  const admin = await db.user.upsert({
    where: { email: "admin@aut.ac.ir" },
    update: {},
    create: {
      email: "admin@aut.ac.ir",
      name: "مدیر سامانه",
      role: Role.ADMIN,
      studentId: null,
      emailVerified: new Date(),
    },
  });

  // Students
  const studentsData = [
    { email: "student1@aut.ac.ir", name: "امیر محمدی", studentId: "401123456" },
    { email: "student2@aut.ac.ir", name: "نیلوفر رستمی", studentId: "401234567" },
    { email: "student3@aut.ac.ir", name: "پارسا کاظمی", studentId: "401345678" },
  ];
  const students = [];
  for (const s of studentsData) {
    const u = await db.user.upsert({
      where: { email: s.email },
      update: {},
      create: { ...s, role: Role.STUDENT, emailVerified: new Date() },
    });
    students.push(u);
  }

  // Professors + profiles
  const professorsByEmail = new Map<string, { userId: string; professorId: string; department: Department }>();
  for (const p of PROFESSORS) {
    const user = await db.user.upsert({
      where: { email: p.email },
      update: { role: Role.PROFESSOR, studentId: null },
      create: { email: p.email, name: p.name, role: Role.PROFESSOR, emailVerified: new Date() },
    });
    const existing = await db.professor.findUnique({ where: { userId: user.id } });
    const professor =
      existing ??
      (await db.professor.create({
        data: {
          userId: user.id,
          department: p.department,
          bio: p.bio,
          researchInterests: p.researchInterests,
          personalLink: p.personalLink,
        },
      }));
    professorsByEmail.set(p.email, { userId: user.id, professorId: professor.id, department: p.department });
  }

  // Courses
  const coursesByCode = new Map<string, string>();
  for (const c of COURSES) {
    const professorId = c.prof ? professorsByEmail.get(c.prof)?.professorId : undefined;
    const course = await db.course.upsert({
      where: { code_semester: { code: c.code, semester: c.semester } },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        department: c.department,
        credits: c.credits,
        semester: c.semester,
        description: c.description,
        professorId,
      },
    });
    coursesByCode.set(c.code, course.id);
  }

  // Reviews distributed across courses/students
  let idx = 0;
  for (const courseEntry of Array.from(coursesByCode.entries())) {
    const [code, courseId] = courseEntry;
    const course = COURSES.find((c) => c.code === code)!;
    const professorId = professorsByEmail.get(course.prof)?.professorId;
    if (!professorId) continue;
    for (let i = 0; i < 2; i++) {
      const s = REVIEW_SAMPLES[(idx + i) % REVIEW_SAMPLES.length];
      const student = students[(idx + i) % students.length];
      try {
        await db.review.create({
          data: {
            studentId: student.id,
            courseId,
            professorId,
            rating: s.rating,
            difficulty: s.difficulty,
            wouldTakeAgain: s.take,
            comment: s.comment,
            anonymous: s.anonymous,
          },
        });
      } catch {
        // Unique constraint hit — skip duplicates on re-seed
      }
      idx++;
    }
  }

  // A few likes and a pending report for the admin panel demo
  const firstReview = await db.review.findFirst({ orderBy: { createdAt: "asc" } });
  if (firstReview) {
    for (const st of students.slice(0, 2)) {
      await db.like.upsert({
        where: { reviewId_userId: { reviewId: firstReview.id, userId: st.id } },
        update: {},
        create: { reviewId: firstReview.id, userId: st.id },
      });
    }
    const alreadyReported = await db.report.findFirst({ where: { reviewId: firstReview.id } });
    if (!alreadyReported) {
      await db.report.create({
        data: {
          reviewId: firstReview.id,
          userId: students[0].id,
          reason: "INACCURATE",
          description: "اطلاعات این نظر درباره سطح دشواری درس با تجربه بنده متفاوت است.",
        },
      });
    }
  }

  // Recompute all aggregates
  const professorsList = await db.professor.findMany({ select: { id: true } });
  for (const p of professorsList) {
    const [agg] = await Promise.all([
      db.review.aggregate({
        where: { professorId: p.id },
        _avg: { rating: true, difficulty: true },
        _count: { _all: true },
      }),
    ]);
    const totalLikes = await db.like.count({ where: { review: { professorId: p.id } } });
    const avgRating = agg._avg.rating ?? 0;
    const avgDifficulty = agg._avg.difficulty ?? 0;
    const totalReviews = agg._count._all;
    await db.professorAggregate.upsert({
      where: { professorId: p.id },
      update: { avgRating, avgDifficulty, totalReviews, totalLikes },
      create: { professorId: p.id, avgRating, avgDifficulty, totalReviews, totalLikes },
    });
  }

  console.log("Seed complete.");
  console.log("- Admin login: admin@aut.ac.ir");
  console.log("- Student logins: student1@aut.ac.ir, student2@aut.ac.ir, student3@aut.ac.ir");
  console.log("- Professor logins: ahmadi@aut.ac.ir, rezaei@aut.ac.ir, ...");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
