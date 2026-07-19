import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, TextInput, Alert, Modal } from 'react-native';
import { Text, Title, Card, Button, Snackbar } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { THEME_COLORS } from '../../constants';
import { getStudentSession, getLecturesByCourse } from '../../services/student.service';
import { getDatabase } from '../../services/token.service';

// Custom SVG Icons
const BookOpenIcon = ({ color = '#64748b', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
);

const ClockIcon = ({ color = '#64748b', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const CodeIcon = ({ color = '#64748b', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m18 16 4-4-4-4" />
    <Path d="m6 8-4 4 4 4" />
    <Path d="m14.5 4-5 16" />
  </Svg>
);

const VideoIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m22 8-6 4 6 4V8Z" />
    <Rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </Svg>
);

const LockIcon = ({ color = '#64748b', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const DownloadIcon = ({ color = '#2563eb', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" x2="12" y1="15" y2="3" />
  </Svg>
);

const PlayCircleIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="m10 8 6 4-6 4V8Z" fill={color} />
  </Svg>
);

const SendIcon = ({ color = '#ffffff', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);

const ChevronUpIcon = ({ color = '#94a3b8', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m18 15-6-6-6 6" />
  </Svg>
);

const ChevronDownIcon = ({ color = '#94a3b8', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

const CheckIcon = ({ color = '#10b981', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const ModuleIcon = ({ color = '#64748b', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </Svg>
);

const FileTextIcon = ({ color = '#64748b', size = 12 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <Path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <Path d="M10 9H8" />
    <Path d="M16 13H8" />
    <Path d="M16 17H8" />
  </Svg>
);

const CloseIcon = ({ color = '#ffffff', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

export default function StudentClassScreen() {
  const isFocused = useIsFocused();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('syllabus'); // 'syllabus' | 'logs' | 'tasks'
  const [dbLectures, setDbLectures] = useState<any[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  // Accordion state
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Task submission states
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Video player modal states
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>('Class Recording');


  // 1. DYNAMIC COURSE SYLLABUS DATA GENERATION (Parity with web frontend)
  const getCourseData = (courseName: string) => {
    const cleanName = (courseName || '').toLowerCase();
    
    if (cleanName.includes('data science') || cleanName.includes('machine learning') || cleanName.includes('python')) {
      return {
        title: "Data Science & Machine Learning (Python)",
        instructor: "Rajpal",
        instructorTitle: "Senior AI & Data Architect",
        meetLink: "https://meet.google.com/abc-defg-hij",
        timing: "07:00 PM - 08:30 PM (Mon to Fri)",
        totalClasses: 60,
        topics: [
          { day: 1, module: "Module 1: Python Core Foundations", title: "Introduction to Data Science & Environment Setup", desc: "Data Science roadmap, Anaconda installation, Jupyter Notebook & Google Colab essentials.", status: "completed", date: "01/07/2026", duration: "1.5 Hours", resources: ["Jupyter Basics.pdf", "Setup_Instructions.md"] },
          { day: 2, module: "Module 1: Python Core Foundations", title: "Variables, Operators & String Operations", desc: "Python dynamic typing, mathematical operators, string slicing, and formatting.", status: "completed", date: "02/07/2026", duration: "1.5 Hours", resources: ["Variables_Lab.ipynb"] },
          { day: 3, module: "Module 1: Python Core Foundations", title: "Control Structures: Conditionals & Iterations", desc: "Boolean logic, if-elif-else statements, nested loops, break, continue, and loop optimization.", status: "completed", date: "03/07/2026", duration: "1.5 Hours", resources: ["Loops_Practice.ipynb"] },
          { day: 4, module: "Module 1: Python Core Foundations", title: "Python Collections: Lists, Tuples & Dictionaries", desc: "List comprehensions, dictionary operations, sets, mutability, and tuple unpacking.", status: "inprogress", date: "04/07/2026", duration: "1.5 Hours", resources: ["Collections_Wrangling.ipynb"] },
          { day: 5, module: "Module 1: Python Core Foundations", title: "Functions, Scope & Lambda Expressions", desc: "Defining modular code, positional/keyword arguments, global vs local variables, anonymous functions.", status: "upcoming", date: "06/07/2026", duration: "1.5 Hours", resources: ["Functional_Programming.pdf"] },
          { day: 6, module: "Module 1: Python Core Foundations", title: "Object-Oriented Programming (OOP) in Python", desc: "Classes, objects, constructor methods, inheritance, polymorphism, and encapsulation.", status: "upcoming", date: "07/07/2026", duration: "1.5 Hours", resources: ["OOP_Concepts.pdf"] },
          { day: 7, module: "Module 2: Data Analysis & Visualization", title: "NumPy Basics: Vectorized Arrays & Indexing", desc: "Multi-dimensional arrays, math methods, broad-casting, and array masks.", status: "upcoming", date: "08/07/2026", duration: "1.5 Hours", resources: ["NumPy_Exercises.ipynb"] },
          { day: 8, module: "Module 2: Data Analysis & Visualization", title: "Pandas DataFrames: Operations & Indexing", desc: "Reading CSV/Excel, indexing, conditional selection, column operations, and descriptive stats.", status: "upcoming", date: "09/07/2026", duration: "1.5 Hours", resources: ["Pandas_DF_Basics.ipynb"] },
          { day: 9, module: "Module 2: Data Analysis & Visualization", title: "Data Cleaning: Missing Values & Outliers", desc: "Handling nulls (dropna, fillna), handling duplicates, type casting, and filtering outliers.", status: "upcoming", date: "10/07/2026", duration: "1.5 Hours", resources: ["Data_Cleaning.ipynb"] },
          { day: 10, module: "Module 2: Data Analysis & Visualization", title: "Data Visualization with Matplotlib & Seaborn", desc: "Creating line plots, scatter plots, bar charts, heatmaps, pairplots, and customizing styles.", status: "upcoming", date: "13/07/2026", duration: "1.5 Hours", resources: ["Data_Visualization.ipynb"] },
          { day: 11, module: "Module 3: Machine Learning Foundations", title: "Exploratory Data Analysis (EDA) on Real Datasets", desc: "Performing statistical and visual check-ups on real-world business datasets to find patterns.", status: "upcoming", date: "14/07/2026", duration: "1.5 Hours", resources: ["EDA_Project.ipynb"] },
          { day: 12, module: "Module 3: Machine Learning Foundations", title: "Linear Regression: Theory & Implementation", desc: "Understanding gradient descent, cost functions, fitting models, and R-squared evaluation.", status: "upcoming", date: "15/07/2026", duration: "1.5 Hours", resources: ["Linear_Regression.ipynb"] },
          { day: 13, module: "Module 3: Machine Learning Foundations", title: "Logistic Regression & Classification Metrics", desc: "Sigmoid function, binary classification, confusion matrix, precision, recall, and ROC-AUC curve.", status: "upcoming", date: "16/07/2026", duration: "1.5 Hours", resources: ["Classification_Lab.ipynb"] },
          { day: 14, module: "Module 3: Machine Learning Foundations", title: "Tree-Based Models: Decision Trees & Random Forests", desc: "Entropy, Information Gain, Gini index, ensemble learning, and hyperparameter tuning.", status: "upcoming", date: "17/07/2026", duration: "1.5 Hours", resources: ["Ensemble_Methods.pdf"] },
          { day: 15, module: "Module 4: Advanced ML & Deployments", title: "Machine Learning Capstone Project & Model Deployment", desc: "Building a complete predictive model, serializing it with pickle, and creating a basic Flask/Streamlit UI.", status: "upcoming", date: "20/07/2026", duration: "2 Hours", resources: ["Capstone_Requirements.pdf"] }
        ],
        tasks: [
          { id: "DS-TASK-01", day: 1, title: "Jupyter & Colab Setup", desc: "Setup Python Anaconda environment locally, create a new notebook, write a markdown summary and print standard system specs.", deadline: "03/07/2026", status: "completed", submission: "https://github.com/student/ds-setup", score: "10/10", remarks: "Great setup, all libs configured!" },
          { id: "DS-TASK-02", day: 2, title: "Operators & Expressions Lab", desc: "Create variables for basic math calculations (Celsius to Fahrenheit, Simple Interest, BMI Calculator) and print formatted outputs.", deadline: "04/07/2026", status: "completed", submission: "https://github.com/student/operators-lab", score: "9/10", remarks: "Good calculations. Formatting is clean." },
          { id: "DS-TASK-03", day: 3, title: "Conditionals & Loops Quiz", desc: "Write programs to print Fibonacci sequence, check prime numbers, and build a simple command-line game using loops.", deadline: "06/07/2026", status: "assigned", submission: null, score: null, remarks: null },
          { id: "DS-TASK-04", day: 4, title: "Data Wrangling with Collections", desc: "Filter lists using comprehensions, merge dictionaries, and calculate frequency count of characters in a string.", deadline: "08/07/2026", status: "assigned", submission: null, score: null, remarks: null },
          { id: "DS-TASK-05", day: 5, title: "Modular Calculator Functions", desc: "Create a calculator that takes user input, calls appropriate functions, and manages state using recursion.", deadline: "10/07/2026", status: "locked", submission: null, score: null, remarks: null },
          { id: "DS-TASK-06", day: 8, title: "Pandas DataFrame Analytics", desc: "Analyze employee dataset using Pandas: load data, calculate average salary per department, and filter records.", deadline: "15/07/2026", status: "locked", submission: null, score: null, remarks: null }
        ],
        logs: [
          { date: "01/07/2026", topic: "Intro to Python & Setup", attendance: "present", recording: "https://zoom.us/rec/play/111", notes: "Reviewed environment variables, path setup, and virtual environments." },
          { date: "02/07/2026", topic: "Data Types & Operations", attendance: "present", recording: "https://zoom.us/rec/play/222", notes: "Covered mutable vs immutable types, string methods, format strings." },
          { date: "03/07/2026", topic: "Control Flows & Loop Logic", attendance: "present", recording: "https://zoom.us/rec/play/333", notes: "Practiced for-loops, while-loops, nesting, and infinite loop protection." }
        ]
      };
    } else if (cleanName.includes('design') || cleanName.includes('graphic') || cleanName.includes('ui/ux')) {
      return {
        title: "Graphic Design (Aesthetics & Elements)",
        instructor: "Bharat Bhushan",
        instructorTitle: "Lead Creative Designer",
        meetLink: "https://meet.google.com/xyz-pdqr-lmn",
        timing: "05:00 PM - 06:30 PM (Mon to Fri)",
        totalClasses: 45,
        topics: [
          { day: 1, module: "Module 1: Visual Design Principles", title: "Introduction to Color Theory & Contrast", desc: "Understanding the color wheel, RGB vs CMYK, warm vs cool colors, and using contrast to establish visual hierarchy.", status: "completed", date: "01/07/2026", duration: "1.5 Hours", resources: ["Color_Theory_Guide.pdf"] },
          { day: 2, module: "Module 1: Visual Design Principles", title: "Typography & Font Hierarchies", desc: "Serif, Sans-serif, Script fonts, tracking, kerning, leading, and pairing fonts professionally.", status: "completed", date: "02/07/2026", duration: "1.5 Hours", resources: ["Font_Pairing_Chart.pdf"] },
          { day: 3, module: "Module 1: Visual Design Principles", title: "Layout Rules: Grid Systems & Alignment", desc: "Rule of thirds, golden ratio, structural margins, and aligning elements to form grids.", status: "completed", date: "03/07/2026", duration: "1.5 Hours", resources: ["Grid_Layouts.pdf"] },
          { day: 4, module: "Module 2: Adobe Illustrator Suite", title: "Vector Design: Pen Tool & Anchor Nodes", desc: "Mastering the pen tool, path editing, shape transformations, and anchor point operations.", status: "inprogress", date: "04/07/2026", duration: "1.5 Hours", resources: ["Pen_Tool_Tricks.ai"] },
          { day: 5, module: "Module 2: Adobe Illustrator Suite", title: "Branding, Logo Design & Iconography", desc: "Creating minimalist logos, brand guidelines, exporting SVG assets, and custom icon design.", status: "upcoming", date: "06/07/2026", duration: "1.5 Hours", resources: ["Branding_Workbook.pdf"] }
        ],
        tasks: [
          { id: "GD-TASK-01", day: 1, title: "Contrast & Color Palette Design", desc: "Create a mood board and construct three distinct color palettes (Monochromatic, Analogous, Complementary) for a travel application.", deadline: "03/07/2026", status: "completed", submission: "https://drive.google.com/file/1", score: "9.5/10", remarks: "Very nice color choices! Complementary contrast is excellent." },
          { id: "GD-TASK-02", day: 2, title: "Typography & Poster Layout", desc: "Design a flyer using maximum two font families, demonstrating clear font hierarchy (heading, subhead, body) and whitespace distribution.", deadline: "04/07/2026", status: "completed", submission: "https://drive.google.com/file/2", score: "9/10", remarks: "Great alignment. Title stands out well." },
          { id: "GD-TASK-03", day: 3, title: "Pen Tool Art Creation", desc: "Trace complex vector shapes (like animal profiles or customized characters) using the Pen Tool in Illustrator.", deadline: "06/07/2026", status: "assigned", submission: null, score: null, remarks: null },
          { id: "GD-TASK-04", day: 4, title: "Corporate Logo Design", desc: "Create a vector logo for a tech company called 'AeroCloud'. Deliver final SVG vector outline.", deadline: "08/07/2026", status: "assigned", submission: null, score: null, remarks: null }
        ],
        logs: [
          { date: "01/07/2026", topic: "Intro to Design & Colors", attendance: "present", recording: "https://zoom.us/rec/play/gd1", notes: "Reviewed visual communication concepts and color mood boards." },
          { date: "02/07/2026", topic: "Font selection & Typography", attendance: "present", recording: "https://zoom.us/rec/play/gd2", notes: "Discussed typography hierarchy, kerning exercises." },
          { date: "03/07/2026", topic: "Grid Systems & Canvas layout", attendance: "present", recording: "https://zoom.us/rec/play/gd3", notes: "Hands-on alignment, spacing rules, and margins study." }
        ]
      };
    } else {
      // Fallback Full Stack MERN / Web Development
      return {
        title: courseName || "Full Stack Web Development",
        instructor: "Bharat Bhushan",
        instructorTitle: "Chief Software Architect",
        meetLink: "https://meet.google.com/def-ghij-klm",
        timing: "06:00 PM - 07:30 PM (Mon to Fri)",
        totalClasses: 50,
        topics: [
          { day: 1, module: "Module 1: Frontend Basics", title: "HTML5 Semantic Tags & Clean Structuring", desc: "Creating standard document hierarchies, structural elements, accessibility tags, and SEO headers.", status: "completed", date: "01/07/2026", duration: "1.5 Hours", resources: ["HTML_Basics.pdf"] },
          { day: 2, module: "Module 1: Frontend Basics", title: "CSS Flexbox & Responsive Layouts", desc: "Main axis and cross axis alignment, flex property, media queries, and mobile-first responsive screens.", status: "completed", date: "02/07/2026", duration: "1.5 Hours", resources: ["Flexbox_Visual_Guide.pdf"] },
          { day: 3, module: "Module 1: Frontend Basics", title: "CSS Grid & Advanced Layout Systems", desc: "Designing complex grid layouts, grid templates, auto-fit, auto-fill, and alignment utilities.", status: "completed", date: "03/07/2026", duration: "1.5 Hours", resources: ["CSS_Grid.pdf"] },
          { day: 4, module: "Module 2: Client-side Scripting", title: "JavaScript Core: Variables, Scope & DOM API", desc: "Var/let/const scope boundaries, selectors, event listeners, dynamic style updates, and form submissions.", status: "inprogress", date: "04/07/2026", duration: "1.5 Hours", resources: ["JS_DOM.js"] },
          { day: 5, module: "Module 2: Client-side Scripting", title: "JavaScript Advanced: Async/Await & Promises", desc: "Asynchronous functions, callbacks, fetch API integration, REST client requests, and error containment.", status: "upcoming", date: "06/07/2026", duration: "1.5 Hours", resources: ["Async_Programming.js"] }
        ],
        tasks: [
          { id: "WD-TASK-01", day: 1, title: "Semantic Resume Portfolio HTML", desc: "Create a fully semantic HTML-only portfolio summary page. Do not use CSS styles; focus on structural headings, tables, list arrays.", deadline: "03/07/2026", status: "completed", submission: "https://github.com/student/resume-html", score: "10/10", remarks: "Superb structure! Semantics are perfectly aligned." },
          { id: "WD-TASK-02", day: 2, title: "Responsive Product Pricing Cards", desc: "Build a responsive pricing layout with three tiers using CSS Flexbox. Responsive at mobile, tablet, and desktop viewports.", deadline: "04/07/2026", status: "completed", submission: "https://github.com/student/pricing-cards", score: "9.5/10", remarks: "Very nice layout. Transitions are smooth." },
          { id: "WD-TASK-03", day: 3, title: "Grid Image Gallery Layout", desc: "Create an image gallery layout using CSS Grid with masonry effects and hover zoom scales.", deadline: "06/07/2026", status: "assigned", submission: null, score: null, remarks: null },
          { id: "WD-TASK-04", day: 4, title: "Dynamic Task Manager DOM Script", desc: "Build a simple to-do app in vanilla JS: dynamic list item additions, edit toggles, item deletion, and filter capabilities.", deadline: "08/07/2026", status: "assigned", submission: null, score: null, remarks: null }
        ],
        logs: [
          { date: "01/07/2026", topic: "Semantic HTML Elements", attendance: "present", recording: "https://zoom.us/rec/play/wd1", notes: "Reviewed block/inline tags, lists, semantics." },
          { date: "02/07/2026", topic: "Flexbox Layout Mechanics", attendance: "present", recording: "https://zoom.us/rec/play/wd2", notes: "Worked on nested flexboxes, margins auto, flex-wrap configurations." },
          { date: "03/07/2026", topic: "Responsive CSS Grid", attendance: "present", recording: "https://zoom.us/rec/play/wd3", notes: "Designed complex card grids, gap spacings, minmax properties." }
        ]
      };
    }
  };

  const courseData = useMemo(() => {
    if (!student) return null;
    return getCourseData(student.courseType || student.department);
  }, [student]);

  // Combine and merge local tasks storage
  const loadSession = async () => {
    try {
      const session = await getStudentSession();
      if (session.user) {
        setStudent(session.user);
        const name = session.user.courseType || session.user.department;
        loadLectures(name);

        const activeCourse = getCourseData(name);
        const db = await getDatabase();
        const savedTasks = await db.getItem(`student_tasks_${session.user.id}`);
        if (savedTasks) {
          const parsed = JSON.parse(savedTasks);
          const merged = activeCourse.tasks.map((t: any) => {
            const saved = parsed.find((s: any) => s.id === t.id);
            return saved ? { ...t, ...saved } : t;
          });
          setLocalTasks(merged);
        } else {
          setLocalTasks(activeCourse.tasks);
        }

        // Expand first module by default
        if (activeCourse.topics.length > 0) {
          const firstMod = activeCourse.topics[0].module;
          setExpandedModules({ [firstMod]: true });
        }
      }
    } catch (e) {
      console.error('Error loading session in My Class:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLectures = async (courseName: string) => {
    if (!courseName) return;
    setLoadingLectures(true);
    try {
      const res = await getLecturesByCourse(courseName);
      if (res && res.success && res.data) {
        setDbLectures(res.data);
      }
    } catch (err) {
      console.error('Error loading lectures:', err);
    } finally {
      setLoadingLectures(false);
    }
  };

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleWatchRecording = (url: string, topicName: string) => {
    const videoId = getYoutubeVideoId(url);
    if (videoId) {
      setSelectedVideoUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`);
      setSelectedVideoTitle(topicName);
    } else {
      Linking.openURL(url).catch(err => {
        console.error("Couldn't open link:", err);
        Alert.alert("Link Error", "Could not open this recording URL.");
      });
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadSession();
    }
  }, [isFocused]);

  // Merge logs
  const displayLogs = useMemo(() => {
    if (!courseData) return [];
    if (dbLectures && dbLectures.length > 0) {
      return dbLectures.map((lecture: any) => ({
        date: lecture.lectureDate || 'N/A',
        topic: lecture.topic || 'No Topic',
        attendance: "conducted",
        recording: lecture.youtubeLink || lecture.googleDriveLink || null,
        notes: lecture.notes || "No extra notes"
      }));
    }
    return courseData.logs.map((log: any) => ({
      ...log,
      attendance: "conducted"
    }));
  }, [dbLectures, courseData]);

  // Syllabus completed progress
  const progressInfo = useMemo(() => {
    if (!courseData) return { completed: 0, total: 0, percent: 0 };
    const completed = courseData.topics.filter((t: any) => t.status === 'completed').length;
    const total = courseData.topics.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [courseData]);

  // Accordion syllabus modules grouping
  const syllabusModules = useMemo(() => {
    if (!courseData) return {};
    return courseData.topics.reduce((acc: any, topic: any) => {
      if (!acc[topic.module]) acc[topic.module] = [];
      acc[topic.module].push(topic);
      return acc;
    }, {});
  }, [courseData]);

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const handleOpenLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(err => console.error("Couldn't open link:", err));
  };

  const handleTaskSubmit = async (taskId: string) => {
    if (!submissionUrl.trim()) {
      setSnackbarMessage('Submission URL is required.');
      return;
    }

    const updatedTasks = localTasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'submitted',
          submission: submissionUrl.trim(),
          remarks: submissionRemarks.trim() || 'Awaiting instructor review',
        };
      }
      return t;
    });

    setLocalTasks(updatedTasks);

    try {
      const db = await getDatabase();
      await db.setItem(`student_tasks_${student.id}`, JSON.stringify(updatedTasks));
      setSnackbarMessage('Assignment submitted successfully!');
    } catch (err) {
      console.error('Error saving tasks to AsyncStorage:', err);
      setSnackbarMessage('Submitted, but failed to save permanently.');
    }

    setSubmittingTaskId(null);
    setSubmissionUrl('');
    setSubmissionRemarks('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainScroll} keyboardShouldPersistTaps="handled">
        {/* Dark Premium Classroom Dashboard Header */}
        {courseData && (
          <Card style={styles.classHeaderCard}>
            <Card.Content style={styles.classHeaderContent}>
              <View style={styles.badgeRow}>
                <Text style={styles.enrollmentBadge}>ACTIVE ENROLLMENT</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              
              <Title style={styles.classTitle}>{courseData.title}</Title>
              
              <Text style={styles.instructorText}>
                👨‍🏫 Instructor: <Text style={styles.boldText}>{courseData.instructor}</Text> ({courseData.instructorTitle})
              </Text>
              <Text style={styles.timingText}>🕒 Schedules: {courseData.timing}</Text>

              {/* Progress Card */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Syllabus Completion</Text>
                  <Text style={styles.progressPercent}>{progressInfo.percent}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressInfo.percent}%` }]} />
                </View>
                <Text style={styles.progressSubtext}>{progressInfo.completed} of {progressInfo.total} topics covered</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenLink(courseData.meetLink)}
                activeOpacity={0.8}
                style={styles.meetBtn}
              >
                <VideoIcon color="#110909" size={16} />
                <Text style={styles.meetBtnText}>Join Live Class</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        {/* Premium Underlined Tab Switcher with SVGs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('syllabus')}
            activeOpacity={0.7}
            style={[styles.tabButton, activeTab === 'syllabus' && styles.tabButtonActive]}
          >
            <BookOpenIcon color={activeTab === 'syllabus' ? THEME_COLORS.primary : '#64748b'} size={18} />
            <Text style={[styles.tabLabel, activeTab === 'syllabus' && styles.tabLabelActive]}>Syllabus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('logs')}
            activeOpacity={0.7}
            style={[styles.tabButton, activeTab === 'logs' && styles.tabButtonActive]}
          >
            <ClockIcon color={activeTab === 'logs' ? THEME_COLORS.primary : '#64748b'} size={18} />
            <Text style={[styles.tabLabel, activeTab === 'logs' && styles.tabLabelActive]}>Class Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('tasks')}
            activeOpacity={0.7}
            style={[styles.tabButton, activeTab === 'tasks' && styles.tabButtonActive]}
          >
            <CodeIcon color={activeTab === 'tasks' ? THEME_COLORS.primary : '#64748b'} size={18} />
            <Text style={[styles.tabLabel, activeTab === 'tasks' && styles.tabLabelActive]}>Tasks</Text>
            {localTasks.filter(t => t.status === 'assigned').length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{localTasks.filter(t => t.status === 'assigned').length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* TAB CONTENTS */}
        {activeTab === 'syllabus' && courseData && (
          <View style={styles.tabContentContainer}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                💡 <Text style={styles.boldText}>Syllabus Overview:</Text> Daily topics are unlocked dynamically as class schedules progress. Expand a Module below to view days and resources.
              </Text>
            </View>

            {Object.entries(syllabusModules).map(([moduleName, topics]: [string, any]) => {
              const isExpanded = !!expandedModules[moduleName];
              const total = topics.length;
              const completed = topics.filter((t: any) => t.status === 'completed').length;
              const inProgress = topics.some((t: any) => t.status === 'inprogress');

              return (
                <View key={moduleName} style={styles.moduleCard}>
                  {/* Module Accordion Header */}
                  <TouchableOpacity
                    onPress={() => toggleModule(moduleName)}
                    activeOpacity={0.7}
                    style={styles.moduleHeader}
                  >
                    <View style={styles.moduleHeaderLeft}>
                      <View style={[
                        styles.moduleIconContainer,
                        completed === total ? styles.iconCompleted : inProgress ? styles.iconInProgress : styles.iconUpcoming
                      ]}>
                        <ModuleIcon color={completed === total ? '#10b981' : inProgress ? '#3b82f6' : '#64748b'} size={18} />
                      </View>
                      <View style={styles.moduleHeaderTextWrap}>
                        <Text style={styles.moduleTitle}>{moduleName}</Text>
                        <Text style={styles.moduleSub}>
                          {total} Days  •  <Text style={completed === total ? styles.greenText : styles.blueText}>{completed} of {total} Completed</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chevronWrap}>
                      {isExpanded ? <ChevronUpIcon color="#94a3b8" size={16} /> : <ChevronDownIcon color="#94a3b8" size={16} />}
                    </View>
                  </TouchableOpacity>

                  {/* Module Topics List */}
                  {isExpanded && (
                    <View style={styles.moduleContent}>
                      {topics.map((topic: any) => {
                        const isCompleted = topic.status === 'completed';
                        const isInProgress = topic.status === 'inprogress';
                        return (
                          <View key={topic.day} style={styles.topicTimelineRow}>
                            {/* Day circle indicator on left */}
                            <View style={styles.timelineLeftColumn}>
                              <View style={[
                                styles.dayCircle,
                                isCompleted ? styles.circleCompleted : isInProgress ? styles.circleInProgress : styles.circleUpcoming
                              ]}>
                                {isCompleted ? (
                                  <CheckIcon color="#10b981" size={18} />
                                ) : (
                                  <>
                                    <Text style={styles.dayLabel}>Day</Text>
                                    <Text style={styles.dayNum}>{topic.day}</Text>
                                  </>
                                )}
                              </View>
                              <View style={styles.timelineLine} />
                            </View>

                            {/* Topic content card */}
                            <View style={[
                              styles.topicContentCard,
                              isCompleted ? styles.cardCompleted : isInProgress ? styles.cardInProgress : styles.cardUpcoming
                            ]}>
                              <Text style={styles.topicDateMeta}>📅 {topic.date}  •  🕒 {topic.duration}</Text>
                              <Text style={styles.topicTitle}>{topic.title}</Text>
                              <Text style={styles.topicDesc}>{topic.desc}</Text>

                              {isCompleted && topic.resources && topic.resources.length > 0 && (
                                <View style={styles.resourcesSection}>
                                  <View style={styles.resourcesHeaderRow}>
                                    <FileTextIcon color="#64748b" size={12} />
                                    <Text style={styles.resourcesHeader}>Class Materials:</Text>
                                  </View>
                                  {topic.resources.map((res: string, rIdx: number) => (
                                    <TouchableOpacity
                                      key={rIdx}
                                      onPress={() => Alert.alert('Download', `Downloading ${res} to your device.`)}
                                      style={styles.resourceBtn}
                                    >
                                      <View style={styles.resourceBtnContent}>
                                        <DownloadIcon color="#2563eb" size={12} />
                                        <Text style={styles.resourceBtnText}>{res}</Text>
                                      </View>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}

                              {isInProgress && (
                                <View style={styles.inprogressAlert}>
                                  <View style={styles.alertPingDot} />
                                  <Text style={styles.inprogressAlertText}>Class scheduled for today. Make sure to download materials.</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'logs' && (
          <View style={styles.tabContentContainer}>
            {loadingLectures ? (
              <ActivityIndicator size="small" color={THEME_COLORS.primary} style={{ marginTop: 20 }} />
            ) : displayLogs.length === 0 ? (
              <Text style={styles.emptyText}>No conducted lectures logged yet.</Text>
            ) : (
              displayLogs.map((lecture, idx) => (
                <Card key={idx} style={styles.card} mode="outlined">
                  <Card.Content>
                    <View style={styles.lectureHeader}>
                      <Text style={styles.lectureDate}>{lecture.date}</Text>
                      <View style={styles.conductedBadge}>
                        <Text style={styles.conductedBadgeText}>conducted</Text>
                      </View>
                    </View>
                    <Title style={styles.lectureTopic}>{lecture.topic}</Title>
                    <Text style={styles.lectureNotes}>{lecture.notes}</Text>

                    {lecture.recording && (
                      <TouchableOpacity
                        onPress={() => handleWatchRecording(lecture.recording, lecture.topic)}
                        activeOpacity={0.8}
                        style={styles.watchBtn}
                      >
                        <PlayCircleIcon color="#ffffff" size={16} />
                        <Text style={styles.watchBtnText}>Watch Recording</Text>
                      </TouchableOpacity>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'tasks' && (
          <View style={styles.tabContentContainer}>
            {localTasks.length === 0 ? (
              <Text style={styles.emptyText}>No task assignments found.</Text>
            ) : (
              localTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isSubmitted = task.status === 'submitted';
                const isAssigned = task.status === 'assigned';
                const isLocked = task.status === 'locked';
                const isSubmitting = submittingTaskId === task.id;

                return (
                  <Card key={task.id} style={styles.card} mode="outlined">
                    <Card.Content>
                      <View style={styles.lectureHeader}>
                        <Text style={styles.taskCode}>{task.id}</Text>
                        <View style={[
                          styles.taskBadge,
                          {
                            backgroundColor:
                              isCompleted ? '#f0fdf4' :
                              isSubmitted ? '#eff6ff' :
                              isAssigned ? '#fffbeb' : '#f1f5f9'
                          }
                        ]}>
                          <Text style={[
                            styles.taskBadgeText,
                            {
                              color:
                                isCompleted ? '#16a34a' :
                                isSubmitted ? '#2563eb' :
                                isAssigned ? '#d97706' : '#64748b'
                            }
                          ]}>
                            {isCompleted ? 'APPROVED' : isSubmitted ? 'PENDING REVIEW' : isAssigned ? 'ASSIGNED' : 'LOCKED'}
                          </Text>
                        </View>
                      </View>

                      <Title style={styles.taskTitle}>{task.title}</Title>
                      <Text style={styles.taskDesc}>{task.desc}</Text>
                      
                      <View style={styles.taskDeadlineRow}>
                        <Text style={styles.deadlineLabel}>Deadline: </Text>
                        <Text style={[styles.taskDeadline, isAssigned && styles.redText]}>{task.deadline}</Text>
                      </View>

                      {isCompleted && (
                        <View style={styles.scoreRow}>
                          <Text style={styles.scoreText}>Grade Score: {task.score}</Text>
                          {task.submission && (
                            <TouchableOpacity onPress={() => handleOpenLink(task.submission)} style={styles.viewLinkRow}>
                              <Text style={styles.viewLinkText}>🔗 View Submission Link</Text>
                            </TouchableOpacity>
                          )}
                          {task.remarks && (
                            <Text style={styles.remarksText}>💡 Instructor Feed: {task.remarks}</Text>
                          )}
                        </View>
                      )}

                      {isSubmitted && (
                        <View style={styles.submittedBox}>
                          <TouchableOpacity onPress={() => handleOpenLink(task.submission)} style={styles.viewLinkRow}>
                            <Text style={styles.viewLinkText}>🔗 View My Link</Text>
                          </TouchableOpacity>
                          <Text style={styles.submittedRemarks}>Submitted tasks take up to 24 hours for evaluation by instructor.</Text>
                        </View>
                      )}

                      {isAssigned && !isSubmitting && (
                        <TouchableOpacity
                          onPress={() => setSubmittingTaskId(task.id)}
                          activeOpacity={0.8}
                          style={styles.submitActionBtn}
                        >
                          <SendIcon color="#ffffff" size={16} />
                          <Text style={styles.submitActionBtnText}>Submit Assignment</Text>
                        </TouchableOpacity>
                      )}

                      {isLocked && (
                        <View style={styles.lockedRow}>
                          <LockIcon color="#64748b" size={14} />
                          <Text style={styles.lockedText}>Complete previous days to unlock</Text>
                        </View>
                      )}

                      {isSubmitting && (
                        <View style={styles.submissionForm}>
                          <TextInput
                            placeholder="Submission Link (GitHub / Drive URL)"
                            placeholderTextColor="#94a3b8"
                            value={submissionUrl}
                            onChangeText={setSubmissionUrl}
                            style={styles.subInput}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          <TextInput
                            placeholder="Notes or Remarks for the Instructor (Optional)"
                            placeholderTextColor="#94a3b8"
                            value={submissionRemarks}
                            onChangeText={setSubmissionRemarks}
                            style={styles.subInput}
                            multiline
                            numberOfLines={3}
                          />
                          <View style={styles.subActions}>
                            <Button mode="outlined" onPress={() => setSubmittingTaskId(null)} style={styles.subHalfBtn} textColor="#64748b">
                              Cancel
                            </Button>
                            <Button mode="contained" onPress={() => handleTaskSubmit(task.id)} style={styles.subHalfBtn} buttonColor={THEME_COLORS.primary}>
                              Upload
                            </Button>
                          </View>
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <Snackbar
        visible={snackbarMessage !== null}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      <Modal
        visible={selectedVideoUrl !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVideoUrl(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedVideoTitle}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedVideoUrl(null)}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <CloseIcon color="#ffffff" size={18} />
            </TouchableOpacity>
          </View>
          <View style={styles.videoPlayerContainer}>
            {selectedVideoUrl && (
              <WebView
                source={{ uri: selectedVideoUrl }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <ActivityIndicator
                    size="large"
                    color={THEME_COLORS.primary}
                    style={styles.videoLoader}
                  />
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  mainScroll: {
    paddingBottom: 40,
  },
  classHeaderCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  classHeaderContent: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enrollmentBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93c5fd',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  liveDot: {
    width: 6,
    height: 6,
    backgroundColor: '#ef4444',
    borderRadius: 3,
    marginRight: 6,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  classTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 28,
    marginBottom: 10,
  },
  instructorText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  timingText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '700',
  },
  progressContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60a5fa',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 6,
  },
  meetBtn: {
    backgroundColor: '#fbfbfb',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 8,
  },
  meetBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetBtnText: {
    color: '#110909',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  btnContent: {
    height: 44,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: THEME_COLORS.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 6,
  },
  tabLabelActive: {
    color: THEME_COLORS.primary,
  },
  badgeContainer: {
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  tabContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  infoBox: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCompleted: {
    backgroundColor: '#ecfdf5',
  },
  iconInProgress: {
    backgroundColor: '#eff6ff',
  },
  iconUpcoming: {
    backgroundColor: '#f8fafc',
  },
  moduleHeaderTextWrap: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  moduleSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },
  greenText: {
    color: '#16a34a',
    fontWeight: '700',
  },
  blueText: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  redText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  chevronWrap: {
    paddingLeft: 8,
  },
  moduleContent: {
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  topicTimelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 50,
    marginRight: 8,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  circleCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  circleInProgress: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  circleUpcoming: {
    borderColor: '#cbd5e1',
  },
  dayLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  topicContentCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  cardCompleted: {
    borderColor: '#e2e8f0',
  },
  cardInProgress: {
    borderColor: '#93c5fd',
  },
  cardUpcoming: {
    borderColor: '#f1f5f9',
    opacity: 0.8,
  },
  topicDateMeta: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  topicDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  resourcesSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  resourcesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resourcesHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 4,
  },
  resourceBtn: {
    paddingVertical: 4,
  },
  resourceBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceBtnText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
    marginLeft: 6,
  },
  inprogressAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  alertPingDot: {
    width: 6,
    height: 6,
    backgroundColor: '#2563eb',
    borderRadius: 3,
    marginRight: 6,
  },
  inprogressAlertText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '700',
    flex: 1,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  lectureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lectureDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  conductedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  conductedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a',
    textTransform: 'uppercase',
  },
  lectureTopic: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 4,
  },
  lectureNotes: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
  },
  watchBtn: {
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    marginTop: 12,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  taskCode: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  taskDeadlineRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  deadlineLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  taskDeadline: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  submitActionBtn: {
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    marginTop: 12,
  },
  submitActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  scoreRow: {
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderColor: '#a7f3d0',
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  remarksText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 4,
    fontWeight: '600',
  },
  submissionForm: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  subInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  subActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subHalfBtn: {
    flex: 0.48,
    borderRadius: 10,
  },
  submittedBox: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  viewLinkRow: {
    marginBottom: 4,
  },
  viewLinkText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  submittedRemarks: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 4,
  },
  lockedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginTop: 12,
  },
  lockedText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    marginRight: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
  },
});
