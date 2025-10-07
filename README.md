# **STEAMLENS : Real-Time Log Analytics Platform**

## **Use Case**

Imagine a platform that ingests application logs (or tweets, or sensor data) in real-time, processes them, caches hot data, and makes them searchable.
This mimics the **log analytics systems** used in production monitoring, social media analytics, and distributed systems debugging.

---

## **Architecture**

1. **Producer Service (Node.js / Python / Java)**

   * Reads log/events (could be random generated logs or API data like Twitter/Reddit).
   * Pushes them into **Kafka topics** for real-time streaming.

2. **Consumer Service (Java Spring Boot / Python)**

   * Listens to Kafka topic.
   * Stores incoming logs in **Elasticsearch** for full-text search.
   * Stores frequently accessed logs / stats in **Redis** (e.g., most recent 100 logs, error counts).

3. **REST API Layer (Spring Boot / Express.js)**

   * `/search` → Query Elasticsearch (full-text search, filters, time range).
   * `/latest` → Fetch hot data from Redis (fast response).
   * `/stats` → Fetch aggregated metrics (like number of errors/minute) from Redis.

4. **Frontend (Optional, React / Angular)**

   * Real-time dashboard: visualize logs and metrics.

---

### **Tech Stack**

* **Kafka** → Event streaming
* **Elasticsearch** → Store and query logs/text
* **Redis** → Caching & counters for real-time metrics
* **Spring Boot / Node.js** → Backend services
* **Docker Compose** → Run all services locally

---

### **Example Flow**

1. A microservice produces 100 logs/sec and pushes them to Kafka.
2. Kafka consumer writes the logs into Elasticsearch for persistence.
3. Consumer also increments counters in Redis (e.g., error logs per minute).
4. REST API exposes search and metrics endpoints.
5. Frontend shows:

   * Live error counts (from Redis).
   * Search logs by keyword, timestamp, or severity (from Elasticsearch).

---

### **Milestones**

* ✅ **Phase 1**: Set up Kafka producer + consumer (dummy log generator).
* ✅ **Phase 2**: Store data in Elasticsearch (index logs with fields like timestamp, severity, message).
* ✅ **Phase 3**: Use Redis for caching and counters.
* ✅ **Phase 4 (Optional)**: Add REST API + frontend dashboard.

---

### **GitHub-Ready README**

When you push this project, your README should highlight:

* “Real-time distributed log analytics system using **Kafka (streaming), Elasticsearch (search), Redis (caching)**.”
* Show architecture diagram.
* Example API calls.
* Docker setup for quick run.

---
