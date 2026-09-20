# Decoder — Machine Learning Engineer

> **Building systems that learn.**

Personal portfolio and engineering showcase focused on **Machine Learning, Backend Engineering, AI Systems, and Production ML Infrastructure**.

**Live Portfolio:** `[My Portfolio](https://SofHack.github.io)`

---

## Engineering Dashboard

| Area | Current Focus |
|---|---|
| Role | Machine Learning Engineer |
| Primary Language | Python |
| ML | PyTorch · TensorFlow · Scikit-learn |
| Backend | FastAPI · REST APIs · Async Python |
| Data | PostgreSQL · MySQL · MongoDB · Pandas |
| Infrastructure | Docker · Redis · Linux |
| Development | Git · GitHub · Bash · Testing |
| Current Direction | Production ML / AI Engineering |

---

## Portfolio Traffic

Portfolio traffic is tracked separately from GitHub repository traffic.

### Weekly Visitors

**Analytics:** `Add your GoatCounter/Plausible dashboard here`

> Visitor statistics are provided by the configured analytics service and represent portfolio traffic, not GitHub repository views.

### Dashboard

```text
┌─────────────────────────────────────────────────────────┐
│                  PORTFOLIO ANALYTICS                     │
├──────────────────────┬──────────────────────────────────┤
│ Visitors this week   │              --                  │
│ Page views           │              --                  │
│ Returning visitors   │              --                  │
│ Avg. session         │              --                  │
├──────────────────────┴──────────────────────────────────┤
│                                                         │
│  Mon   Tue   Wed   Thu   Fri   Sat   Sun                │
│   ░     ░     ░     ░     ░     ░     ░                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

The live numbers are intentionally loaded from the analytics provider rather than hard-coded into this repository.

---

## About

I am a Machine Learning Engineer with a background in Information Technology and software development.

My work is moving toward the intersection of:

```text
Machine Learning
       +
Backend Engineering
       +
AI Applications
       +
Production Infrastructure
```

I am particularly interested in what happens **after a model has been trained**:

- How should inference be served?
- How should APIs handle concurrent requests?
- Where should caching happen?
- How should model workers scale?
- How should latency be measured?
- How should failures be handled?
- How can ML systems become reproducible and maintainable?

---

## Current Engineering Focus

### Production ML Inference

Currently exploring a production-oriented architecture:

```text
                    Client
                       │
                       ▼
              ┌────────────────┐
              │    FastAPI     │
              │  API Gateway   │
              └───────┬────────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
        ┌──────────┐      ┌──────────┐
        │  Redis   │      │  Queue   │
        │  Cache   │      │ / Tasks  │
        └────┬─────┘      └────┬─────┘
             │                 │
             └────────┬────────┘
                      ▼
              ┌──────────────┐
              │ ML Worker    │
              │ PyTorch      │
              └──────┬───────┘
                     │
                     ▼
              Prediction API
```

The learning process focuses on:

- Async API design
- Model inference
- Redis caching
- Worker architecture
- Docker
- Performance testing
- Latency optimization
- Monitoring
- Production deployment

---

## Featured Projects

### 01 — Production ML Inference API

Production-oriented ML serving architecture using:

`FastAPI` · `PyTorch` · `Redis` · `Docker`

Focus:

- Async inference
- Model workers
- Caching
- Request handling
- Performance measurement
- Production architecture

---

### 02 — GitaLens

A local AI system designed around semantic understanding rather than hard-coded question answering.

Pipeline:

```text
User Query
    ↓
Query Analysis
    ↓
Intent Detection
    ↓
Concept Extraction
    ↓
Semantic Retrieval
    ↓
Verse Retrieval
    ↓
Reranking
    ↓
Metaphysical Analysis
    ↓
Answer Generation
    ↓
Response Formatting
```

Technology direction:

`Python` · `FastAPI` · `NLP` · `Semantic Retrieval`

---

### 03 — NetTrace

Network visualization system using real traceroute information.

```text
Domain
   ↓
Traceroute
   ↓
IP Addresses
   ↓
Geolocation
   ↓
World Map
   ↓
Route Visualization
```

Technology:

`FastAPI` · `Traceroute` · `JavaScript` · `Leaflet`

---

### 04 — AI LMS

AI-powered learning management system combining:

- Backend APIs
- Machine learning pipelines
- Student profiling
- Data processing
- Model evaluation
- Software engineering workflows

Technology:

`Python` · `FastAPI` · `ML` · `PostgreSQL`

---

## Technical Stack

### Machine Learning

```text
PyTorch
TensorFlow
Scikit-learn
NLP
RNN
Model Evaluation
Feature Engineering
```

### Backend

```text
Python
FastAPI
REST APIs
AsyncIO
Flask
```

### Data

```text
PostgreSQL
MySQL
MongoDB
Pandas
NumPy
SQL
```

### Infrastructure

```text
Docker
Redis
Linux
CI/CD
Load Testing
```

### Development

```text
Git
GitHub
Bash
pytest
Unit Testing
Debugging
Documentation
```

### Web

```text
HTML
CSS
JavaScript
Leaflet
Jekyll
GitHub Pages
```

---

## Engineering Philosophy

```text
        BUILD
          │
          ▼
        TEST
          │
          ▼
       MEASURE
          │
          ▼
        DEBUG
          │
          ▼
       OPTIMIZE
          │
          ▼
      DOCUMENT
          │
          └──────────► BUILD AGAIN
```

I prefer learning through complete systems rather than isolated tutorials.

A technology becomes useful when I can understand:

**how it works → how it fails → how to test it → how to deploy it → how to improve it.**

---

## Learning Journey

```text
Information Technology
          │
          ▼
Software Development
          │
          ▼
Backend / APIs
          │
          ▼
Machine Learning
          │
          ▼
AI Applications
          │
          ▼
Production ML Systems
          │
          ▼
ML Engineering
```

The current goal is to strengthen the engineering layer around machine learning and become capable of taking an ML idea from **prototype → API → deployment → monitoring → optimization**.

---

## Repository

This repository contains the source code for the personal portfolio hosted through GitHub Pages.

```text
SofHack.github.io/
│
├── index.html
├── style.css
├── app.js
│
├── assets/
│   ├── images/
│   └── resume/
│
├── README.md
├── LICENSE
└── .gitignore
```

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
cd YOUR_USERNAME.github.io
```

For a simple static website, start a local server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

No framework or package installation is required for the basic portfolio.

---

## Deployment

The website is designed for **GitHub Pages**.

Typical deployment:

```text
Git Push
   ↓
GitHub Repository
   ↓
GitHub Pages
   ↓
Public Portfolio
