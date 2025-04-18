import os
from typing import Dict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

OUTPUT_PATHS = {
    'reports': os.path.join(OUTPUT_DIR, 'reports')
}

MODEL_SETTINGS = {
    'embedding_model': 'bert-base-multilingual-cased',
    'max_length': 512,
    'pooling': 'cls',
    'lambda_bias': 1.0,
    
    'gbm_params': {
        'n_estimators': [50, 100, 200],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [3, 4, 5],
        'min_samples_split': [2, 5]
    },
    
    'sample_dims': 50,
    
    'shap_nsamples': 500,
    'top_contributors': 10,
    
    'gpt_model': 'gpt-4o-mini',
    'gpt_temperature': 0.2,
    'gpt_max_tokens': 800
}

DEFAULT_SKILLS = [
    # ─────────────────────────────── Programming Languages ───────────────────────────────
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust",
    "kotlin", "swift", "objective-c", "php", "ruby", "scala", "groovy", "perl",
    "bash", "powershell", "dart", "lua", "haskell", "elixir", "clojure", "f#",
    "matlab", "r", "julia",

    # ──────────────────────────────── Web / Front‑End ────────────────────────────────────
    "html", "css", "sass", "less", "bootstrap", "tailwind", "material ui",
    "react", "next.js", "react native", "vue", "nuxt", "angular", "svelte",
    "ember", "backbone", "jquery", "webpack", "vite", "gulp", "grunt",

    # ─────────────────────────────── Back‑End & Frameworks ───────────────────────────────
    "node.js", "express", "nest.js", "fastify", "hapi.js", "django", "flask",
    "fastapi", "pyramid", "spring", "spring boot", "laravel", "symfony", "rails",
    "sinatra", "dotnet", ".net core", "asp.net", "phoenix", "gin", "fiber",
    "play framework", "grails",

    # ─────────────────────────────────── Mobile ──────────────────────────────────────────
    "android", "ios", "swiftui", "flutter", "ionic", "cordova", "kotlin",

    # ────────────────────────────────── Databases ────────────────────────────────────────
    # Relational
    "sql", "mysql", "postgresql", "sqlite", "mariadb", "oracle", "sql server",
    "aurora", "redshift",
    # NoSQL / NewSQL / Time‑series / Graph / Search
    "mongodb", "cassandra", "dynamodb", "redis", "memcached", "couchdb",
    "elasticsearch", "solr", "neo4j", "arangodb", "influxdb", "timescaledb",
    "clickhouse", "snowflake", "bigquery", "druid", "kylin",

    # ─────────────────────────── Messaging & Streaming ───────────────────────────────────
    "kafka", "rabbitmq", "activemq", "sqs", "sns", "pubsub", "azure service bus",
    "nats", "pulsar", "kinesis",

    # ─────────────────────────────── DevOps / Cloud ──────────────────────────────────────
    "docker", "docker compose", "kubernetes", "openshift", "helm", "istio",
    "linkerd", "ansible", "terraform", "pulumi", "cloudformation", "packer",
    "vagrant", "chef", "puppet", "saltstack",
    "jenkins", "github actions", "gitlab ci", "circleci", "travis", "argo cd",
    "spinnaker", "flux", "ci/cd",
    # Cloud Providers & Services
    "aws", "ec2", "s3", "lambda", "ecs", "eks", "rds", "route 53", "cloudfront",
    "cloudwatch",
    "azure", "azure devops", "azure functions", "azure service fabric",
    "gcp", "gke", "app engine", "cloud run", "cloud build",
    "digitalocean", "heroku", "netlify", "render", "cloudflare", "firebase",
    "supabase",

    # ────────────────────────────── Observability ────────────────────────────────────────
    "prometheus", "grafana", "loki", "elk", "logstash", "kibana",
    "splunk", "datadog", "new relic", "appdynamics", "sentry",
    "jaeger", "zipkin", "opentelemetry",

    # ───────────────────────────── Big‑Data & Analytics ──────────────────────────────────
    "hadoop", "mapreduce", "hdfs", "spark", "pyspark", "flink", "beam",
    "hive", "pig", "presto", "trino", "druid",

    # ──────────────────────── Machine‑Learning & Data Science ────────────────────────────
    "machine learning", "deep learning", "nlp", "computer vision", "data science",
    "statistics", "pandas", "numpy", "scipy", "matplotlib", "seaborn",
    "scikit-learn", "sklearn", "tensorflow", "pytorch", "keras", "jax", "mxnet",
    "huggingface", "xgboost", "lightgbm", "catboost", "gensim", "spacy", "nltk",
    "data analysis", "data visualization", "model training", "model evaluation",
    "mlflow",

    # MLOps & Workflow Orchestration
    "kubeflow", "sagemaker", "vertex ai", "dvc", "airflow", "prefect",

    # ──────────────────────────────── Security ───────────────────────────────────────────
    "cybersecurity", "penetration testing", "ethical hacking", "owasp",
    "encryption", "ssl", "tls", "key management", "iam", "authentication",
    "authorization", "sso", "oauth", "saml", "jwt", "acls", "firewall",
    "ids", "ips", "siem", "kali linux", "mitre att&ck",

    # ─────────────────────────────── Networking ─────────────────────────────────────────
    "tcp/ip", "udp", "http", "https", "websocket", "dns", "dhcp", "ssh",
    "smtp", "ftp", "sftp", "snmp", "bgp", "ospf", "load balancing",
    "reverse proxy", "haproxy", "nginx",

    # ───────────────────────── Testing / QA / Reliability ───────────────────────────────
    "unit testing", "integration testing", "e2e testing", "tdd", "bdd",
    "selenium", "cypress", "playwright", "pytest", "unittest", "jest",
    "mocha", "chai", "junit", "testng", "robot framework", "gatling",
    "locust", "k6", "sre", "site reliability engineering",

    # ─────────────────────────────── Version Control ────────────────────────────────────
    "git", "github", "gitlab", "bitbucket", "mercurial", "svn",

    # ──────────────────────────── IDEs / Editors ────────────────────────────────────────
    "vscode", "intellij", "webstorm", "pycharm", "android studio", "xcode",
    "eclipse", "vim", "emacs",

    # ─────────────────────────── Project / Agile / PM ───────────────────────────────────
    "scrum", "agile", "kanban", "safe", "waterfall",
    "jira", "confluence", "trello", "asana", "monday.com", "notion",

    # ───────────────────────────── UX / UI / Design ─────────────────────────────────────
    "figma", "sketch", "adobe xd", "accessibility", "design systems",

    # ─────────────────── Virtualization / OS / Infrastructure ───────────────────────────
    "linux", "ubuntu", "debian", "centos", "red hat", "windows", "macos",
    "freebsd", "vmware", "hyper-v", "kvm", "xen",

    # ────────────────────────────── Architecture ────────────────────────────────────────
    "microservices", "rest", "grpc", "graphql", "soap", "serverless",
    "event-driven architecture", "domain driven design", "data engineering",
    "etl", "elt", "data warehousing", "data lake",

    # ────────────────────────────── Soft Skills ─────────────────────────────────────────
    "problem solving", "critical thinking", "communication", "teamwork",
    "leadership", "collaboration", "time management", "mentoring",
    "documentation"
]

