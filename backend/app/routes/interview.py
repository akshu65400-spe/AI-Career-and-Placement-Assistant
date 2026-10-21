import re

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class WrittenInterviewStart(BaseModel):
    difficulty: str
    category: str


class WrittenInterviewEvaluate(BaseModel):
    difficulty: str
    category: str
    question: str
    answer: str


class MockInterviewStart(BaseModel):
    role: str
    difficulty: str = "Medium"


class MockInterviewEvaluate(BaseModel):
    role: str
    difficulty: str
    question: str
    answer: str
    question_number: int


ANSWER_STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "being", "but",
    "by", "can", "could", "did", "do", "does", "for", "from", "had", "has",
    "have", "how", "i", "in", "is", "it", "its", "me", "my", "of", "on",
    "or", "our", "should", "that", "the", "their", "them", "there", "these",
    "they", "this", "those", "to", "was", "we", "were", "what", "when", "where",
    "which", "who", "why", "will", "with", "would", "you", "your", "tell", "about",
    "describe", "explain", "please", "one", "time", "situation", "way",
    "make", "made", "faced", "want", "worked",
}

ANSWER_TERM_HINTS = {
    "yourself": {"background", "experience", "education", "career", "skills", "role"},
    "introduce": {"background", "experience", "education", "career", "skills"},
    "summarize": {"summary", "background", "overview", "experience", "career"},
    "background": {"education", "experience", "career", "skills", "project"},
    "resume": {"education", "experience", "skills", "project", "role"},
    "strengths": {"skill", "ability", "reliable", "organized", "communication", "teamwork"},
    "weakness": {"improve", "learning", "develop", "challenge", "feedback"},
    "motivate": {"goal", "purpose", "growth", "learn", "impact", "team"},
    "stress": {"prioritize", "plan", "break", "calm", "deadline", "organize"},
    "handle": {"manage", "plan", "prioritize", "resolve", "respond"},
    "criticism": {"feedback", "improve", "learn", "reflect", "action"},
    "information": {"data", "facts", "context", "evidence"},
    "limited": {"incomplete", "constrained", "available", "tradeoff"},
    "difficult": {"challenge", "issue", "complex", "obstacle", "tough"},
    "technical": {"system", "software", "code", "api", "database", "algorithm", "project"},
    "job": {"role", "experience", "contribution", "company", "skill", "interest"},
    "career": {"goal", "growth", "learn", "lead", "develop", "skill"},
    "team": {"collaborate", "communication", "teammate", "shared", "coordinate"},
    "leadership": {"lead", "guide", "coordinate", "motivate", "decision"},
    "deadline": {"prioritize", "schedule", "plan", "task", "organize"},
    "decision": {"option", "choice", "tradeoff", "data", "risk", "consequence"},
    "variable": {"value", "store", "hold", "memory", "change", "data", "assignment"},
    "programming": {"code", "program", "software", "application"},
    "compiler": {"translate", "source", "machine", "compile", "code", "program"},
    "interpreter": {"execute", "line", "runtime", "translate", "code"},
    "object": {"class", "instance", "inheritance", "polymorphism", "encapsulation"},
    "function": {"reusable", "block", "parameter", "argument", "return", "call"},
    "database": {"data", "table", "query", "record", "store", "storage"},
    "api": {"interface", "endpoint", "request", "response", "client", "server"},
    "git": {"version", "commit", "branch", "repository", "control", "history"},
    "operating": {"system", "process", "resource", "memory"},
    "structure": {"array", "list", "tree", "graph", "collection"},
    "problem": {"issue", "challenge", "bug", "error", "obstacle", "failure", "slow", "performance"},
    "solved": {"resolve", "fixed", "debug", "solution", "implemented", "root", "optimized", "reduced", "addressed"},
    "debug": {"error", "bug", "log", "trace", "inspect", "reproduce", "test", "fix"},
    "sql": {"query", "relational", "table", "database", "join"},
    "nosql": {"document", "key", "value", "mongodb", "schema", "scale"},
    "rest": {"http", "endpoint", "request", "response", "stateless", "resource"},
    "machine": {"learning", "model", "training", "dataset", "feature", "prediction"},
    "complexity": {"algorithm", "runtime", "input", "growth", "big", "efficiency", "performance"},
    "project": {"built", "developed", "designed", "implemented", "created", "contribution"},
    "contribution": {"built", "developed", "designed", "implemented", "created", "role"},
    "failure": {"mistake", "learned", "improve", "recovered", "lesson"},
    "conflict": {"disagreement", "communicate", "listen", "resolve", "compromise"},
}


def _stem_answer_word(word: str) -> str:
    if len(word) > 5 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 5 and word.endswith("ing"):
        root = word[:-3]
        if len(root) > 2 and root[-1] == root[-2]:
            root = root[:-1]
        return root + "e" if root.endswith("v") else root
    if len(word) > 5 and word.endswith("ved"):
        return word[:-1]
    if len(word) > 4 and word.endswith("ed"):
        return word[:-2]
    if len(word) > 4 and word.endswith("s"):
        return word[:-1]
    return word


def evaluate_answer_relevance(question: str, answer: str) -> tuple[int, float]:
    """Score answer depth while capping answers that do not match the question."""
    answer_words = {
        _stem_answer_word(word)
        for word in re.findall(r"[a-z0-9+#]+", answer.lower())
        if word not in ANSWER_STOP_WORDS
    }
    question_words = list(dict.fromkeys(
        word for word in re.findall(r"[a-z0-9+#]+", question.lower())
        if word not in ANSWER_STOP_WORDS and len(word) > 1
    ))
    if not answer_words:
        return 0, 0.0

    matched_concepts = sum(
        1
        for word in question_words
        if _stem_answer_word(word) in answer_words
        or any(
            _stem_answer_word(hint) in answer_words
            for hint in ANSWER_TERM_HINTS.get(word, set())
        )
    )
    if question_words and matched_concepts == 0:
        return 0, 0.0
    relevance = min(1.0, matched_concepts / min(3, max(1, len(question_words))))

    word_count = len(re.findall(r"[a-z0-9+#]+", answer.lower()))
    if word_count < 4:
        depth_score = 10
    elif word_count < 8:
        depth_score = 30
    elif word_count < 15:
        depth_score = 50
    elif word_count < 30:
        depth_score = 70
    else:
        depth_score = min(90, 75 + (word_count - 30) // 10)

    if not question_words:
        return depth_score, 1.0
    if relevance < 0.34:
        return min(depth_score, 10), relevance
    if relevance < 0.67:
        return min(depth_score, 35), relevance
    return depth_score, relevance


# =========================================================
# WRITTEN INTERVIEW QUESTIONS
# =========================================================

written_questions = {

    "Technical": {
        "Beginner": [
            "What is a variable in programming?",
            "What is the difference between a compiler and an interpreter?",
            "What is object-oriented programming?",
            "What is a function?",
            "What is a database?",
            "What is an API?",
            "What is Git?",
            "What is an operating system?",
            "What is a data structure?",
            "Why is problem solving important in programming?"
        ],

        "Intermediate": [
            "Explain the difference between SQL and NoSQL databases.",
            "What is REST API and how does it work?",
            "Explain inheritance and polymorphism.",
            "What is normalization in DBMS?",
            "Explain time complexity.",
            "What is the difference between authentication and authorization?",
            "How does HTTP work?",
            "What is indexing in a database?",
            "Explain the difference between process and thread.",
            "How would you debug a web application?"
        ],

        "Advanced": [
            "How would you design a scalable web application?",
            "How would you handle millions of API requests?",
            "Explain microservices architecture.",
            "How would you optimize a slow database query?",
            "How would you secure a REST API?",
            "How would you design a highly available application?",
            "Explain database sharding.",
            "How would you handle a production failure?",
            "How would you design an efficient caching system?",
            "Explain the CAP theorem."
        ]
    },

    "Behavioral": {
        "Beginner": [
            "Tell me about yourself.",
            "What are your strengths?",
            "What is one weakness you are working on?",
            "Why do you want this job?",
            "Where do you see yourself in five years?",
            "What motivates you?",
            "How do you handle stress?",
            "Why should we hire you?",
            "What are your career goals?",
            "Tell me about your hobbies."
        ],

        "Intermediate": [
            "Tell me about a difficult problem you solved.",
            "Describe a time when you worked in a team.",
            "Tell me about a failure and what you learned from it.",
            "How do you handle deadlines?",
            "How do you handle disagreement with a teammate?",
            "Tell me about a time you showed leadership.",
            "How do you prioritize your work?",
            "How do you handle criticism?",
            "Describe a challenging project.",
            "How do you deal with pressure?"
        ],

        "Advanced": [
            "Tell me about a situation where you had to make a difficult decision.",
            "Describe a conflict you faced in a team and how you resolved it.",
            "Tell me about a major failure and how you recovered from it.",
            "Describe a situation where you had to lead a team.",
            "How would you handle an unreasonable deadline?",
            "Tell me about a time you disagreed with your manager.",
            "How would you handle failure in a critical project?",
            "Describe a situation where you had limited information but had to make a decision.",
            "How would you motivate a team member who is not performing?",
            "Why should we select you over other candidates?"
        ]
    },

    "Data Science": {
        "Beginner": [
            "What is machine learning?",
            "What is a dataset?",
            "What is regression?",
            "What is classification?",
            "What is data preprocessing?",
            "What is a feature?",
            "What is a target variable?",
            "What is supervised learning?",
            "What is unsupervised learning?",
            "Why is data preprocessing important?"
        ],

        "Intermediate": [
            "Explain the difference between classification and regression.",
            "What is overfitting and how can you prevent it?",
            "Explain precision and recall.",
            "What is cross-validation?",
            "How would you handle missing values?",
            "What is feature scaling?",
            "What is SMOTE?",
            "Explain the confusion matrix.",
            "What is feature engineering?",
            "How do you evaluate a machine learning model?"
        ],

        "Advanced": [
            "How would you handle a highly imbalanced dataset?",
            "How would you select the most important features?",
            "Explain the bias-variance trade-off.",
            "How would you improve a model with poor recall?",
            "How would you deploy a machine learning model into production?",
            "How would you optimize a machine learning pipeline?",
            "How would you handle data leakage?",
            "How would you compare multiple machine learning models?",
            "How would you improve a model with low precision?",
            "How would you monitor a machine learning model in production?"
        ]
    },

    "HR Interview": {
        "Beginner": [
            "Tell me about yourself.",
            "Why do you want to join our company?",
            "What are your strengths?",
            "What is your weakness?",
            "Why should we hire you?",
            "What are your career goals?",
            "Where do you see yourself in five years?",
            "What motivates you?",
            "Tell me about your hobbies.",
            "Are you comfortable working in a team?"
        ],

        "Intermediate": [
            "Tell me about a challenging situation you faced.",
            "How do you handle pressure?",
            "How do you manage deadlines?",
            "Tell me about a time you worked in a team.",
            "How do you handle criticism?",
            "Describe a failure and what you learned.",
            "How do you resolve conflicts?",
            "What makes you different from other candidates?",
            "How do you prioritize your tasks?",
            "What are your expectations from this job?"
        ],

        "Advanced": [
            "Why should we hire you instead of another candidate?",
            "How would you handle a conflict with your manager?",
            "Describe a major professional failure and what you learned.",
            "How would you react if you disagreed with an important company decision?",
            "How would you handle a very demanding deadline?",
            "Describe a time you demonstrated leadership.",
            "How would you handle a teammate who is not contributing?",
            "What would you do if you made a serious mistake at work?",
            "How would you respond to negative feedback?",
            "Why should we trust you with an important responsibility?"
        ]
    }
}


# =========================================================
# WRITTEN INTERVIEW - START
# =========================================================

@router.post("/start")
def start_written_interview(
    data: WrittenInterviewStart
):

    category = data.category

    if category not in written_questions:
        category = "Technical"

    difficulty = data.difficulty

    if difficulty not in written_questions[category]:
        difficulty = "Beginner"

    questions = written_questions[category][difficulty]

    return {
        "question": questions[0],
        "questions": questions,
        "total_questions": len(questions)
    }


# =========================================================
# WRITTEN INTERVIEW - EVALUATE
# =========================================================

@router.post("/evaluate")
def evaluate_written_interview(
    data: WrittenInterviewEvaluate
):
    answer = data.answer.strip()
    if not answer:
        return {
            "score": 0,
            "feedback": "No answer was provided.",
            "improvements": ["Provide an answer that addresses the question."],
        }

    score, relevance = evaluate_answer_relevance(data.question, answer)
    if relevance < 0.34:
        feedback = "This answer does not appear to address the question, so it received a low relevance score."
        improvements = [
            "Answer the specific question directly.",
            "Include the key concept and explain it with a relevant example.",
        ]
    elif score < 50:
        feedback = "Your answer is on topic but needs more explanation and detail."
        improvements = ["Explain your reasoning.", "Add a relevant example."]
    elif score < 75:
        feedback = "Your answer addresses the question; strengthen it with more detail or an example."
        improvements = ["Add relevant technical details.", "Give a practical example."]
    else:
        feedback = "Your answer is relevant and detailed."
        improvements = ["Keep the answer focused and support key points with examples."]

    return {
        "score": score,
        "feedback": feedback,
        "improvements": improvements
    }


# =========================================================
# MOCK INTERVIEW QUESTIONS
# =========================================================

mock_questions = {

    "technical": {

        "Easy": [
            "Tell me about yourself and your technical background.",
            "What programming languages do you know?",
            "What is the difference between a compiler and an interpreter?",
            "What is object-oriented programming?",
            "What is a variable in programming?",
            "What is a database?",
            "What is an API?",
            "What is Git?",
            "What is an operating system?",
            "Why do you want to work in software development?"
        ],

        "Medium": [
            "Tell me about a technical project you have developed.",
            "Explain the difference between SQL and NoSQL databases.",
            "What is a REST API and how does it work?",
            "How do you debug an application?",
            "How would you improve the performance of a web application?",
            "Explain authentication and authorization.",
            "What is the purpose of HTTP status codes?",
            "What is normalization in DBMS?",
            "Explain time complexity.",
            "How would you design a basic web application?"
        ],

        "Hard": [
            "How would you design a scalable software application?",
            "How would you handle millions of API requests?",
            "How would you design a distributed database system?",
            "How would you improve the security of a web application?",
            "Explain the trade-offs between microservices and monolithic architecture.",
            "How would you optimize a slow database query?",
            "How would you design a highly available application?",
            "How would you handle a production failure?",
            "How would you design an efficient caching system?",
            "How would you secure a REST API?"
        ]
    },

    "behavioral": {

        "Easy": [
            "Tell me about yourself.",
            "What are your strengths?",
            "What is one weakness you are working on?",
            "Why do you want this job?",
            "Where do you see yourself in five years?",
            "What motivates you?",
            "How do you handle stress?",
            "Why should we hire you?",
            "What are your career goals?",
            "Tell me about your hobbies."
        ],

        "Medium": [
            "Tell me about a difficult problem you solved.",
            "Describe a time when you worked in a team.",
            "Tell me about a failure and what you learned from it.",
            "How do you handle deadlines?",
            "How do you handle disagreement with a teammate?",
            "Tell me about a time you showed leadership.",
            "How do you prioritize your work?",
            "How do you handle criticism?",
            "Describe a challenging project.",
            "How do you deal with pressure?"
        ],

        "Hard": [
            "Tell me about a situation where you had to make a difficult decision.",
            "Describe a conflict you faced in a team and how you resolved it.",
            "Tell me about a major failure and how you recovered from it.",
            "Describe a situation where you had to lead a team.",
            "How would you handle an unreasonable deadline?",
            "Tell me about a time you disagreed with your manager.",
            "How would you handle failure in a critical project?",
            "Describe a situation where you had limited information but had to make a decision.",
            "How would you motivate a team member who is not performing?",
            "Why should we select you over other candidates?"
        ]
    },

    "data science": {

        "Easy": [
            "Tell me about your interest in data science.",
            "What is machine learning?",
            "What is a dataset?",
            "What is regression?",
            "What is classification?",
            "What is data preprocessing?",
            "What is a feature?",
            "What is a target variable?",
            "What is supervised learning?",
            "What is unsupervised learning?"
        ],

        "Medium": [
            "Explain the difference between classification and regression.",
            "What is overfitting and how can you prevent it?",
            "Explain precision and recall.",
            "What is cross-validation?",
            "How would you handle missing values?",
            "What is feature scaling?",
            "What is SMOTE?",
            "Explain the confusion matrix.",
            "What is feature engineering?",
            "How do you evaluate a machine learning model?"
        ],

        "Hard": [
            "How would you handle a highly imbalanced dataset?",
            "How would you select the most important features?",
            "Explain the bias-variance trade-off.",
            "How would you improve a model with poor recall?",
            "How would you deploy a machine learning model into production?",
            "How would you optimize a machine learning pipeline?",
            "How would you handle data leakage?",
            "How would you compare multiple machine learning models?",
            "How would you improve a model with low precision?",
            "How would you monitor a machine learning model in production?"
        ]
    },

    "hr interview": {

        "Easy": [
            "Tell me about yourself.",
            "Why do you want to join our company?",
            "What are your strengths?",
            "What is your weakness?",
            "Why should we hire you?",
            "What are your career goals?",
            "Where do you see yourself in five years?",
            "What motivates you?",
            "Tell me about your hobbies.",
            "Are you comfortable working in a team?"
        ],

        "Medium": [
            "Tell me about a challenging situation you faced.",
            "How do you handle pressure?",
            "How do you manage deadlines?",
            "Tell me about a time you worked in a team.",
            "How do you handle criticism?",
            "Describe a failure and what you learned.",
            "How do you resolve conflicts?",
            "What makes you different from other candidates?",
            "How do you prioritize your tasks?",
            "What are your expectations from this job?"
        ],

        "Hard": [
            "Why should we hire you instead of another candidate?",
            "How would you handle a conflict with your manager?",
            "Describe a major professional failure and what you learned.",
            "How would you react if you disagreed with an important company decision?",
            "How would you handle a very demanding deadline?",
            "Describe a time you demonstrated leadership.",
            "How would you handle a teammate who is not contributing?",
            "What would you do if you made a serious mistake at work?",
            "How would you respond to negative feedback?",
            "Why should we trust you with an important responsibility?"
        ]
    }
}


# =========================================================
# MOCK INTERVIEW - START
# =========================================================

@router.post("/mock/start")
def start_mock_interview(
    data: MockInterviewStart
):

    role = data.role.lower().strip()

    difficulty_map = {
        "Beginner": "Easy",
        "Intermediate": "Medium",
        "Advanced": "Hard",
        "Easy": "Easy",
        "Medium": "Medium",
        "Hard": "Hard"
    }

    difficulty = difficulty_map.get(
        data.difficulty,
        "Medium"
    )

    questions = mock_questions.get(
        role,
        mock_questions["technical"]
    )

    selected_questions = questions.get(
        difficulty,
        questions["Medium"]
    )

    return {
        "question": selected_questions[0],
        "questions": selected_questions,
        "total_questions": len(selected_questions),
        "role": data.role,
        "difficulty": difficulty
    }


# =========================================================
# MOCK INTERVIEW - EVALUATE
# =========================================================

@router.post("/mock/evaluate")
def evaluate_mock_interview(
    data: MockInterviewEvaluate
):
    answer = data.answer.strip()
    if not answer:
        return {
            "score": 0,
            "feedback": "No answer was provided.",
            "improvement": "Provide an answer that addresses the question.",
        }

    percent_score, relevance = evaluate_answer_relevance(data.question, answer)
    score = round(percent_score / 10)
    if relevance < 0.34:
        feedback = "This answer appears unrelated to the question and received a low relevance score."
        improvement = "Address the question directly and support your answer with a relevant example."
    elif score < 5:
        feedback = "Your answer is relevant but needs more explanation and detail."
        improvement = "Explain your reasoning and give a practical example."
    elif score < 8:
        feedback = "Your answer addresses the question; add more detail to strengthen it."
        improvement = "Include relevant details and a specific example."
    else:
        feedback = "Your answer is relevant and well developed."
        improvement = "Keep the answer focused and concise."


    return {
        "score": score,
        "feedback": feedback,
        "improvement": improvement
    }