GENDERED_TERMS = {
    "he": "they", "she": "they", "his": "their", "her": "their",
    "him": "them", "man": "person", "woman": "person", "boy": "child",
    "girl": "child", "male": "person", "female": "person", 
    "father": "parent", "mother": "parent", "businessman": "businessperson",
    "businesswoman": "businessperson", "chairman": "chairperson",
    "chairwoman": "chairperson", "sir": "person", "madam": "person",
    "gentleman": "person", "lady": "person", "husband": "spouse",
    "wife": "spouse", "son": "child", "daughter": "child"
}

GENDER_WORD_PAIRS = [
    ("male", "female"), ("man", "woman"), ("boy", "girl"),
    ("he", "she"), ("his", "hers"), ("father", "mother"),
    ("son", "daughter"), ("uncle", "aunt"), ("husband", "wife"),
    ("gentleman", "lady"), ("king", "queen"), ("actor", "actress"),
    ("prince", "princess"), ("waiter", "waitress"), ("lord", "lady")
]

ATTRIBUTE_SETS = {
    "career": ["executive", "management", "professional", "salary", "office"],
    "family": ["home", "parents", "children", "family", "marriage"]
}

def create_output_folders() -> Dict[str, str]:
    for folder_path in OUTPUT_PATHS.values():
        os.makedirs(folder_path, exist_ok=True)
        print(f"Created folder: {folder_path}")
    
    return OUTPUT_PATHS